# OpenCode Setup

[OpenCode](https://opencode.ai) is an open-source AI coding agent that runs in your terminal (TUI), as a server, or embedded in an editor. It supports **native custom subagents** with context isolation, defined in Markdown with YAML frontmatter — structurally the closest match to Claude Code's own agent format of any tool KAIROS supports, though the frontmatter fields themselves differ.

The key difference from Claude Code: there's no `name` field (the agent id comes from the filename), no `AskUserQuestion` tool, and tool access is expressed as a granular `permission` object instead of a flat `tools:` list.

## Prerequisites

- OpenCode installed — via the install script, npm, or your package manager of choice:

```bash
curl -fsSL https://opencode.ai/install | bash
# or: npm install -g opencode-ai
```

- A configured model provider (Anthropic, OpenAI, or any provider OpenCode supports)

## Step 1 — Copy agents to `.opencode/agents/`

KAIROS ships a ready-made OpenCode agent pack at [`.opencode/agents/`](https://github.com/diego81b/kairos-agents-framework/tree/main/.opencode/agents) in this repository — the 17 core pipeline agents, already converted (note the **plural** "agents"). Copy the whole folder into your project:

```bash
# From your project root
mkdir -p .opencode/agents
cp path/to/kairos/.opencode/agents/*.md .opencode/agents/
```

Or globally, at `~/.config/opencode/agents/`, if you want KAIROS available in every project.

## Step 1b — Copy skills to `.opencode/skills/`

Several agent bodies link to a shared skill file relative to their own location, e.g. `architect-agent` links to `../skills/contract-checklist/SKILL.md`. That path is resolved from wherever the agent file actually lives, not from this repo's root — so from `.opencode/agents/architect-agent.md` it resolves to `.opencode/skills/contract-checklist/SKILL.md`, not the top-level `skills/`. Copy the shared skills folder alongside the agents so those links resolve:

```bash
# From your project root
mkdir -p .opencode/skills
cp -r path/to/kairos/skills/* .opencode/skills/
```

This is what every agent body means by "Follow `[skill-name]`" — a plain relative file link the agent reads with its own `Read` tool, not a host-specific feature, so it works the same way regardless of whether OpenCode has its own native skill-discovery mechanism. Do not skip this step. The orchestrator links to seven `orchestrator-*` skills that it reads in many runs (resume, run choices, write-back, Layered Mode, close-out), and every phase agent opens its Input Validation with `agent-contract` and writes its artifact through `artifact-template`. Without `skills/` the orchestrator and every phase agent report that they cannot find the file, not just two optional steps.

::: tip Keep `agents/` as source of truth
`agents/` (Claude-Code-canonical) remains the source of truth. `.opencode/agents/*.md` is a derived mirror maintained by hand — any edit to an `agents/*.md` file must update its `.opencode/agents/` counterpart in the same change. If you maintain your own copy instead of pulling updates from this repo, re-copy after KAIROS updates.
:::

::: warning No Layered Mode mirror
`agents/team/*.md` (the 5 Layered Mode files, called Team Mode until v9.5.0) are **not** mirrored here. The reason that once justified this, their dependence on Claude Code's Agent Teams feature, is gone since v9.5.0: the orchestrator now runs the mode as plain subagent calls in stages. But nobody has run Layered Mode on OpenCode, so mirroring the files is a separate decision, deferred for now. The mirrored orchestrator offers the mode only on Claude Code, so nothing in this pack asks for it. See the comparison table below.
:::

## Step 2 — How the frontmatter was converted

The mapping below is what actually produced the files in `.opencode/agents/` — reference it when you update an agent and need to re-derive its OpenCode counterpart by hand:

| KAIROS field | OpenCode field | Notes |
|---|---|---|
| `name:` | *(none)* | No `name` field exists — the agent id is the filename. Filenames stay identical (`pm-agent.md` → `.opencode/agents/pm-agent.md`). |
| `description:` | `description:` | Direct copy. |
| `tools: CSV` | `permission: { edit, bash }` | Agents whose `tools:` includes `Write`/`Edit`/`Bash` get `edit: allow, bash: ask` — OpenCode's `edit` permission covers its `write`, `edit`, and `apply_patch` tools together (confirmed against `opencode.ai/docs/tools/`), so it's the single key that governs the KAIROS "Write to Project" step. Agents with `Write` but no `Bash` (`context-extractor-agent`, `documentation-agent`) get `edit: allow, bash: deny`. Read-only agents (`impact-assessment-agent`, `security-reviewer-agent` — `tools: Read, Grep, Glob, AskUserQuestion`, no write/exec access) get `edit: deny, bash: deny`; the orchestrator writes their artifacts. `read`/`grep`/`glob` are left at OpenCode's default (`allow`) since KAIROS never restricts them. `bash: ask` is a conservative default — agents that shell out repeatedly (e.g. `implementer-tdd-agent` running a test runner in a loop) will prompt on every call; loosen to `bash: allow` yourself if that's too noisy for your workflow. |
| `model: sonnet\|opus` | `model: provider/model-id` | Provider-prefixed: `anthropic/claude-sonnet-5` for `sonnet`, `anthropic/claude-opus-5` for `opus`. Every mirrored agent uses one of the two; only the unmirrored `agents/team/` layer agents declare `haiku`. Treat these as an example, not the only option — pick whatever provider/model you have configured. |
| *(none)* | `mode: primary\|subagent` | `orchestrator-agent` → `primary` (the one you invoke directly); every other agent → `subagent`. |
| `tools: ..., Agent` (orchestrator-agent only) | *(no equivalent — omitted)* | Claude Code's `orchestrator-agent.md` lists `Agent` in its `tools:` so it can invoke `@kairos:*` subagents itself (Claude Code's Task-style delegation tool — a spawned subagent otherwise has no way to call another subagent, regardless of what else is in its `tools:` list). OpenCode has no matching permission key because `mode: primary` already gives a primary agent full delegation over subagent-mode agents by design — don't add a `permission` entry for this when re-deriving the mirror, its absence here is intentional, not a missed conversion step. |
| `tools: ..., mcp__<server>__*` | `permission: { "<server>_*": allow }` | Claude Code grants a whole MCP server with `mcp__<server>__*` (e.g. `mcp__playwright__*`); OpenCode registers MCP tools under a `<server>_` prefix (single underscore, no `mcp__` wrapper — per `opencode.ai/docs/mcp-servers/`), and `permission` keys are matched as wildcard patterns against the tool name (per `opencode.ai/docs/permissions/`), so `"playwright_*": allow` is the equivalent grant. This is inferred from OpenCode's docs rather than tested against a live install — verify against current docs before relying on it. Currently only `test-verifier-agent` declares MCP tools (`chrome-devtools`, `playwright` — see [Skills & MCP Enhancements](../skills-mcp.md)); the server must still be configured in your `opencode.json` `mcp` block, this permission key only controls whether the agent is allowed to call it. |

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

**Converted (`.opencode/agents/pm-agent.md`, shipped as-is in this repo):**
```markdown
---
description: "Analyzes feature requirements and elicits constraints. Use when you have a vague feature request that needs structured analysis."
mode: subagent
model: anthropic/claude-sonnet-5
permission:
  edit: allow
  bash: ask
---
```
*(followed by the unchanged body of `agents/pm-agent.md`)*

`AskUserQuestion` has no OpenCode equivalent, but nothing needs to change in the body: every gated agent already contains a fallback branch ("If `AskUserQuestion` is not available ... fall back to printing this menu and waiting for a typed reply") — OpenCode always takes that branch. Don't confuse this with the `question` permission key, which governs OpenCode's own tool-approval prompts and is unrelated to KAIROS's HITL gate text.

## Step 2b — Customize models without forking the pack (optional)

The Claude Code pack's model lines (`model.<agent>` in `.kairos-cfg/config`) have no effect here: OpenCode's agent call takes no per-call model, so the orchestrator ignores the file and says so at the Start Gate. Use the `opencode.json` mechanism below instead.

OpenCode is a gateway to many providers, and hardcoding one `provider/model-id` per agent in the mirror can't fit everyone. You don't need to edit the shipped `.opencode/agents/*.md` files to change models: OpenCode's `opencode.json` **configures agents by name**, so a config entry overrides the matching markdown agent's `model:` while the pack files stay pristine (and re-copyable after KAIROS updates without losing your model choices). Put it in your project root (`opencode.json`, safe to commit) or globally (`~/.config/opencode/opencode.json`):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    // Reasoning tier (canonical model: opus)
    "orchestrator-agent":        { "model": "{env:KAIROS_STRONG_MODEL}" },
    "architect-agent":           { "model": "{env:KAIROS_STRONG_MODEL}" },
    "bug-triage-agent":          { "model": "{env:KAIROS_STRONG_MODEL}" },
    "context-extractor-agent":   { "model": "{env:KAIROS_STRONG_MODEL}" },
    "impact-assessment-agent":   { "model": "{env:KAIROS_STRONG_MODEL}" },
    "security-reviewer-agent":   { "model": "{env:KAIROS_STRONG_MODEL}" },
    "improvement-advisor-agent": { "model": "{env:KAIROS_STRONG_MODEL}" },
    // Execution tier (canonical model: sonnet)
    "pm-agent":                  { "model": "{env:KAIROS_FAST_MODEL}" },
    "implementer-tdd-agent":     { "model": "{env:KAIROS_FAST_MODEL}" },
    "implementer-coder-agent":   { "model": "{env:KAIROS_FAST_MODEL}" },
    "code-reviewer-agent":       { "model": "{env:KAIROS_FAST_MODEL}" },
    "test-verifier-agent":       { "model": "{env:KAIROS_FAST_MODEL}" },
    "qa-plan-agent":             { "model": "{env:KAIROS_FAST_MODEL}" },
    "release-planner-agent":     { "model": "{env:KAIROS_FAST_MODEL}" },
    "documentation-agent":       { "model": "{env:KAIROS_FAST_MODEL}" },
    "retrospective-agent":       { "model": "{env:KAIROS_FAST_MODEL}" },
    "dependency-audit-agent":    { "model": "{env:KAIROS_FAST_MODEL}" }
  }
}
```

The `{env:...}` substitution is OpenCode's own config feature (unset variables become empty strings — in that case set plain `provider/model-id` strings instead). With the variables exported:

```bash
export KAIROS_STRONG_MODEL="anthropic/claude-opus-5"     # any configured provider works — matches the ids shipped in `.opencode/agents/`
export KAIROS_FAST_MODEL="openai/gpt-5-mini"             # e.g. a cheaper tier entirely
```

This preserves KAIROS's two-tier split (7 reasoning agents vs 10 execution agents) while letting each tier point at any provider OpenCode can reach — including mixing providers across tiers. To flatten costs further, point both tiers at the same small model; to max out quality, point both at your strongest. Global fallback: the top-level `model` key in `opencode.json` applies to agents with no per-agent `model:` anywhere.

## Step 3 — Add `AGENTS.md` for KAIROS context

Unlike Codex, OpenCode's `AGENTS.md` support is native (not a convention borrowed from elsewhere): it's read from the project root, searched by walking up from the current directory, before falling back to a global `~/.config/opencode/AGENTS.md`.

**`AGENTS.md`** (at project root):
```markdown
# KAIROS Framework

