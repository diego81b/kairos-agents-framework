# Setup Overview

KAIROS is a collection of Markdown files that define AI subagents. How those files become **functioning subagents** depends entirely on the tool you use.

## How subagent loading works

Each file in `agents/` is a Markdown document with a YAML frontmatter header:

```markdown
---
name: PM Agent
description: Collects and structures requirements. Use at the START of a new feature.
tools:
  - read_file
  - write_file
model: claude-sonnet-4-6
---

# PM Agent
...
```

The fields that matter:

| Field | Purpose |
|-------|---------|
| `name` | How the agent is referenced in the UI |
| `description` | Drives **automatic invocation** — the AI reads this to decide when to delegate |
| `tools` | What file/shell operations the subagent can run |
| `model` | Which LLM powers this agent (can differ per agent) |

## Tool comparison

| Tool | Native subagents | Context isolation | HITL pipeline | Setup effort |
|------|-----------------|-------------------|---------------|-------------|
| [Claude Code](./claude-code) | ✅ Full — `.claude/agents/` | ✅ Each agent = fresh context | ✅ Built-in, automatic | Low |
| [Cursor IDE](./cursor) | ✅ Full — `.cursor/agents/` | ✅ Each agent = fresh context | ⚠️ Via agent prompt wording | Low |
| [VS Code](./vscode) | ✅ Full — `.github/agents/` | ✅ Each agent = fresh context | ⚠️ Via handoffs/agent prompt | Low |
| [OpenAI Codex CLI](./codex) | ✅ Full — `.codex/agents/` (TOML) | ✅ Each agent = fresh context | ⚠️ Via AGENTS.md | Medium |
| [JetBrains](./jetbrains) | ⚠️ Preview — `.github/agents/` via Copilot | ⚠️ Depends on Copilot | ⚠️ Via agent prompt (no handoffs) | Medium |

::: tip Recommended: Claude Code, Cursor, or VS Code
**Claude Code**, **Cursor**, **VS Code**, and **OpenAI Codex CLI** all support native subagent contexts with context isolation. Claude Code offers the most seamless experience: auto-delegation and zero-config `.kairos/` persistence. Cursor adds explicit `/agent-name` invocation. VS Code adds `handoffs` buttons for native HITL. Codex CLI uses TOML format.

JetBrains support is in public preview — functionality may change.
:::

## What "HITL pipeline" means

HITL = Human-in-the-Loop. After each phase, the agent:

1. Presents its output to you
2. Asks: `✅ Approve / ✏️ Request changes / ⛔ Stop`
3. Waits for your explicit choice before calling the next agent

This is automatic in Claude Code (defined in `agents/orchestrator.md`). In other tools you enforce it manually by reading the output and deciding when to continue.

## Repository layout

```
your-project/
├── agents/              ← KAIROS agent definitions (source of truth)
│   ├── orchestrator.md
│   ├── pm-agent.md
│   ├── architect-agent.md
│   ├── implementer-agent.md
│   ├── code-reviewer.md
│   ├── test-verifier.md
│   └── release-planner.md
└── .kairos/             ← Created at runtime, holds JSON phase outputs
    └── issue-42_add-stripe/   ← one subfolder per feature
        ├── 01-requirements.json
        ├── 02-architecture.json
        ├── 03-implementation.json
        ├── 04-review.json
        ├── 05-test-verification.json
        └── 06-deployment-plan.json
```

The `agents/` folder lives at the **project root**. Each tool reads from it differently — see the individual setup pages for exact paths and steps.
