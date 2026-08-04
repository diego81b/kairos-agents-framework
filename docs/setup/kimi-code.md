# Kimi Code Setup

[Kimi Code](https://www.kimi.com/code/docs/en/) is Moonshot AI's terminal coding agent (CLI + TUI). It supports **native custom agents** with context isolation, defined in Markdown with YAML frontmatter — and of every tool KAIROS supports, its agent format is the **closest match to Claude Code's**: `name`, `description`, and a comma-separated `tools:` list are all valid as-is, the tool names are identical (`Read`, `Write`, `Edit`, `Bash`, `Grep`, `Glob`, `AskUserQuestion` all exist), and unknown frontmatter fields are ignored rather than rejected.

Two differences matter for KAIROS:

- **Model selection is symbolic, not concrete.** Kimi Code agent files cannot name a model id — the `model_preference: primary|secondary` field resolves at spawn time to the Kimi models configured in your `config.toml` (see Step 3). Claude Code's `model: opus|sonnet` aliases have no equivalent and are ignored if left in.
- **`AskUserQuestion` is native.** Unlike OpenCode, Kimi Code has its own `AskUserQuestion` tool, so every KAIROS HITL gate takes its primary branch — the same interactive approval dialog you get in Claude Code, no text-menu fallback needed.

## Prerequisites

- Kimi Code CLI installed and authenticated — see the [official docs](https://www.kimi.com/code/docs/en/kimi-code-cli/guides/getting-started.html)
- A configured Kimi model (e.g. `kimi-code/k3` as `default_model` — set up during login)

## Step 1 — Copy agents to `.kimi-code/agents/`

KAIROS ships a ready-made Kimi Code agent pack at [`.kimi-code/agents/`](https://github.com/diego81b/kairos-agents-framework/tree/main/.kimi-code/agents) in this repository — the 11 core pipeline agents, already converted. Copy the whole folder into your project:

```bash
# From your project root
mkdir -p .kimi-code/agents
cp path/to/kairos/.kimi-code/agents/*.md .kimi-code/agents/
```

Or globally, at `~/.kimi-code/agents/` (or the cross-tool `~/.agents/agents/`), if you want KAIROS available in every project. Project-level files win over user-level ones with the same `name`.

::: tip Keep `agents/` as source of truth
`agents/` (Claude-Code-canonical) remains the source of truth. `.kimi-code/agents/*.md` is a derived mirror maintained by hand — any edit to an `agents/*.md` file must update its `.kimi-code/agents/` counterpart in the same change. If you maintain your own copy instead of pulling updates from this repo, re-copy after KAIROS updates.
:::

::: warning No Team Mode mirror
`agents/team/*.md` (the 5 Team Mode files) are **not** mirrored here — same exclusion as the OpenCode pack. Their bodies depend on Claude Code's Agent Teams feature throughout: `implementer-lead-agent.md` requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, spawns teammates via Claude Code's `agent` tool, and its Test Plan Gate step calls `AskUserQuestion` unconditionally with no text-menu fallback. Kimi Code has its own parallel subagent support (`Agent` / `AgentSwarm`), but porting Team Mode's coordination logic to it is new work, not a frontmatter conversion. See Step 8.
:::

## Step 2 — How the frontmatter was converted

The mapping below is what actually produced the files in `.kimi-code/agents/` — reference it when you update an agent and need to re-derive its Kimi Code counterpart by hand:

| KAIROS field | Kimi Code field | Notes |
|---|---|---|
| `name:` | `name:` | Direct copy — supported natively (it would default to the kebab-case filename anyway). |
| `description:` | `description:` | Direct copy — Kimi Code's main agent reads it for auto-delegation, same as Claude Code. |
| `tools: CSV` | `tools:` CSV | Direct copy — Kimi Code accepts the comma-separated form, and every tool KAIROS lists (`Read`, `Write`, `Edit`, `Bash`, `Grep`, `Glob`, `AskUserQuestion`) exists under the same name. |
| `model: opus` | `model_preference: primary` | **Symbolic** — resolves to your session's main model (`default_model` in `config.toml`, e.g. a Kimi K-series model). Used for the 5 reasoning-heavy agents: `orchestrator`, `architect`, `context-extractor`, `impact-assessment`, `security-reviewer`. |
| `model: sonnet` | `model_preference: secondary` | **Symbolic** — resolves to `[secondary_model] model` in `config.toml` (typically a cheaper Kimi model). Used for the 6 execution agents: `pm`, `implementer-tdd`, `implementer-coder`, `code-reviewer`, `test-verifier`, `release-planner`. |

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

Always follow the KAIROS workflow sequence:
pm-agent → architect-agent → implementer-tdd-agent (TDD) OR implementer-coder-agent (no TDD) → code-reviewer-agent → test-verifier-agent → release-planner-agent

After each phase, present the output and wait for explicit approval (✅ / ✏️ / ⛔) before proceeding.
Save each approved output to `.kairos/<feature_folder>/0X-*.md`.
```

## Step 5 — Start a KAIROS session

Run Kimi Code with the orchestrator as the main agent:

```bash
kimi --agent orchestrator-agent
```

Or start a default session and let it delegate: the main agent discovers the 11 custom agents automatically and routes to them based on each agent's `description`, the same way Claude Code's auto-delegation works. You can also name an agent explicitly in conversation ("use pm-agent to analyze this feature request"), or bind one file for a single launch with `kimi --agent-file path/to/agent.md`.

The orchestrator is bound at session creation and restored on resume (`kimi --continue` / `--session`) — no flag needed on resume, and none is allowed.

## Step 6 — HITL checkpoints

Kimi Code has a native `AskUserQuestion` tool, so every gated agent takes its **primary branch** — the interactive approval dialog, same as Claude Code:

```
Implementation ready — how do you want to proceed?
❯ Approve implementation (Recommended)
  Request changes
  Stop
```

The text-menu fallback in each agent body (for Cursor, Codex CLI, OpenCode, …) is never needed here. One caveat straight from the orchestrator's own Hard Constraints: HITL gates require a live human, so don't run the orchestrator inside backgrounded/detached or scheduled executions — the gate would hang or be silently bypassed. Interactive TUI sessions are the supported mode.

## Step 7 — Copy the `contract-checklist` skill

`architect-agent` works through [`contract-checklist`](../skills/contract-checklist/SKILL.md) before defining API contracts. Kimi Code discovers skills from `.kimi-code/skills/` (project) or `~/.kimi-code/skills/` (user) — copy it there:

```bash
mkdir -p .kimi-code/skills
cp -r path/to/kairos/skills/contract-checklist .kimi-code/skills/
```

This keeps the agent body's relative reference (`../skills/contract-checklist/SKILL.md`, resolved from `.kimi-code/agents/`) working, and registers the checklist as a native Kimi Code skill invocable via the `Skill` tool.

## Step 8 — Parallel review and Team Mode

Kimi Code's `Agent` tool dispatches subagents and `AgentSwarm` runs them in parallel — so the "parallel review" pattern works here better than on most non-Claude tools. That still doesn't make Team Mode portable: `agents/team/*.md`'s coordination logic (the Agent Teams flag, Claude Code's own `agent`-tool spawning semantics, an unconditional `AskUserQuestion` with no fallback in `implementer-lead-agent.md`) is Claude-Code-specific, so the pack ships no Team Mode mirror. If you want Team Mode's behavior on Kimi Code, treat it as new work — rewrite the coordination against `Agent`/`AgentSwarm` — not a port.

## Step 9 — Save `.kairos/` outputs

Every KAIROS agent's own "Write to Project" step already instructs it to save its output to `.kairos/<feature_folder>/0X-*.md` — no extra prompting needed; the pack's `tools:` lists include `Write` everywhere the canonical files do.

## Note on `${VAR}` placeholders in agent bodies

Kimi Code renders agent bodies as templates, substituting `${var}` placeholders from live context — but **unknown variables are left verbatim**. The `${BITBUCKET_USER}:${BITBUCKET_TOKEN}` curl examples in every agent's "Issue Tracker Comment" section are therefore safe: they pass through unchanged, exactly as in the canonical files.

## Feature comparison vs Claude Code

| Feature | Claude Code | Kimi Code |
|---|---|---|
| Native subagent support | ✅ `.claude/agents/*.md` | ✅ `.kimi-code/agents/*.md` (also `.agents/agents/`) |
| Context isolation per agent | ✅ | ✅ Each subagent call is a fresh context |
| Agent file format | Markdown + YAML frontmatter | Markdown + YAML frontmatter — accepts Claude-Code-style `name`/`description`/`tools:` CSV directly |
| Tool access model | `tools:` CSV allowlist | `tools:` / `disallowedTools:` (CSV or YAML list), plus global `[tools]` switch in `config.toml` |
| Per-agent model | `model: opus\|sonnet\|haiku` (concrete alias) | `model_preference: primary\|secondary` (symbolic → your configured Kimi models; experimental flag required for `secondary`) |
| Auto-delegation via `description` | ✅ Automatic | ✅ Automatic, plus `kimi --agent <name>` to bind the main agent at launch |
| HITL built-in gate | ✅ Orchestrator-enforced, `AskUserQuestion` | ✅ **Native `AskUserQuestion`** — same primary branch as Claude Code |
| Parallel subagents | ✅ | ✅ `Agent` / `AgentSwarm`, foreground or background |
| Team Mode (`agents/team/`) | ✅ Native (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`) | ❌ Not shipped — coordination logic is Claude-Code-specific, see Step 8 |
| `.kairos/` persistence | ✅ Automatic | ✅ Automatic, same agent-level instructions |
| Cost | Claude subscription | Kimi membership / API quota |

## Troubleshooting

| Problem | Fix |
|---|---|
| Agent not found | Check `.kimi-code/agents/` contains `.md` files with a `description` field; `name` must be kebab-case (a file without `name` falls back to its filename). Run `kimi --agent <bad-name>` to get the list of discovered agents in the error message |
| Wrong agent invoked | Refine the `description` field — the main agent reads it to decide delegation — or bind explicitly with `kimi --agent orchestrator-agent` |
| All phases run on the same model | Expected unless you enable `KIMI_CODE_EXPERIMENTAL_SECONDARY_MODEL=1` **and** set `[secondary_model]` — see Step 3 |
| HITL gate shows a printed text menu instead of a dialog | You're seeing the fallback branch — it means `AskUserQuestion` wasn't in the agent's tool view. Check the `tools:` line survived the copy intact |
| `contract-checklist` reference fails | Copy `skills/contract-checklist/` into `.kimi-code/skills/` — see Step 7 |
| Unexpected tool-approval prompts | Kimi Code permission rules are separate from agent files — check `[[permission.rules]]` in `config.toml` or your `/permission` mode |
