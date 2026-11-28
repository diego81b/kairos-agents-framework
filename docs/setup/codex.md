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
mkdir -p .codex/agents .codex/skills
cp -r path/to/kairos/skills/* .codex/skills/
```

Copy the `skills/` folder too. Agent bodies link to their shared skills as `../skills/<name>/SKILL.md`, and the orchestrator reads seven `orchestrator-*` skills in many runs; every phase agent opens with `agent-contract` and writes through `artifact-template`. A TOML file holds the body as text, so the link has no agent-file folder to resolve from: Step 3 tells Codex where the folder is.

## Step 2 — Convert KAIROS agents to TOML

Codex agent files use TOML, not Markdown. For each file in `agents/`, create a corresponding `.toml` in `.codex/agents/`:

**`.codex/agents/pm_agent.toml`:**
```toml
name = "pm_agent"
description = "Analyzes feature requirements and elicits constraints. Use when you have a vague feature request that needs structured analysis."
developer_instructions = """
[paste the body of agents/pm-agent.md here, excluding YAML frontmatter]
"""
model = "gpt-5.4"
sandbox_mode = "workspace-write"
```

Replace the `model` value with one your account offers; this page does not track Codex model names.

Mapping from KAIROS Markdown frontmatter to TOML:

| Markdown frontmatter | TOML field |
|----------------------|------------|
| `name:` | `name` (underscores) |
| `description:` | `description` |
| body (Markdown content) | `developer_instructions` |
| `model:` | `model` |
| `tools:` | no field; `sandbox_mode` is the closest control |

The two read-only agents, `impact-assessment-agent` and `security-reviewer-agent`, carry no `Write` or `Edit` in `tools:` and the orchestrator writes their artifacts; give them `sandbox_mode = "read-only"` (not run on this page).

Repeat for the 17 core agent files in `agents/` (skip `agents/team/`: the Layered Mode agents are offered only on Claude Code and are not mirrored for Codex). Use underscores in `name`, so the file ids are `orchestrator_agent`, `pm_agent`, `architect_agent`, `implementer_tdd_agent`, `implementer_coder_agent`, `code_reviewer_agent`, `test_verifier_agent`, `release_planner_agent` and so on. The orchestrator's body names its agents with hyphens (`pm-agent`); whether Codex matches that to `pm_agent` was not run here, so if a spawn fails, name the underscore id.

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

Start every feature through `orchestrator_agent`. It measures the change, derives which agents run, shows a Start Gate and dispatches the others. Do not run the pipeline in a fixed order and do not choose agents yourself.

Shared skills live in `.codex/skills/<name>/SKILL.md`. An agent instruction that links `../skills/<name>/SKILL.md` means that folder.

The orchestrator's gate offers four replies: Approve, Request changes, Skip next, Stop pipeline. Wait for the reply before the next phase. Three gates continue on their own when no check finds anything to decide (the bug triage, the requirements, the last wave of Phase 3): print what they accepted and go on. Gates that write outside `.kairos/` always ask.
Each agent saves its output to `.kairos/<feature_folder>/` — a Markdown file (YAML frontmatter + report body), never JSON.
```

## Step 4 — Start a KAIROS session

Run Codex in your project directory:

```bash
codex
```

Then prompt, with no agent list:

```
Add Stripe payments to the checkout, issue #42. Run orchestrator_agent.
```

Codex reads `AGENTS.md` and spawns `orchestrator_agent`. This page has not run the orchestrator's own dispatch under Codex; if it cannot spawn the other agents, ask Codex to spawn each agent the orchestrator names, one per Agent call it would have made.

## Step 5 — HITL checkpoints

Codex spawns subagents **only when explicitly asked** — it does not auto-delegate. The orchestrator's gates reach you as text, and `AGENTS.md` tells Codex to wait for the reply.

At each gate you see the agent's Summary block. Reply with one of:
- `Approve` — continue to the next phase
- `Request changes [feedback]` — regenerate with your feedback
- `Skip next` — skip the next agent
- `Stop pipeline` — stop here

Standalone agents print the same menu without Skip next. `every gate` brings the question back at the three gates that continue on their own.

## Step 6 — Parallel review (optional)

The orchestrator runs the review wave (`code_reviewer_agent`, `security_reviewer_agent`, `test_verifier_agent`) in parallel itself when the host lets it, and shows one combined gate. To do it by hand outside a run:

```
Run code_reviewer_agent and test_verifier_agent in parallel on the current implementation,
then summarize both results.
```

Codex spawns both agents simultaneously and returns a consolidated response.

## Step 7 — `.kairos/` outputs

Each agent whose `tools:` include `Write` or `Edit` saves its own output to `.kairos/<feature_folder>/` through its "Write to Project" step, so the TOML needs no extra instruction. The sandbox mode has to allow writing in the workspace (`workspace-write`). The two read-only agents cannot write, so the orchestrator writes their artifacts, and it alone writes `ledger/run.md` and `_tracking.md`.

Six project settings (`autonomy`, `manual-qa`, `qa-dir`, `test-changed`, `cleanup`, `project-summary`) work here like on every host; see [Customizing KAIROS](/customizing). The `model.` lines do not, because Codex takes the model from each agent's `model` field.

## Feature comparison vs Claude Code

| Feature | Claude Code | Codex CLI |
|---------|------------|-----------|
| Native subagent support | ✅ `.claude/agents/*.md` | ✅ `.codex/agents/*.toml` |
| Context isolation per agent | ✅ | ✅ |
| Agent file format | Markdown + YAML frontmatter | **TOML** |
| Auto-delegation via `description` | ✅ Automatic | ⚠️ Requires explicit prompt |
| HITL built-in gate | ✅ Orchestrator-enforced, `AskUserQuestion` | ⚠️ Orchestrator-enforced, text-menu gates; `AGENTS.md` tells Codex to wait |
| Parallel subagents | ✅ | ✅ |
| `.kairos/` persistence | ✅ Automatic | ✅ Via each agent's own Write step |
| Cost | Claude subscription | ChatGPT Plus/Pro or API |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Agent not found | Check `.codex/agents/` contains `.toml` files with `name`, `description`, `developer_instructions` |
| Wrong agent invoked | Refine the `description` field — Codex uses it to decide when to delegate |
| HITL not respected | Add an explicit wait instruction to `AGENTS.md`; the orchestrator's `developer_instructions` already carry the gate |
| An agent reports it can't find `../skills/<name>/SKILL.md` | Copy `skills/` into `.codex/skills/` and keep the `AGENTS.md` line that names the folder, see Steps 1 and 3 |
| Codex not reading AGENTS.md | Run `codex --ask-for-approval never "Summarize the current instructions"` to verify |
