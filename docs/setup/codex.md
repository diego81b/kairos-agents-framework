# OpenAI Codex CLI Setup

Codex CLI is OpenAI's open-source coding agent that runs locally in your terminal. It supports **native subagents** with context isolation and parallel execution, making it a strong alternative to Claude Code for running the KAIROS pipeline.

The key difference from Claude Code: agent files use **TOML format** in `.codex/agents/`, not Markdown with YAML frontmatter.

## Prerequisites

- Node.js 22+ installed
- Codex CLI installed: `npm install -g @openai/codex`
- ChatGPT Plus/Pro account (or OpenAI API key)

```bash
npm install -g @openai/codex
codex  # then sign in with ChatGPT or API key
```

## Step 1 — Create `.codex/agents/` directory

Codex loads custom agents from `.codex/agents/` (project-scoped) or `~/.codex/agents/` (global).

```bash
mkdir -p .codex/agents
```

## Step 2 — Convert KAIROS agents to TOML

Codex agent files use TOML, not Markdown. For each file in `agents/`, create a corresponding `.toml` in `.codex/agents/`:

**`.codex/agents/pm-agent.toml`:**
```toml
name = "pm_agent"
description = "Requirements gathering specialist. Use at the START of a new feature to collect and structure user stories, acceptance criteria, and constraints."
developer_instructions = """
[paste the body of agents/pm-agent.md here, excluding YAML frontmatter]
"""
model = "gpt-5.4"
sandbox_mode = "workspace-write"
```

Mapping from KAIROS Markdown frontmatter to TOML:

| Markdown frontmatter | TOML field |
|----------------------|------------|
| `name:` | `name` |
| `description:` | `description` |
| body (Markdown content) | `developer_instructions` |
| `model:` | `model` |

Repeat for all 7 agent files. Use underscores in `name` (e.g. `pm_agent`, `architect_agent`).

::: tip Keep `.md` files as source of truth
The `agents/` folder remains the canonical source. The `.codex/agents/*.toml` files are derived — regenerate them when you update the originals.
:::

## Step 3 — Add AGENTS.md for KAIROS context

Codex reads `AGENTS.md` at the project root before every run. Use it to inject the orchestrator instructions:

**`AGENTS.md`** (at project root):
```markdown
# KAIROS Framework

This project uses the KAIROS multi-agent development framework.
Agent definitions are in `agents/` (Markdown) and `.codex/agents/` (TOML for Codex).

Always follow the KAIROS workflow sequence:
pm_agent → architect_agent → implementer_agent → code_reviewer → test_verifier → release_planner

After each phase, present the output and wait for explicit approval (✅ / ✏️ / ⛔) before proceeding.
Save each approved output to `.kairos/0X-*.json`.
```

## Step 4 — Start a KAIROS session

Run Codex in your project directory:

```bash
codex
```

Then prompt:

```
Help me implement [your feature] using the KAIROS framework.
Start with pm_agent for requirements, then follow the full pipeline.
```

Codex reads `AGENTS.md`, knows the KAIROS workflow, and can spawn the specialist agents in sequence.

## Step 5 — HITL checkpoints

Codex spawns subagents **only when explicitly asked** — it does not auto-delegate. The HITL gate is enforced by `AGENTS.md` instructions and the individual agent `developer_instructions`.

After each phase you will see the agent's JSON output. Reply with:
- `✅` — approve and continue to the next phase
- `✏️ [feedback]` — request changes
- `⛔` — stop here

Codex will not proceed to the next agent without your explicit signal.

## Step 6 — Parallel review (optional)

Codex supports running multiple subagents concurrently. For the review phases:

```
Run code_reviewer and test_verifier in parallel on the current implementation,
then summarize both results.
```

Codex spawns both agents simultaneously and returns a consolidated response.

## Step 7 — Save `.kairos/` outputs

Codex can write files directly. After approving each phase, ask it to persist:

```
Save the requirements output to .kairos/01-requirements.json
```

Or add to each agent's `developer_instructions`:
```toml
developer_instructions = """
...
After the user approves, write the output to .kairos/01-requirements.json.
"""
```

## Feature comparison vs Claude Code

| Feature | Claude Code | Codex CLI |
|---------|------------|-----------|
| Native subagent support | ✅ `.claude/agents/*.md` | ✅ `.codex/agents/*.toml` |
| Context isolation per agent | ✅ | ✅ |
| Agent file format | Markdown + YAML frontmatter | **TOML** |
| Auto-delegation via `description` | ✅ Automatic | ⚠️ Requires explicit prompt |
| HITL built-in gate | ✅ Orchestrator-enforced | ⚠️ Via AGENTS.md instructions |
| Parallel subagents | ✅ | ✅ |
| `.kairos/` persistence | ✅ Automatic | ✅ Via explicit instruction |
| Cost | Claude subscription | ChatGPT Plus/Pro or API |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Agent not found | Check `.codex/agents/` contains `.toml` files with `name`, `description`, `developer_instructions` |
| Wrong agent invoked | Refine the `description` field — Codex uses it to decide when to delegate |
| HITL not respected | Add explicit wait instruction to `AGENTS.md` and each agent's `developer_instructions` |
| Codex not reading AGENTS.md | Run `codex --ask-for-approval never "Summarize the current instructions"` to verify |
