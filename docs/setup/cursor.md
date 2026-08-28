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
mkdir -p .cursor/agents
copy agents\*.md .cursor\agents\
```

Or, if you already use Claude Code, skip this — Cursor reads `.claude/agents/` directly.

Project layout:

```
your-project/
├── .cursor/
│   └── agents/
│       ├── orchestrator-agent.md
│       ├── context-extractor-agent.md     ← Pre-pipeline: full-repo context (standalone)
│       ├── impact-assessment-agent.md     ← Pre-pipeline: issue grounding + recommendations (standalone)
│       ├── pm-agent.md
│       ├── architect-agent.md
│       ├── implementer-tdd-agent.md       ← TDD implementer (default)
│       ├── implementer-coder-agent.md     ← Code-only implementer (no test suite)
│       ├── code-reviewer-agent.md
│       ├── security-reviewer-agent.md     ← Adversarial security review (optional, read-only)
│       ├── test-verifier-agent.md
│       ├── release-planner-agent.md
│       ├── documentation-agent.md         ← Feature-facing docs (optional, Phase 6b)
│       ├── retrospective-agent.md         ← Standalone, post-pipeline: lessons capture
│       └── improvement-advisor-agent.md   ← Standalone, infrequent: framework change proposals
```

`agents/team/` (Team Mode) isn't included — see the warning at the bottom of this page.

## Step 2 — How subagents are loaded

Cursor reads every `.md` file in `.cursor/agents/` (or `.claude/agents/`) and parses the YAML frontmatter:

```yaml
---
name: PM Agent
description: Collects and structures requirements. Use at the START of a new feature.
tools:
  - read_file
  - write_file
model: sonnet
---
```

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

The orchestrator's `description` signals Cursor to delegate to it, which then coordinates the remaining subagents in sequence (PM → Architect → Implementer → Reviewer → Test Verifier → Release Planner).

### Explicit invocation

You can also invoke a specific agent with the `/name` syntax:

```
/pm-agent gather requirements for a user authentication feature
/architect-agent design the architecture for: [paste requirements]
```

## Step 4 — HITL checkpoints

The HITL gate is enforced by the agent definitions — each KAIROS agent ends with:

```
✅ Approve and continue to the next phase
✏️  Request changes (describe what to fix)
⛔  Stop here
```

You must respond with your choice. The orchestrator will not call the next agent until you explicitly approve.

## Step 5 — `.kairos/` persistence

Each KAIROS agent writes its validated output to `.kairos/<feature_folder>/` via the `write_file` tool listed in its frontmatter — automatic when you approve. The orchestrator derives `feature_folder` from the issue number and feature title at the start of every pipeline run. Every phase writes a single Markdown file: a small YAML frontmatter header (status, counts) followed by the human-readable report body (data model, issues, findings, runbook).

```
.kairos/
└── issue-42_add-stripe-payments/   ← one subfolder per feature
    ├── 01-requirements.md
    ├── 02-architecture.md
    ├── 03-implementation.md
    ├── 04-review.md
    ├── 05-test-verification.md
    └── 06-deployment-plan.md
```

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
| Explicit `/agent-name` invocation | ❌ | ✅ |
| Parallel subagents | ✅ | ✅ |
| `.kairos/` persistence | ✅ Automatic | ✅ Via `write_file` tool |
| HITL gate | ✅ Orchestrator-enforced | ⚠️ Via agent prompt wording |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Agents not found | Check `.cursor/agents/` exists with valid `.md` files |
| Wrong agent invoked | Refine the `description` — be more specific about when to use the agent |
| Agent not pausing for approval | Add "Always wait for explicit ✅ approval before proceeding" to the agent prompt |
| `.kairos/` not written | Ensure `write_file` is in the agent's `tools:` list |

## Suggested Models

Cursor accepts `inherit` (workspace default), `fast` (Haiku-class), or an explicit model ID. The `model:` field in agent frontmatter overrides whatever is selected in the Cursor UI.

Same reasoning/execution split as the shipped `agents/*.md` frontmatter — see [Customizing models](/setup/claude-code#customizing-models) for the full rationale.

| Agent | Recommended | Notes |
|-------|------------|-------|
| `orchestrator-agent` | `opus` | Never use `inherit` or `fast` — coordination requires full reasoning |
| `architect-agent` | `opus` | Never use `inherit` or `fast` — system design requires full reasoning |
| `context-extractor-agent` | `opus` | `fast` not recommended even for small codebases — full-repo scans benefit from stronger reasoning |
| `impact-assessment-agent` | `opus` | Never use `inherit` or `fast` — its recommendation drives every downstream agent's scope |
| `security-reviewer-agent` | `opus` | Never use `inherit` or `fast` — adversarial security analysis requires full reasoning |
| `improvement-advisor-agent` | `opus` | Rarely invoked; keep on `opus` for cross-feature pattern recognition |
| `pm-agent` | `sonnet` | `fast` acceptable for quick requirement sketches |
| `implementer-tdd-agent` | `sonnet` | Upgrade to `opus` for complex TDD cycles spanning many files |
| `implementer-coder-agent` | `sonnet` | `fast` not recommended; no TDD overhead but still needs solid reasoning |
| `code-reviewer-agent` | `sonnet` | Upgrade to `opus` for deep security audits |
| `test-verifier-agent` | `sonnet` | Sufficient for coverage analysis |
| `release-planner-agent` | `sonnet` | Sufficient for deployment planning |
| `documentation-agent` | `sonnet` | Sufficient for README/CHANGELOG/API-reference generation |
| `retrospective-agent` | `sonnet` | Sufficient for lessons synthesis from existing artifacts |

::: warning Team Mode not supported
Cursor does not support KAIROS Team Mode agents (`agents/team/`). Those require Claude Code with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.
:::
