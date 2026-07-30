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

KAIROS ships a ready-made OpenCode agent pack at [`.opencode/agents/`](https://github.com/diego81b/kairos-agents-framework/tree/main/.opencode/agents) in this repository — the 11 core pipeline agents, already converted (note the **plural** "agents"). Copy the whole folder into your project:

```bash
# From your project root
mkdir -p .opencode/agents
cp path/to/kairos/.opencode/agents/*.md .opencode/agents/
```

Or globally, at `~/.config/opencode/agents/`, if you want KAIROS available in every project.

::: tip Keep `agents/` as source of truth
`agents/` (Claude-Code-canonical) remains the source of truth. `.opencode/agents/*.md` is a derived mirror maintained by hand — any edit to an `agents/*.md` file must update its `.opencode/agents/` counterpart in the same change. If you maintain your own copy instead of pulling updates from this repo, re-copy after KAIROS updates.
:::

::: warning No Team Mode mirror
`agents/team/*.md` (the 5 Team Mode files) are **not** mirrored here. They're not just a different frontmatter — their bodies depend on Claude Code's Agent Teams feature throughout: `implementer-lead-agent.md` requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, spawns teammates via Claude Code's `agent` tool, and its Test Plan Gate step calls `AskUserQuestion` unconditionally with no text-menu fallback (unlike every other gate in these agents). A frontmatter-only conversion would ship a subagent that can't function. See the comparison table below.
:::

## Step 2 — How the frontmatter was converted

The mapping below is what actually produced the files in `.opencode/agents/` — reference it when you update an agent and need to re-derive its OpenCode counterpart by hand:

| KAIROS field | OpenCode field | Notes |
|---|---|---|
| `name:` | *(none)* | No `name` field exists — the agent id is the filename. Filenames stay identical (`pm-agent.md` → `.opencode/agents/pm-agent.md`). |
| `description:` | `description:` | Direct copy. |
| `tools: CSV` | `permission: { edit, bash }` | Agents whose `tools:` includes `Write`/`Edit`/`Bash` get `edit: allow, bash: ask` — OpenCode's `edit` permission covers its `write`, `edit`, and `apply_patch` tools together (confirmed against `opencode.ai/docs/tools/`), so it's the single key that governs the KAIROS "Write to Project" step. Read-only agents (`impact-assessment-agent`, `security-reviewer-agent` — `tools: Read, Grep, Glob, AskUserQuestion`, no write/exec access) get `edit: deny, bash: deny`. `read`/`grep`/`glob` are left at OpenCode's default (`allow`) since KAIROS never restricts them. `bash: ask` is a conservative default — agents that shell out repeatedly (e.g. `implementer-tdd-agent` running a test runner in a loop) will prompt on every call; loosen to `bash: allow` yourself if that's too noisy for your workflow. |
| `model: sonnet\|opus\|haiku` | `model: provider/model-id` | Provider-prefixed: `anthropic/claude-sonnet-5`, `anthropic/claude-opus-5`, `anthropic/claude-haiku-4-5-20251001`. Treat these as an example, not the only option — pick whatever provider/model you have configured. |
| *(none)* | `mode: primary\|subagent` | `orchestrator-agent` → `primary` (the one you invoke directly); every other agent → `subagent`. |

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

## Step 3 — Add `AGENTS.md` for KAIROS context

Unlike Codex, OpenCode's `AGENTS.md` support is native (not a convention borrowed from elsewhere): it's read from the project root, searched by walking up from the current directory, before falling back to a global `~/.config/opencode/AGENTS.md`.

**`AGENTS.md`** (at project root):
```markdown
# KAIROS Framework

This project uses the KAIROS multi-agent development framework.
Agent definitions are in `agents/` (Markdown, canonical) and `.opencode/agents/` (OpenCode copies).

Always follow the KAIROS workflow sequence:
pm-agent → architect-agent → implementer-tdd-agent (TDD) OR implementer-coder-agent (no TDD) → code-reviewer-agent → test-verifier-agent → release-planner-agent

After each phase, present the output and wait for explicit approval (✅ / ✏️ / ⛔) before proceeding.
Save each approved output to `.kairos/<feature_folder>/0X-*.md`.
```

If your project already has a `CLAUDE.md`, write a dedicated `AGENTS.md` rather than relying on OpenCode's Claude-Code fallback — the fallback is a last resort in its lookup order and skipped entirely once a project `AGENTS.md` exists.

## Step 4 — Start a KAIROS session

Run OpenCode in your project directory:

```bash
opencode
```

Invoke an agent explicitly with `@agent-name`:

```
@pm-agent Help me implement Stripe payments using the KAIROS framework.
```

Or prompt the primary agent (`orchestrator-agent`, if configured `mode: primary`) and let it delegate based on each subagent's `description`, the same way Claude Code's auto-delegation works.

## Step 5 — HITL checkpoints

OpenCode has no `AskUserQuestion` tool, so every gated agent falls back to its text-menu branch:

```
✅ Approve — continue to Architect Agent
✏️  Request changes — specify what to adjust
⛔ Stop
```

Reply with your choice as plain text. This is enforced by the agent body's own instructions, not by OpenCode itself — there's no separate mechanism forcing a stop, so don't skip reading the menu before replying.

## Step 6 — Parallel review (optional)

⚠️ OpenCode subagents are invoked through its `task` tool, and its docs describe agents running "multiple units of work in parallel," but the exact concurrency semantics aren't fully documented. Treat this as roughly equivalent to Codex's parallel subagent support, but verify against current OpenCode docs before depending on it.

This is also why KAIROS's Team Mode (`agents/team/*.md`) has no OpenCode mirror at all, not just an unclaimed one: `implementer-lead-agent.md` requires Claude Code's `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` flag, spawns teammates through Claude Code's own `agent` tool, and its Test Plan Gate calls `AskUserQuestion` with no fallback branch. None of that is a frontmatter difference — it's coordination logic with no OpenCode equivalent, so converting only the frontmatter would ship a subagent that fails the moment it reaches that step. If you want Team Mode's specific behavior (parallel teammates, shared contracts) on OpenCode, treat it as new work — rewrite the coordination logic against OpenCode's own `task` tool — not a port.

## Step 7 — Save `.kairos/` outputs

Every KAIROS agent's own "Write to Project" step already instructs it to save its output to `.kairos/<feature_folder>/0X-*.md` — no extra prompting needed, as long as `permission.edit` isn't set to `deny` or `ask` in a way that blocks the write.

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
| Team Mode (`agents/team/`) | ✅ Native (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`) | ❌ Not shipped — coordination logic is Claude-Code-specific, see Step 6 |
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