This project uses the KAIROS multi-agent development framework.
Agent definitions are in `agents/` (Markdown, canonical) and `.opencode/agents/` (OpenCode copies).

Start every feature through `orchestrator-agent`, with the feature request and no agent list.
It derives which agents run from the facts of the change and asks you at its Start Gate;
never run the pipeline by hand in a fixed order, because most runs skip some agents.

Wait for the orchestrator's gate (Approve / Request changes / Skip next / Stop pipeline) before any agent is called.
Each approved output is saved under `.kairos/<feature_folder>/`.
```

If your project already has a `CLAUDE.md`, write a dedicated `AGENTS.md` rather than relying on OpenCode's Claude-Code fallback — the fallback is a last resort in its lookup order and skipped entirely once a project `AGENTS.md` exists.

## Step 4 — Start a KAIROS session

Run OpenCode in your project directory:

```bash
opencode
```

Select `orchestrator-agent` as the primary agent (it ships with `mode: primary`; OpenCode's agent docs describe switching primary agents in the TUI, which this page has not run) and give it the request, with no agent list:

```
Add Stripe payments to the checkout, issue #42
```

The orchestrator derives the agents, shows its Start Gate and calls the subagents itself. Typing `@pm-agent` or another subagent name starts that one agent outside the pipeline: no Start Gate, no ledger, no derived selection. Use it only for a standalone agent such as `context-extractor-agent` or `retrospective-agent`.

## Step 5 — HITL checkpoints

OpenCode has no `AskUserQuestion` tool, so every gated agent falls back to its text-menu branch:

```
✅ Approve — continue to the next agent
✏️  Request changes — specify what to adjust
⏭️  Skip next — skip the next agent
⛔ Stop pipeline
```

The orchestrator's gate has four lines; the standalone agents print three (no Skip next). Three gates continue on their own when no check finds anything to decide (the bug triage, the requirements, the last wave of Phase 3) and print what they accepted; `every gate` brings the question back. Reply with your choice as plain text. This is enforced by the agent body's own instructions, not by OpenCode itself — there's no separate mechanism forcing a stop, so don't skip reading the menu before replying.

## Step 6 — Parallel review (optional)

⚠️ OpenCode subagents are invoked through its `task` tool, and its docs describe agents running "multiple units of work in parallel," but the exact concurrency semantics aren't fully documented. Treat this as roughly equivalent to Codex's parallel subagent support, but verify against current OpenCode docs before depending on it.

KAIROS's Layered Mode (`agents/team/*.md`, a lead plus layer agents run in stages) has no OpenCode mirror yet. Its coordination no longer depends on Claude Code's Agent Teams, since the orchestrator runs it as plain subagent calls, but nobody has run it on OpenCode, and its parallel GREEN stage has not been tried against OpenCode's `task` tool. Mirroring the five files is a separate decision, and until then the mirrored orchestrator offers the mode only on Claude Code. If you want it on OpenCode, treat it as its own piece of work: mirror the files and check the stage dispatch against OpenCode's `task` tool.

## Step 7 — Save `.kairos/` outputs

Every agent that can write has its own "Write to Project" step that saves its output to `.kairos/<feature_folder>/0X-*.md`, so no extra prompting is needed as long as `permission.edit` isn't set to `deny` or `ask` in a way that blocks the write. The two read-only agents (`impact-assessment-agent`, `security-reviewer-agent`) cannot write, so the orchestrator writes their artifacts, and it alone writes `ledger/run.md` and `_tracking.md`.

Six project settings work here like on every host: `autonomy`, `manual-qa`, `qa-dir`, `test-changed`, `cleanup` and `project-summary` (see [Customizing KAIROS](/customizing)). The `model.` lines do not: use the `opencode.json` mechanism of Step 2b.

## Feature comparison vs Claude Code

| Feature | Claude Code | OpenCode |
|---|---|---|
| Native subagent support | ✅ `.claude/agents/*.md` | ✅ `.opencode/agents/*.md` |
| Context isolation per agent | ✅ | ✅ Each subagent call is a fresh context |
| Agent file format | Markdown + YAML frontmatter | Markdown + YAML frontmatter (different fields) |
| Tool access model | `tools:` CSV allowlist | `permission:` object, per-action `allow`/`ask`/`deny` — more granular |
| Auto-delegation via `description` | ✅ Automatic | ✅ Automatic, plus manual `@agent-name` |
| HITL built-in gate | ✅ Orchestrator-enforced, `AskUserQuestion` | ⚠️ No `AskUserQuestion` — uses each agent's existing text-menu fallback |
| Parallel subagents | ✅ | ⚠️ `task` tool supports it per docs; exact concurrency behavior unverified — confirm against current docs |
| Layered Mode (`agents/team/`) | ✅ Offered by the orchestrator, no flag needed | ❌ Not shipped (not mirrored and not run here yet), see Step 6 |
| `.kairos/` persistence | ✅ Automatic | ✅ Automatic, same agent-level instructions |
| Cost | Claude subscription | Any configured provider |

## Troubleshooting

| Problem | Fix |
|---|---|
| Agent not found | Check `.opencode/agents/` contains `.md` files with a `description` field; the filename (minus `.md`) is the agent id |
| Wrong agent invoked | Refine the `description` field — OpenCode's primary agent reads it to decide delegation — or invoke explicitly with `@agent-name` |
| HITL not respected | There's no native `AskUserQuestion` prompt to miss — confirm the agent's text-menu fallback line is intact in the body and you're replying to it as plain text |
| Unexpected approval prompts, or writes happening silently | Check the agent's `permission:` block — `ask` prompts before the action, `allow` skips the prompt, `deny` blocks it outright |
| OpenCode not reading `AGENTS.md` | Confirm it's at the project root or an ancestor directory; if using additional instruction files, check the `instructions` array in `opencode.json` |
| A skill reference fails (agent reports it can't find `../skills/<name>/SKILL.md`) | Copy `skills/` into `.opencode/skills/` — see Step 1b |
