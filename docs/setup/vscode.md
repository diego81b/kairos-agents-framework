# VS Code Setup

VS Code with GitHub Copilot supports **native custom agents** via `.github/agents/` — `.agent.md` files with YAML frontmatter, each running in its own isolated context. VS Code also reads `.claude/agents/` for Claude-format compatibility.

::: tip `.claude/agents/` also works
VS Code detects `.md` files in `.claude/agents/` following the Claude sub-agents format. If you already set up KAIROS for Claude Code, VS Code picks up the same files automatically.

**Priority for deduplication:** `.github/agents/` > `.claude/agents/`
:::

## Prerequisites

- [VS Code](https://code.visualstudio.com) installed
- [GitHub Copilot extension](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) installed
- GitHub Copilot subscription ($10/mo)
- Project open in VS Code with `agents/` from KAIROS

## Step 1 — Copy agents to `.github/agents/`

VS Code uses `.agent.md` extension, but also detects plain `.md` files in `.github/agents/`:

```bash
mkdir -p .github/agents .github/skills
cp path/to/kairos/agents/*.md .github/agents/
cp -r path/to/kairos/skills/* .github/skills/
```

Copy the `skills/` folder too. Agent bodies link to their shared skills as `../skills/<name>/SKILL.md`, a path resolved from the agent file's own folder, so from `.github/agents/` it lands in `.github/skills/`. The orchestrator reads eight `orchestrator-*` skills in many runs and every phase agent opens with `agent-contract` and writes through `artifact-template`: without the folder they fail. If you use `.claude/agents/` instead, copy the skills to `.claude/skills/`.

Or use `.claude/agents/` if you already have Claude Code set up.

Project layout with native VS Code format:

```
your-project/
├── .github/
│   └── agents/
│       ├── orchestrator-agent.agent.md
│       ├── pm-agent.agent.md
│       ├── architect-agent.agent.md
│       ├── context-extractor-agent.agent.md   <- Pre-pipeline: full-repo context (standalone)
│       ├── implementer-tdd-agent.agent.md    <- TDD implementer (default)
│       ├── implementer-coder-agent.agent.md  <- Code-first implementer (code, then the tests the project calls for)
│       ├── code-reviewer-agent.agent.md
│       ├── security-reviewer-agent.agent.md  <- Adversarial security review (optional, read-only)
│       ├── test-verifier-agent.agent.md
│       ├── qa-plan-agent.agent.md
│       ├── release-planner-agent.agent.md
│       ├── documentation-agent.agent.md      <- Feature-facing docs (optional, Phase 6b)
│       ├── retrospective-agent.agent.md      <- Standalone, post-pipeline: lessons capture
│       ├── improvement-advisor-agent.agent.md <- Standalone, infrequent: framework change proposals
│       ├── impact-assessment-agent.agent.md  <- Pre-pipeline: issue grounding, facts for the derivation (dispatched by the orchestrator)
│       ├── bug-triage-agent.agent.md         <- Bug reproduction + root cause (standalone)
│       └── dependency-audit-agent.agent.md   <- Standalone, periodic: dependency + tech-debt backlog
```

## Step 2 — Agent file format

The shipped files use Claude's frontmatter, which VS Code reads as it is:

```yaml
---
name: pm-agent
description: "Analyzes feature requirements and elicits constraints. Use when you have a vague feature request that needs structured analysis."
tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion
model: sonnet
---
```

VS Code's native `.agent.md` format adds fields beyond Claude's, among them `handoffs`, which shows buttons that switch to another agent with a pre-filled prompt (Step 3).

VS Code maps Claude tool names to its own:

| Claude tools | VS Code equivalent |
|-------------|--------------------|
| `Read`, `Grep`, `Glob` | `read`, `search` |
| `Write`, `Edit` | `edit` |
| `Bash` | `execute` (shell) |

## Step 3 — Handoffs (optional, standalone agents only)

Do not wire a handoff chain between the pipeline agents. The orchestrator owns the gates and the dispatch, and it derives each agent at the point in the run where its facts exist, so a hardwired `pm-agent → architect-agent → ...` chain would bypass the Start Gate and the derivation, and most runs skip some of those agents.

A handoff is useful for a standalone agent that hands its result to the orchestrator. For example, in `context-extractor-agent.agent.md`:

```yaml
handoffs:
  - label: "Start the KAIROS run with this context"
    agent: orchestrator-agent
    prompt: "Run the pipeline for the issue above. Reuse 00-context.md."
    send: false
```

## Step 4 — Start a KAIROS session

Open a new Copilot Chat, select the **Orchestrator** agent from the dropdown, and give it the request with no agent list:

```
Add Stripe payments to the checkout, issue #42
```

Start it from a fresh chat with the Orchestrator selected, not by mentioning it inside a conversation already in progress, where it would run as a subagent of that chat (this page has not run that case). The orchestrator measures the change, derives which agents run, shows its Start Gate and dispatches the subagents itself. VS Code has no `AskUserQuestion`, so its gates use the text menu (Approve / Request changes / Skip next / Stop pipeline); reply as plain text. Three gates continue on their own when no check finds anything to decide (the bug triage, the requirements, the last wave of Phase 3) and print what they accepted; `every gate` brings the question back.

## Step 5 — `.kairos/` persistence

Each agent whose `tools` include `Write` or `Edit` saves its own output to `.kairos/<feature_folder>/` through its "Write to Project" step, with no extra instructions. The two read-only agents (`impact-assessment-agent`, `security-reviewer-agent`) cannot write, so the orchestrator writes their artifacts, and it alone writes `ledger/run.md` and `_tracking.md`.

Six project settings (`autonomy`, `manual-qa`, `qa-dir`, `test-changed`, `cleanup`, `project-summary`) work here like on every host; see [Customizing KAIROS](/customizing). The `model.` lines do not, because VS Code takes the model from each agent's `model:` field.

## Feature comparison vs Claude Code

| Feature | Claude Code | VS Code + Copilot |
|---------|------------|-------------------|
| Native subagent format | ✅ `.claude/agents/` | ✅ `.github/agents/*.agent.md` |
| Context isolation per agent | ✅ | ✅ |
| Auto-delegation via `description` | ✅ | ✅ |
| HITL built-in gate | ✅ Orchestrator-enforced, `AskUserQuestion` | ⚠️ Orchestrator-enforced, text-menu gates (no `AskUserQuestion`); `handoffs` only for standalone agents |
| `.kairos/` persistence | ✅ Automatic | ✅ Via each agent's own Write step when `edit` is in its `tools` |
| Claude format compatibility | ✅ Native | ✅ Reads `.claude/agents/*.md` |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Agents not in dropdown | Check `.github/agents/` has `.agent.md` files with valid frontmatter |
| Handoff buttons not appearing | Verify `handoffs:` is in agent frontmatter and `agent` tool is in `tools:` |
| Wrong agent format | Plain `.md` files work in `.github/agents/` but `.agent.md` unlocks full features |
| `.kairos/` not written | Check that `edit` (`Write`/`Edit` in the shipped files) is in the agent's `tools:`; the two read-only agents never write, the orchestrator does it for them |
| An agent reports it can't find `../skills/<name>/SKILL.md` | Copy `skills/` into `.github/skills/` (or `.claude/skills/`), see Step 1 |

## Suggested Models

VS Code uses model IDs from the Copilot model picker. The `model:` field in agent frontmatter sets the model for that specific agent regardless of what is active in the chat panel.

Same reasoning/execution split as the shipped `agents/*.md` frontmatter — see [Customizing models](/setup/claude-code#customizing-models) for the full rationale.

| Agent | Recommended | Non-Claude equivalent |
|-------|------------|----------------------|
| `orchestrator-agent` | `opus` | o1, o3, Gemini Ultra |
| `architect-agent` | `opus` | o1, o3, Gemini Ultra — system design needs strongest model |
| `context-extractor-agent` | `opus` | o1, o3, Gemini Ultra |
| `impact-assessment-agent` | `opus` | o1, o3, Gemini Ultra — its facts drive the derivation of every downstream agent |
| `security-reviewer-agent` | `opus` | o1, o3, Gemini Ultra — adversarial analysis needs strongest model |
| `improvement-advisor-agent` | `opus` | o1, o3, Gemini Ultra |
| `bug-triage-agent` | `opus` | o1, o3, Gemini Ultra |
| `pm-agent` | `sonnet` | GPT-4o, Gemini 1.5 Pro |
| `implementer-tdd-agent` | `sonnet` | GPT-4o, Gemini 1.5 Pro |
| `implementer-coder-agent` | `sonnet` | GPT-4o, Gemini 1.5 Pro — no test-first overhead |
| `code-reviewer-agent` | `sonnet` | GPT-4o, Gemini 1.5 Pro |
| `test-verifier-agent` | `sonnet` | GPT-4o, Gemini 1.5 Pro |
| `qa-plan-agent` | `sonnet` | GPT-4o, Gemini 1.5 Pro |
| `release-planner-agent` | `sonnet` | GPT-4o, Gemini 1.5 Pro |
| `documentation-agent` | `sonnet` | GPT-4o, Gemini 1.5 Pro |
| `retrospective-agent` | `sonnet` | GPT-4o, Gemini 1.5 Pro |
| `dependency-audit-agent` | `sonnet` | GPT-4o, Gemini 1.5 Pro |

::: warning Layered Mode not supported
VS Code does not run KAIROS Layered Mode (`agents/team/`, called Team Mode until v9.5.0). The orchestrator offers it only on Claude Code, and these agents are not mirrored for VS Code. Use the single implementer.
:::
