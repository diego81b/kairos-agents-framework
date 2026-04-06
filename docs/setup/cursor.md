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
│       ├── orchestrator.md
│       ├── pm-agent.md
│       ├── architect-agent.md
│       ├── implementer-agent.md
│       ├── code-reviewer.md
│       ├── test-verifier.md
│       └── release-planner.md
```

## Step 2 — How subagents are loaded

Cursor reads every `.md` file in `.cursor/agents/` (or `.claude/agents/`) and parses the YAML frontmatter:

```yaml
---
name: PM Agent
description: Collects and structures requirements. Use at the START of a new feature.
tools:
  - read_file
  - write_file
model: claude-sonnet-4-6
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

Each KAIROS agent writes its validated JSON output to `.kairos/` via the `write_file` tool listed in its frontmatter — automatic when you approve.

```
.kairos/
├── 01-requirements.json
├── 02-architecture.json
├── 03-implementation.json
├── 04-review.json
├── 05-test-verification.json
└── 06-deployment-plan.json
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
