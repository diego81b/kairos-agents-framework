# Kimi Code Setup

[Kimi Code](https://www.kimi.com/code/docs/en/) is Moonshot AI's terminal coding agent (CLI + TUI). It supports **native custom agents** with context isolation, defined in Markdown with YAML frontmatter — and of every tool KAIROS supports, its agent format is the **closest match to Claude Code's**: `name`, `description`, and a comma-separated `tools:` list are all valid as-is, the tool names are identical (`Read`, `Write`, `Edit`, `Bash`, `Grep`, `Glob`, `AskUserQuestion` all exist), and unknown frontmatter fields are ignored rather than rejected.

Two differences matter for KAIROS:

- **Model selection is symbolic, not concrete.** Kimi Code agent files cannot name a model id — the `model_preference: primary|secondary` field resolves at spawn time to the Kimi models configured in your `config.toml` (see Step 3). Claude Code's `model: opus|sonnet` aliases have no equivalent and are ignored if left in.
- **`AskUserQuestion` is native.** Unlike OpenCode, Kimi Code has its own `AskUserQuestion` tool, so every KAIROS HITL gate takes its primary branch — the same interactive approval dialog you get in Claude Code, no text-menu fallback needed.

## Prerequisites

- Kimi Code CLI installed and authenticated — see the [official docs](https://www.kimi.com/code/docs/en/kimi-code-cli/guides/getting-started.html)
- A configured Kimi model (e.g. `kimi-code/k3` as `default_model` — set up during login)

## Step 1 — Copy agents to `.kimi-code/agents/`

KAIROS ships a ready-made Kimi Code agent pack at [`.kimi-code/agents/`](https://github.com/diego81b/kairos-agents-framework/tree/main/.kimi-code/agents) in this repository — the 17 core pipeline agents, already converted. Copy the whole folder into your project:

```bash
# From your project root
mkdir -p .kimi-code/agents
cp path/to/kairos/.kimi-code/agents/*.md .kimi-code/agents/
```

Or globally, at `~/.kimi-code/agents/` (or the cross-tool `~/.agents/agents/`), if you want KAIROS available in every project. Project-level files win over user-level ones with the same `name`.

::: tip Keep `agents/` as source of truth
`agents/` (Claude-Code-canonical) remains the source of truth. `.kimi-code/agents/*.md` is a derived mirror maintained by hand — any edit to an `agents/*.md` file must update its `.kimi-code/agents/` counterpart in the same change. If you maintain your own copy instead of pulling updates from this repo, re-copy after KAIROS updates.
:::

::: warning No Layered Mode mirror
`agents/team/*.md` (the 5 Layered Mode files, called Team Mode until v9.5.0) are **not** mirrored here, the same status as in the OpenCode pack. The reason that once justified this, their dependence on Claude Code's Agent Teams feature, is gone since v9.5.0: the orchestrator now runs the mode as plain subagent calls in stages. But nobody has run Layered Mode on Kimi Code, so mirroring the files is a separate decision, deferred for now. The mirrored orchestrator offers the mode only on Claude Code, so nothing in this pack asks for it. See Step 8.
:::

## Step 2 — How the frontmatter was converted

The mapping below is what actually produced the files in `.kimi-code/agents/` — reference it when you update an agent and need to re-derive its Kimi Code counterpart by hand:

| KAIROS field | Kimi Code field | Notes |
|---|---|---|
| `name:` | `name:` | Direct copy — supported natively (it would default to the kebab-case filename anyway). |
| `description:` | `description:` | Direct copy — Kimi Code's main agent reads it for auto-delegation, same as Claude Code. |
| `tools: CSV` | `tools:` CSV | Direct copy — Kimi Code accepts the comma-separated form, and every tool KAIROS lists (`Read`, `Write`, `Edit`, `Bash`, `Grep`, `Glob`, `AskUserQuestion`, `Agent`) exists under the same name. `orchestrator-agent.md` is the one file that lists `Agent` — it needs it to invoke `@kairos:*` subagents itself; every other agent stays a leaf and never lists it. |
| `model: opus` | `model_preference: primary` | **Symbolic** — resolves to your session's main model (`default_model` in `config.toml`, e.g. a Kimi K-series model). Used for the 7 reasoning-heavy agents: `orchestrator`, `architect`, `bug-triage`, `context-extractor`, `impact-assessment`, `security-reviewer`, `improvement-advisor`. |
| `model: sonnet` | `model_preference: secondary` | **Symbolic** — resolves to `[secondary_model] model` in `config.toml` (typically a cheaper Kimi model). Used for the 10 execution agents: `pm`, `implementer-tdd`, `implementer-coder`, `code-reviewer`, `test-verifier`, `qa-plan`, `release-planner`, `documentation`, `retrospective`, `dependency-audit`. |
| `mcp__<server>__*` (in `tools:`) | `mcp__<server>__*` | Direct copy — Kimi Code uses the same `mcp__<server>__<tool>` naming as Claude Code, and matches a bare `mcp__<server>__*` as a glob for the whole server. Note a *bare* `mcp__<server>` (no trailing `__*`) matches nothing in Kimi Code — always keep the wildcard suffix. Currently only `test-verifier-agent` declares MCP tools (`chrome-devtools`, `playwright` — see [Skills & MCP Enhancements](../skills-mcp.md)); the server still needs to be configured on the Kimi Code side (see its [MCP docs](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/mcp.html)) for the grant to do anything. |

One fully worked example — `pm-agent.md`:

**Source (`agents/pm-agent.md`):**
```markdown
---
name: pm-agent
description: "Analyzes feature requirements and elicits constraints. Use when you have a vague feature request that needs structured analysis."
tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion
model: sonnet
---
```

**Converted (`.kimi-code/agents/pm-agent.md`, shipped as-is in this repo):**
```markdown
---
name: pm-agent
description: "Analyzes feature requirements and elicits constraints. Use when you have a vague feature request that needs structured analysis."
tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion
model_preference: secondary
---
```
*(followed by the unchanged body of `agents/pm-agent.md`)*

Note what's **not** in the converted file: any Claude/Anthropic model id. Unlike the OpenCode mirror (which points at `anthropic/claude-*` models), the Kimi Code pack contains no concrete model names at all — `model_preference` never names one by design; it always resolves to the Kimi models you configured.

## Step 3 — Configure Kimi models (optional)

The Claude Code pack's model lines (`model.<agent>` in `.kairos-cfg/config`) have no effect here: the orchestrator ignores it and says so at the Start Gate. The `model_preference` mapping below is the model setting on Kimi Code.

`model_preference` only differentiates agents when Kimi Code's secondary-model experiment is enabled and a secondary model is configured. In `~/.kimi-code/config.toml`:

```toml
default_model = "kimi-code/k3"        # → model_preference: primary

[secondary_model]
model = "kimi-code/kimi-k2.5"         # → model_preference: secondary
```

```bash
export KIMI_CODE_EXPERIMENTAL_SECONDARY_MODEL=1   # or KIMI_CODE_EXPERIMENTAL_FLAG=1
```

In the interactive TUI, `/secondary_model` opens a picker that writes the `[secondary_model]` section for you.

`[secondary_model]` also accepts patch fields applied only to subagents (e.g. `default_effort = "low"` or `max_output_size` to rein in token spend), and both values can be overridden per-launch via the `KIMI_SECONDARY_MODEL` / `KIMI_SECONDARY_EFFORT` environment variables — handy for trying a cheaper tier without editing `config.toml`.

Without the flag or a configured secondary, every subagent simply inherits the caller's model — KAIROS works identically, just with one model for all phases. The mapping above is how you reproduce KAIROS's strong-model/cheap-model split (opus-class → main model, sonnet-class → secondary) using your own Kimi models.

## Step 4 — Add `AGENTS.md` for KAIROS context

Kimi Code reads `AGENTS.md` natively from the project root (also `.kimi-code/AGENTS.md`, and a global `~/.kimi-code/AGENTS.md`).

**`AGENTS.md`** (at project root):
```markdown
# KAIROS Framework

This project uses the KAIROS multi-agent development framework.
Agent definitions are in `agents/` (Markdown, canonical) and `.kimi-code/agents/` (Kimi Code copies).

Start every feature through `orchestrator-agent`, with the feature request and no agent list.
It derives which agents run from the facts of the change and asks you at its Start Gate;
never run the pipeline by hand in a fixed order, because most runs skip some agents.

Wait for the orchestrator's gate (Approve / Request changes / Skip next / Stop pipeline) before any agent is called.
Each approved output is saved under `.kairos/<feature_folder>/`.
```

## Step 5 — Start a KAIROS session

Run Kimi Code with the orchestrator as the main agent:

```bash
kimi --agent orchestrator-agent
```

Give it the request with no agent list: it derives the agents, shows its Start Gate and dispatches the subagents itself. A default session also discovers the 17 custom agents and can route to them by `description`, but that bypasses the Start Gate, the ledger and the derived selection, so use it only for a standalone agent (`context-extractor-agent`, `retrospective-agent`). To bind one file for a single launch, use `kimi --agent-file path/to/agent.md`.

The orchestrator is bound at session creation and restored on resume (`kimi --continue` / `--session`) — no flag needed on resume, and none is allowed.

## Step 6 — HITL checkpoints

Kimi Code has a native `AskUserQuestion` tool, so every gated agent takes its **primary branch** — the interactive approval dialog, same as Claude Code:

```
Requirements ready — how do you want to proceed?
❯ Approve (Recommended)
  Request changes
  Skip next
  Stop pipeline
```

Three gates continue on their own when no check finds anything to decide (the bug triage, the requirements, the last wave of Phase 3) and print what they accepted; `every gate` brings the question back. The text-menu fallback in each agent body (for Cursor, Codex CLI, OpenCode, …) is never needed here. One caveat straight from the orchestrator's own Hard Constraints: HITL gates require a live human, so don't run the orchestrator inside backgrounded/detached or scheduled executions — the gate would hang or be silently bypassed. Interactive TUI sessions are the supported mode.

## Step 7 — Copy the shared skills

Agent bodies link to shared skill files relative to their own location. The orchestrator reads seven `orchestrator-*` skills in many runs, every phase agent opens with [`agent-contract`](../skills/agent-contract/SKILL.md) and writes through [`artifact-template`](../skills/artifact-template/SKILL.md), and `architect-agent` works through [`contract-checklist`](../skills/contract-checklist/SKILL.md) before defining API contracts. Without the folder the orchestrator and the phase agents fail, so this step is required. That path is resolved from wherever the agent file actually lives, not from this repo's root — so from `.kimi-code/agents/architect-agent.md`, `../skills/contract-checklist/SKILL.md` resolves to `.kimi-code/skills/contract-checklist/SKILL.md`, not the top-level `skills/`. Kimi Code discovers skills from `.kimi-code/skills/` (project) or `~/.kimi-code/skills/` (user) — copy the whole shared skills folder there:

```bash
mkdir -p .kimi-code/skills
cp -r path/to/kairos/skills/* .kimi-code/skills/
```

This keeps every agent body's relative skill references working, and registers each one as a native Kimi Code skill invocable via the `Skill` tool.

## Step 8 — Parallel review and Layered Mode

Kimi Code's `Agent` tool dispatches subagents and `AgentSwarm` runs them in parallel — so the "parallel review" pattern works here better than on most non-Claude tools. Layered Mode (`agents/team/*.md`, a lead plus layer agents run in stages) no longer depends on Claude Code's Agent Teams, since the orchestrator runs it as plain subagent calls, but nobody has run it on Kimi Code, so the pack ships no Layered Mode mirror and the mirrored orchestrator offers the mode only on Claude Code. If you want it on Kimi Code, treat it as its own piece of work: mirror the files and check the stage dispatch against `Agent`/`AgentSwarm`.

## Step 9 — Save `.kairos/` outputs

Every agent that can write has its own "Write to Project" step that saves its output to `.kairos/<feature_folder>/0X-*.md`; the pack's `tools:` lists include `Write` everywhere the canonical files do. The two read-only agents (`impact-assessment-agent`, `security-reviewer-agent`) have no `Write`, so the orchestrator writes their artifacts, and it alone writes `ledger/run.md` and `_tracking.md`.

Six project settings work here like on every host: `autonomy`, `manual-qa`, `qa-dir`, `test-changed`, `cleanup` and `project-summary` (see [Customizing KAIROS](/customizing)). The `model.` lines do not: use Step 3.

## Note on `${VAR}` placeholders in agent bodies

Kimi Code renders agent bodies as templates, substituting `${var}` placeholders from live context — but **unknown variables are left verbatim**. The `${BITBUCKET_USER}:${BITBUCKET_TOKEN}` curl examples in every agent's "Issue Tracker Comment" section are therefore safe: they pass through unchanged, exactly as in the canonical files.

## Feature comparison vs Claude Code

| Feature | Claude Code | Kimi Code |
|---|---|---|
| Native subagent support | ✅ `.claude/agents/*.md` | ✅ `.kimi-code/agents/*.md` (also `.agents/agents/`) |
| Context isolation per agent | ✅ | ✅ Each subagent call is a fresh context |
| Agent file format | Markdown + YAML frontmatter | Markdown + YAML frontmatter — accepts Claude-Code-style `name`/`description`/`tools:` CSV directly |
| Tool access model | `tools:` CSV allowlist | `tools:` / `disallowedTools:` (CSV or YAML list), plus global `[tools]` switch in `config.toml` |
| Per-agent model | `model: opus\|sonnet` (concrete alias) | `model_preference: primary\|secondary` (symbolic → your configured Kimi models; experimental flag required for `secondary`) |
| Auto-delegation via `description` | ✅ Automatic | ✅ Automatic, plus `kimi --agent <name>` to bind the main agent at launch |
| HITL built-in gate | ✅ Orchestrator-enforced, `AskUserQuestion` | ✅ **Native `AskUserQuestion`** — same primary branch as Claude Code |
| Parallel subagents | ✅ | ✅ `Agent` / `AgentSwarm`, foreground or background |
| Layered Mode (`agents/team/`) | ✅ Offered by the orchestrator, no flag needed | ❌ Not shipped (not mirrored and not run here yet), see Step 8 |
| `.kairos/` persistence | ✅ Automatic | ✅ Automatic, same agent-level instructions |
| Cost | Claude subscription | Kimi membership / API quota |

## Troubleshooting

| Problem | Fix |
|---|---|
| Agent not found | Check `.kimi-code/agents/` contains `.md` files with a `description` field; `name` must be kebab-case (a file without `name` falls back to its filename). Run `kimi --agent <bad-name>` to get the list of discovered agents in the error message |
| Wrong agent invoked | Refine the `description` field — the main agent reads it to decide delegation — or bind explicitly with `kimi --agent orchestrator-agent` |
| All phases run on the same model | Expected unless you enable `KIMI_CODE_EXPERIMENTAL_SECONDARY_MODEL=1` **and** set `[secondary_model]` — see Step 3 |
| HITL gate shows a printed text menu instead of a dialog | You're seeing the fallback branch — it means `AskUserQuestion` wasn't in the agent's tool view. Check the `tools:` line survived the copy intact |
| A skill reference fails (agent reports it can't find `../skills/<name>/SKILL.md`) | Copy `skills/` into `.kimi-code/skills/` — see Step 7 |
| Unexpected tool-approval prompts | Kimi Code permission rules are separate from agent files — check `[[permission.rules]]` in `config.toml` or your `/permission` mode |
