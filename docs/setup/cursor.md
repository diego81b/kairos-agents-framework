# Cursor IDE Setup

Cursor supports **native subagents** via `.cursor/agents/` — the same YAML frontmatter format as Claude Code. Each subagent runs in its own isolated context window with automatic delegation driven by the `description` field.

::: tip `.claude/agents/` also works
Cursor reads `.claude/agents/` as a compatibility path. If you already set up KAIROS for Claude Code, **Cursor picks up the same files automatically** — no duplication needed.

**Priority order:** `.cursor/agents/` > `.claude/agents/`
:::

## Prerequisites

- [Cursor](https://cursor.com) (Agent mode)
- A project open in Cursor with `agents/` from KAIROS

## Step 1 — Copy agents to `.cursor/agents/`

```bash
mkdir -p .cursor/agents .cursor/skills
cp path/to/kairos/agents/*.md .cursor/agents/
cp -r path/to/kairos/skills/* .cursor/skills/
```

Copy the `skills/` folder too. Agent bodies link to their shared skills as `../skills/<name>/SKILL.md`, a path resolved from the agent file's own folder, so from `.cursor/agents/` it lands in `.cursor/skills/`. The orchestrator reads five `orchestrator-*` skills in many runs and every phase agent opens with `agent-contract` and writes through `artifact-template`: without the folder they fail. If you use `.claude/agents/` instead, copy the skills to `.claude/skills/`.

Or, if you already use Claude Code, skip the agents copy — Cursor reads `.claude/agents/` directly.

Project layout:

```
your-project/
├── .cursor/
│   └── agents/
│       ├── orchestrator-agent.md
│       ├── context-extractor-agent.md     ← Pre-pipeline: full-repo context (standalone)
│       ├── impact-assessment-agent.md     ← Pre-pipeline: issue grounding, facts for the derivation (dispatched by the orchestrator)
│       ├── bug-triage-agent.md            ← Bug reproduction + root cause (standalone)
│       ├── pm-agent.md
│       ├── architect-agent.md
│       ├── implementer-tdd-agent.md       ← TDD implementer (default)
│       ├── implementer-coder-agent.md     ← Code-first implementer (code, then the tests the project calls for)
│       ├── code-reviewer-agent.md
│       ├── security-reviewer-agent.md     ← Adversarial security review (optional, read-only)
│       ├── test-verifier-agent.md
│       ├── qa-plan-agent.md
│       ├── release-planner-agent.md
│       ├── documentation-agent.md         ← Feature-facing docs (optional, Phase 6b)
│       ├── retrospective-agent.md         ← Standalone, post-pipeline: lessons capture
│       ├── improvement-advisor-agent.md   ← Standalone, infrequent: framework change proposals
│       └── dependency-audit-agent.md       ← Standalone, periodic: dependency + tech-debt backlog
```

`agents/team/` (Layered Mode) isn't included — see the warning at the bottom of this page.

## Step 2 — How subagents are loaded

Cursor reads every `.md` file in `.cursor/agents/` (or `.claude/agents/`) and parses the YAML frontmatter:

```yaml
---
name: pm-agent
description: "Analyzes feature requirements and elicits constraints. Use when you have a vague feature request that needs structured analysis."
tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion
model: sonnet
---
```

This is the shipped `pm-agent` frontmatter. The `name` is the `/name` invocation identifier, so keep it as shipped. The fields Cursor documents are the table below; the `tools:` line is what Claude Code reads, and this page has not verified how Cursor treats it.

The `description` field drives **automatic delegation** — Cursor's agent reads all descriptions and decides which subagent to invoke without you naming it explicitly.

Configuration fields supported by Cursor:

| Field | Purpose |
|-------|--------|
| `name` | Display name and `/name` invocation identifier |
| `description` | Controls when the agent auto-delegates |
| `model` | `inherit` (default), `fast`, or a specific model ID |
| `readonly` | `true` = no file writes or shell mutations |
| `is_background` | `true` = runs without blocking the parent |

## Step 3 — Start a KAIROS session

In Cursor Agent mode, type:

```
Help me implement [your feature] using the KAIROS framework
```

The orchestrator's `description` signals Cursor to delegate to it. It then measures the change, derives which agents run (a small fix may skip the PM and the architect entirely), shows its Start Gate and coordinates the subagents it chose. Give it the request and no agent list. Cursor runs it as a subagent, so its gates use the text-menu fallback (Step 4).

### Explicit invocation

You can also invoke a specific agent with the `/name` syntax. Use it for the standalone agents, which run outside the pipeline:

```
/context-extractor-agent scan this repo for the issue below: [paste issue]
/bug-triage-agent reproduce this report: [paste bug report]
/retrospective-agent capture the lessons of the feature in .kairos/issue-42_add-stripe-payments
```

Naming a pipeline agent directly (`/pm-agent`, `/architect-agent`) runs it without the Start Gate, the ledger or the derived selection.

## Step 4 — HITL checkpoints

The HITL gate is enforced by the agent definitions. The orchestrator's gate prints:

```
✅ Approve and continue to the next phase
✏️  Request changes (describe what to fix)
⏭️  Skip next (skip the next agent)
⛔  Stop pipeline
```

Reply with your choice. Standalone agents print the same menu without Skip next. Three gates continue on their own when no check finds anything to decide (the bug triage, the requirements, the last wave of Phase 3) and print what they accepted; `every gate` brings the question back. Every other gate waits for you, and the gates that write outside `.kairos/` (the documentation draft, the QA plan) always ask.

## Step 5 — `.kairos/` persistence

Each agent that can write saves its validated output to `.kairos/<feature_folder>/` with the `Write` tool in its frontmatter. The two read-only agents (`impact-assessment-agent`, `security-reviewer-agent`) cannot, so the orchestrator writes their artifacts. The orchestrator derives `feature_folder` from the issue number and feature title at the start of every pipeline run. Every phase writes a single Markdown file: a small YAML frontmatter header (status, counts) followed by the human-readable report body (data model, issues, findings, runbook).

```
.kairos/
└── issue-42_add-stripe-payments/   ← one subfolder per feature
    ├── 00b-impact.md               ← impact assessment (size, domains, test suite)
    ├── 01-requirements.md          ← only the phases that ran are present
    ├── 02-architecture.md
    ├── 03-implementation-plan.md
    ├── 03-implementation.md
    ├── 04-review.md
    ├── 05-test-verification.md
    ├── 06-deployment-plan.md
    ├── _tracking.md                ← status, log and issue alignment, for you
    ├── _usage.md                   ← model and tokens per agent (Claude Code only)
    └── ledger/                     ← constraints, decisions, open questions, run.md, loops.md
```

Three project settings (`manual-qa`, `qa-dir`, `test-changed`) work here like on every host; see [Customizing KAIROS](/customizing). The `model.` lines do not, because Cursor takes the model from each agent's `model:` field.

## Parallel execution

Cursor supports running subagents concurrently. For phases that can overlap:

```
Run the Code Reviewer and Test Verifier on the current implementation in parallel
```

Cursor spawns both subagents simultaneously and returns both results.

## Feature comparison vs Claude Code

| Feature | Claude Code | Cursor |
|---------|------------|--------|
| Native subagent format | ✅ `.claude/agents/` | ✅ `.cursor/agents/` (+ `.claude/agents/` compat) |
| Context isolation per agent | ✅ | ✅ |
| Auto-delegation via `description` | ✅ | ✅ |
| Explicit agent invocation | ✅ `@kairos:<agent>`, `claude --agent` | ✅ `/agent-name` |
| Parallel subagents | ✅ | ✅ |
| `.kairos/` persistence | ✅ Automatic | ✅ Via each agent's `Write` tool |
| HITL gate | ✅ Orchestrator-enforced | ⚠️ Via agent prompt wording |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Agents not found | Check `.cursor/agents/` exists with valid `.md` files |
| Wrong agent invoked | Refine the `description` — be more specific about when to use the agent |
| Agent not pausing for approval | Add "Always wait for explicit ✅ approval before proceeding" to the agent prompt |
| `.kairos/` not written | Ensure `Write` is in the agent's `tools:` list (the two read-only agents never write; the orchestrator does it for them) |
| An agent reports it can't find `../skills/<name>/SKILL.md` | Copy `skills/` into `.cursor/skills/` (or `.claude/skills/`), see Step 1 |

## Suggested Models

Cursor accepts `inherit` (workspace default), `fast` (Haiku-class), or an explicit model ID. The `model:` field in agent frontmatter overrides whatever is selected in the Cursor UI.

Same reasoning/execution split as the shipped `agents/*.md` frontmatter — see [Customizing models](/setup/claude-code#customizing-models) for the full rationale.

| Agent | Recommended | Notes |
|-------|------------|-------|
| `orchestrator-agent` | `opus` | Never use `inherit` or `fast` — coordination requires full reasoning |
| `architect-agent` | `opus` | Never use `inherit` or `fast` — system design requires full reasoning |
| `context-extractor-agent` | `opus` | `fast` not recommended even for small codebases — full-repo scans benefit from stronger reasoning |
| `impact-assessment-agent` | `opus` | Never use `inherit` or `fast` — its facts drive the orchestrator's derivation of every downstream agent |
| `security-reviewer-agent` | `opus` | Never use `inherit` or `fast` — adversarial security analysis requires full reasoning |
| `improvement-advisor-agent` | `opus` | Rarely invoked; keep on `opus` for cross-feature pattern recognition |
| `bug-triage-agent` | `opus` | Never downgrade — root-cause reasoning from partial evidence |
| `pm-agent` | `sonnet` | `fast` acceptable for quick requirement sketches |
| `implementer-tdd-agent` | `sonnet` | Upgrade to `opus` for complex TDD cycles spanning many files |
| `implementer-coder-agent` | `sonnet` | `fast` not recommended; no test-first overhead but still needs solid reasoning |
| `code-reviewer-agent` | `sonnet` | Upgrade to `opus` for deep security audits |
| `test-verifier-agent` | `sonnet` | Sufficient for coverage analysis |
| `qa-plan-agent` | `sonnet` | Sufficient for manual-case planning from known coverage gaps |
| `release-planner-agent` | `sonnet` | Sufficient for deployment planning |
| `documentation-agent` | `sonnet` | Sufficient for README/CHANGELOG/API-reference generation |
| `retrospective-agent` | `sonnet` | Sufficient for lessons synthesis from existing artifacts |
| `dependency-audit-agent` | `sonnet` | Scanning and tabulation; upgrade only for large monorepos with tangled transitive trees |

::: warning Layered Mode not supported
Cursor does not run KAIROS Layered Mode (`agents/team/`, called Team Mode until v9.5.0). The orchestrator offers it only on Claude Code, and these agents are not mirrored for Cursor. Use the single implementer.
:::
