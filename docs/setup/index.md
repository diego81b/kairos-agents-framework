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
model: sonnet
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
| [OpenCode](./opencode) | ✅ Full — `.opencode/agents/` | ✅ Each agent = fresh context | ⚠️ Via text-menu fallback (no `AskUserQuestion`) | Medium |
| [Kimi Code](./kimi-code) | ✅ Full — `.kimi-code/agents/` | ✅ Each agent = fresh context | ✅ Native `AskUserQuestion`, same as Claude Code | Low |
| [JetBrains](./jetbrains) | ⚠️ Preview — `.github/agents/` via Copilot | ⚠️ Depends on Copilot | ⚠️ Via agent prompt (no handoffs) | Medium |

::: tip Recommended: Claude Code, Cursor, VS Code, or Kimi Code
**Claude Code**, **Cursor**, **VS Code**, **OpenAI Codex CLI**, **OpenCode**, and **Kimi Code** all support native subagent contexts with context isolation. Claude Code offers the most seamless experience: auto-delegation and zero-config `.kairos/` persistence. Kimi Code is the closest match behind it: it accepts Claude-Code-style frontmatter as-is and has a native `AskUserQuestion`, so HITL gates work exactly like Claude Code's. Cursor adds explicit `/agent-name` invocation. VS Code adds `handoffs` buttons for native HITL. Codex CLI uses TOML format. OpenCode uses Markdown + YAML frontmatter like Claude Code, but with different fields and no `AskUserQuestion` equivalent.

JetBrains support is in public preview — functionality may change.
:::

## What "HITL pipeline" means

HITL = Human-in-the-Loop. After each phase, the agent:

1. Presents its output to you
2. Asks: `✅ Approve / ✏️ Request changes / ⛔ Stop`
3. Waits for your explicit choice before calling the next agent

This is automatic in Claude Code (defined in `agents/orchestrator-agent.md`). In other tools you enforce it manually by reading the output and deciding when to continue.

## Configuration

Every agent that opens its own output file for you (either standalone or via the Orchestrator's HITL step) runs `${KAIROS_EDITOR:-code} "path/to/output.md"` — set the `KAIROS_EDITOR` environment variable to override the `code` default, e.g. `code-insiders`, `cursor`, or `subl`, if that's not the editor you want opened.

## Invocation contract

Regardless of the tool, three rules apply when **you** (the calling session) start a KAIROS run:

1. **Invoke the orchestrator with the bare feature request only.** Never pre-select phases or agents in the invocation prompt — agent selection is a human decision made at the orchestrator's Step 0e gate. A caller-supplied list is treated as an unconfirmed proposal, never as authorization.
2. **Never launch the orchestrator backgrounded or detached — and never invoke it by name inside an existing conversation.** Every phase ends at a HITL gate that needs a live human. Where `AskUserQuestion` is unavailable (including Claude Code spawned subagents), gates degrade to the text-menu fallback — and a backgrounded run has nobody reading it, so the pipeline would hang or silently skip gates. In Claude Code specifically, `@agent-name`/"use the X agent" typed mid-chat degrades gates the same way an explicit background launch does — both dispatch through the `Agent` tool as a subagent, which unconditionally loses `AskUserQuestion`. Start the session with the orchestrator as its **primary** agent instead; see the [Claude Code setup guide](/setup/claude-code#step-3-start-a-kairos-session) for the exact command.
3. **Run the standalone agents yourself, if you want them.** `context-extractor-agent` and `impact-assessment-agent` run before the pipeline; `retrospective-agent` and `improvement-advisor-agent` run after work stops. The orchestrator never auto-invokes any of the four.

## Repository layout

```
your-project/
├── agents/              ← KAIROS agent definitions (source of truth)
│   ├── orchestrator-agent.md
│   ├── context-extractor-agent.md  ← Pre-pipeline: full-repo context (standalone)
│   ├── impact-assessment-agent.md  ← Pre-pipeline: issue grounding (standalone)
│   ├── pm-agent.md
│   ├── architect-agent.md
│   ├── implementer-tdd-agent.md    ← TDD implementer (default)
│   ├── implementer-coder-agent.md  ← Code-only implementer (no test suite)
│   ├── code-reviewer-agent.md
│   ├── security-reviewer-agent.md  ← Adversarial security review (optional)
│   ├── test-verifier-agent.md
│   ├── release-planner-agent.md
│   ├── documentation-agent.md      ← Feature-facing docs (optional, Phase 6b)
│   ├── retrospective-agent.md      ← Lessons capture (standalone, post-pipeline)
│   ├── improvement-advisor-agent.md ← Framework change proposals (standalone, infrequent)
│   └── team/             ← Team Mode specialists (Claude Code only)
├── .opencode/agents/     ← OpenCode mirror of the 14 core agents above (see Setup > OpenCode)
├── .kimi-code/agents/    ← Kimi Code mirror of the 14 core agents above (see Setup > Kimi Code)
└── .kairos/              ← Created at runtime, holds phase outputs (Markdown with frontmatter)
    └── issue-42_add-stripe/   ← one subfolder per feature
        ├── 01-requirements.md
        ├── 02-architecture.md
        ├── 03-implementation.md
        ├── 04-review.md
        ├── 05-test-verification.md
        └── 06-deployment-plan.md
```

The `agents/` folder lives at the **project root**. Each tool reads from it differently — see the individual setup pages for exact paths and steps.
