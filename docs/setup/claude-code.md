# Claude Code Setup

Claude Code is the **recommended tool** for KAIROS. It is the only tool with native subagent support: each agent runs in an isolated context with its own model, tools list, and memory — exactly as KAIROS is designed.

## Prerequisites

- [Claude Code](https://claude.ai/code) installed (CLI or desktop)
- A project you want to develop with KAIROS
- Git (optional, for issue tracker integration — Jira, GitLab, Bitbucket)

## Step 1 — Install the agents

Two ways to get KAIROS into Claude Code. **Plugin install is recommended** — it's one command, it pulls in `agents/`, `skills/`, and `commands/` together, and it updates with `claude plugin update`. Manual copy is the alternative when you want to fork/customize the agent files per-project.

### Option A — Plugin install (recommended)

```bash
claude plugin marketplace add diego81b/kairos-agents-framework
claude plugin install kairos@kairos-agents-framework
```

If Claude Code doesn't report it as active right after install, enable it explicitly:

```bash
claude plugin enable kairos
```

Confirm with `claude plugin list`.

This gets you the 17 core agents, the internal skills (`contract-checklist`, `coding-discipline`, etc.), and the `/kairos:setup` / `/kairos:view` / `/kairos:usage` slash commands in one shot. Agents are invoked with the `kairos:` scope — `@kairos:orchestrator-agent`, `@kairos:pm-agent` — and Team Mode agents with `@kairos:team:implementer-lead-agent`.

### Option B — Manual copy

Claude Code also discovers subagents from a `.claude/agents/` directory inside your project — useful if you want to edit the shipped agent files for your team's own conventions instead of tracking the plugin as-is.

```bash
# From your project root
mkdir -p .claude/agents/team
cp path/to/kairos/agents/*.md .claude/agents/
cp path/to/kairos/agents/team/*.md .claude/agents/team/
```

This copies **agents only**. If you also want the internal skills or the `/kairos:setup` / `/kairos:view` commands, copy those directories too (`scripts/` as well, for `/kairos:usage`):

```bash
cp -r path/to/kairos/skills .claude/skills
mkdir -p .claude/commands/kairos
cp path/to/kairos/commands/*.md .claude/commands/kairos/
```

Your project structure should look like:

```
your-project/
├── .claude/
│   └── agents/
│       ├── orchestrator-agent.md
│       ├── context-extractor-agent.md     ← Pre-pipeline: full-repo context (standalone)
│       ├── impact-assessment-agent.md     ← Pre-pipeline: issue grounding, facts for the derivation (dispatched by the orchestrator)
│       ├── bug-triage-agent.md            ← Bug reproduction + root cause (standalone)
│       ├── pm-agent.md
│       ├── architect-agent.md
│       ├── implementer-tdd-agent.md       ← TDD implementer (default when the project has a test suite)
│       ├── implementer-coder-agent.md     ← Code-first implementer (code, then the tests the project calls for)
│       ├── code-reviewer-agent.md
│       ├── security-reviewer-agent.md     ← Adversarial security review (optional, read-only)
│       ├── test-verifier-agent.md
│       ├── qa-plan-agent.md
│       ├── release-planner-agent.md
│       ├── documentation-agent.md          ← Feature-facing docs (optional, Phase 6b)
│       ├── retrospective-agent.md         ← Standalone, post-pipeline: lessons capture
│       ├── improvement-advisor-agent.md   ← Standalone, infrequent: framework change proposals
│       ├── dependency-audit-agent.md      ← Standalone, periodic: dependency + tech-debt backlog
│       └── team/                      ← Team Mode specialists
│           ├── implementer-lead-agent.md
│           ├── teammate-tests-agent.md
│           ├── teammate-backend-agent.md
│           ├── teammate-frontend-agent.md
│           └── teammate-database-agent.md
├── src/
└── ...
```

With a manual copy, agents are invoked by their **bare** name (`@orchestrator-agent`, not `@kairos:orchestrator-agent`).

::: tip Keep agents in sync
A manual copy is a local fork: after a KAIROS update, re-copy the files and re-apply any local edits. The source of truth is always `agents/` in the KAIROS repository. The plugin install path (Option A) avoids this — `claude plugin update kairos` handles it.
:::

::: info Choosing an implementer
Copy **both** `implementer-tdd-agent.md` and `implementer-coder-agent.md`. During a KAIROS run the orchestrator chooses one from facts, right before the implementation plan, and prints the rule that chose it; you can switch at the plan gate.
- `implementer-tdd-agent` — **default** when the project has a test suite. Full TDD cycle (RED → GREEN → REFACTOR).
- `implementer-coder-agent` — **code-first**. Writes the code, then the tests its plan's Test Decision calls for: it extends existing tests of the modules it touches and adds a regression test for a bug fix. Chosen for `simple_fix`, for projects with no test suite, and when the architecture says `test_first: no`.

The `team/` folder (`implementer-lead-agent.md` + teammates) is only needed if you want Team Mode to be offered.
:::

## Step 2 — Understand how subagents are loaded

When Claude Code starts, it reads every `.md` file in `.claude/agents/` and parses the YAML frontmatter:

```yaml
---
name: PM Agent
description: Collects and structures requirements. Use at the START of a new feature.
tools:
  - read_file
  - write_file
model: sonnet
---
```

The `description` field is critical: the **orchestrator** reads all descriptions and decides automatically which subagent to delegate to, without you needing to say `@pm-agent`.

## Step 3 — Start a KAIROS session

Start Claude Code with the orchestrator as the session's **primary** agent — not by naming it inside an already-open chat:

```bash
# Plugin install (Option A)
claude --agent kairos:orchestrator-agent

# Manual copy (Option B)
claude --agent orchestrator-agent
```

::: warning Don't invoke it by name mid-conversation
Typing `@orchestrator-agent` (or `@kairos:orchestrator-agent`) or "use the orchestrator agent" inside an already-open Claude Code session dispatches it through the `Agent` tool as a **subagent**, not as the session's primary driver. Subagents unconditionally lose access to `AskUserQuestion`, so every HITL gate degrades to the text-menu fallback — and if the parent session ends or resets mid-pipeline, the orchestrator is orphaned and dies with it, mid-phase.

The same applies to every agent that asks you something while it works, not just the orchestrator: `context-extractor-agent`, `retrospective-agent`, `improvement-advisor-agent`, and `impact-assessment-agent` when you run it yourself rather than letting the orchestrator dispatch it are all launched directly by you, all ask mid-run, and all degrade the same way when `@`-mentioned instead of started with `--agent kairos:<name>`. `bug-triage-agent` and `dependency-audit-agent` are the two exceptions — neither calls `AskUserQuestion` at all, their gates are plain prose — but starting them as the primary agent costs nothing either.

`--agent` is a startup flag only — to switch mid-session, exit (`Ctrl+D` or `/exit`) and relaunch with it. To make this the project default without retyping the flag, add it to `.claude/settings.local.json` (not the shared `settings.json`, or every teammate's plain `claude` session in this repo defaults to the orchestrator too):
```json
{
  "agent": "kairos:orchestrator-agent"
}
```
(use the bare `orchestrator-agent` instead if you're on a manual copy). Still overridable per-session with `--agent <other>`.
:::

Once the session opens with the orchestrator as primary, just type your request:

```
Help me add [your feature] using the KAIROS framework
```

The orchestrator reads the task and begins delegating to the appropriate subagent starting with the PM Agent.

## Step 4 — The HITL loop in practice

After each phase you will see output like:

```
## PM Agent — Requirements Output

{
  "feature": "...",
  "user_stories": [...],
  "acceptance_criteria": [...],
  ...
}

✅ Approve and continue to Architecture
✏️  Request changes (describe what to fix)
⛔  Stop here
```

**You must choose before the orchestrator proceeds.** This is the HITL checkpoint — it prevents downstream agents from working on bad requirements.

Validated output is saved automatically to `.kairos/01-requirements.md`.

## Step 5 — Check `.kairos/` outputs

After each approved phase, a single Markdown file is written — a small YAML frontmatter header (status, counts) followed by the human-readable report body (data model, issues, findings, runbook):

```
.kairos/
├── 01-requirements.md         ← after PM Agent approval
├── 02-architecture.md         ← after Architect approval
├── 03-implementation.md       ← after Implementer approval
├── 04-review.md               ← after Code Reviewer approval
├── 05-test-verification.md    ← after Test Verifier approval
└── 06-deployment-plan.md      ← after Release Planner approval
```

These files are the audit trail of the session. You can commit them to git to track what was decided and why.

## Optional — Viewing a phase artifact as HTML

If you'd rather not read the raw Markdown, the plugin ships a `/kairos:view` command that turns one phase artifact into a synthesized, human-readable HTML page:

```
/kairos:view 04-review.md
```

Or just `/kairos:view` with no argument — since `.kairos/` accumulates one folder per feature ever processed, it asks which feature folder first, then lists that folder's phase files and asks which one.

It reads that file's frontmatter and body, then publishes an Artifact with a status header, stat tiles for whatever tally fields are present (`risk_counts`, `issues_summary`, `findings_summary`), and any Risks/Issues/Findings table rendered as a real HTML table with a Disposition badge per row — condensed, not a copy-paste of the Markdown. One file per invocation; run it again for another phase.

You can also point it at `_tracking.md`, the orchestrator's own tracking file for the run, by naming it explicitly, e.g. `/kairos:view _tracking.md`; it won't show up in the no-argument file list since that only lists numbered phase files. `_tracking.md` carries no frontmatter, so the rendered page skips the status badge and stat tiles and shows its status, issue alignment and log. A folder from before v8.5.0 has `_recap.md` instead, and `/kairos:view _recap.md` still works for it.

::: warning Run it from the primary session, not a subagent
`/kairos:view` publishes an Artifact, which needs the `Artifact` and `Skill` tools. Run it from the session's primary agent. If you `@`-mention `kairos:orchestrator-agent` (or any other core agent) mid-conversation, Claude Code dispatches it as a subagent restricted to that agent's own `tools:` frontmatter — none of the 17 core pipeline agents grant `Artifact` or `Skill`, so the command fails to publish. Same root cause as the `AskUserQuestion` loss described in Step 3 above; exit and relaunch from the primary session if you hit it.
:::

## Optional — Issue tracker integration

KAIROS supports **Jira**, **GitLab Issues**, and **Bitbucket Issues**. Add the issue reference at the start of your prompt:

```
# Jira
Help me implement PROJ-42 using the KAIROS framework

# GitLab / Bitbucket
Help me implement issue #42 using the KAIROS framework
```

Each agent posts its validated output as a comment after your approval:

```bash
# Jira (jira-cli — https://github.com/ankitpokhrel/jira-cli)
jira issue comment add PROJ-42 "$(cat .kairos/PROJ-42_my-feature/01-requirements.md)"

# GitLab (glab CLI — https://gitlab.com/gitlab-org/cli)
glab issue note 42 --message "$(cat .kairos/issue-42_my-feature/01-requirements.md)"

# Bitbucket (REST API)
curl -X POST "https://api.bitbucket.org/2.0/repositories/{workspace}/{repo}/issues/42/comments" \
  -u "${BITBUCKET_USER}:${BITBUCKET_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"content":{"raw":"..."}}"
```

Requires the respective CLI authenticated: `jira init`, `glab auth login`, or a Bitbucket app password in `BITBUCKET_TOKEN`.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Agent not found | Check `.claude/agents/` exists and contains `.md` files with valid YAML frontmatter |
| Wrong model used | Check the model lines the Start Gate printed and the file each came from (`.kairos-cfg/models`, `.kairos/.models` or `~/.kairos-cfg/models`; they outrank frontmatter for agents the orchestrator dispatches), then the agent's `model:` frontmatter. `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` in `settings.json` overrides both |
| Orchestrator not delegating | The `description:` field must clearly describe when to use the agent |
| `.kairos/` not created | The implementer-tdd-agent or implementer-coder-agent creates it on first write — ensure `write_file` is in its `tools:` list |
| Gates keep degrading to a text menu / `AskUserQuestion` unavailable | The orchestrator is running as a subagent, not as the session's primary agent — it was invoked by name (`@orchestrator-agent` / `@kairos:orchestrator-agent`) inside an existing chat instead of at startup. Exit and relaunch with `claude --agent kairos:orchestrator-agent` (plugin) or `claude --agent orchestrator-agent` (manual copy) — see Step 3 |
| Orchestrator seems to vanish mid-pipeline with no error | Same root cause as above — a subagent-dispatched orchestrator dies if its parent session ends or resets. Restart the same way as above; the run resumes from the last completed phase (Step 0b of `orchestrator-agent.md`) |
| `claude plugin install` succeeds but agents don't show up | The plugin may need explicit activation — run `claude plugin enable kairos` and confirm with `claude plugin list` |

## Team Mode — additional setup

Team Mode activates a coordinated team of 5 specialists in place of the single implementer agent (`implementer-tdd-agent` or `implementer-coder-agent`). It uses Claude Code’s **experimental Agent Teams feature**, available only in Claude Code.

### Enable Agent Teams

Requires Claude Code v2.1.32 or later:

```bash
claude --version
```

Set the flag at whichever scope fits your workflow:

**Project-level** (recommended — commits the setting to git so the whole team gets it):

```json
// .claude/settings.json in your project root
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

**Global** (all projects on this machine — developer preference):

```json
// ~/.claude/settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

**Shell session** (temporary, for testing):

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
claude
```

### Why Claude Code only?

| Tool | Agent Teams support | Team Mode |
| --- | --- | --- |
| **Claude Code v2.1.32+** | Experimental Agent Teams — separate sessions, peer messaging | ✅ |
| Cursor | No inter-session coordination | ❌ |
| VS Code / JetBrains / others | No inter-session coordination | ❌ |

With Agent Teams, each teammate runs in its **own Claude Code session** with its own context window. Teammates communicate peer-to-peer via a shared mailbox and coordinate work via a shared task list — not just reporting results back to the lead. This is fundamentally different from the single `implementer-tdd-agent` or `implementer-coder-agent`, which uses the `agent` tool for direct subagent spawning within a single session.

### How to activate Team Mode

Team Mode is never activated automatically. Right before the implementation plan, when the TDD path was chosen, two or more of backend/frontend/db are touched, Agent Teams is enabled and the host is Claude Code, the Orchestrator offers it: it shows a cost warning and asks for confirmation (the same happens when an issue checklist or an `Add:` override names `implementer-lead-agent`):

```
⚠️  TEAM MODE — COST WARNING

Single Agent:  ~$0.068/feature  (implementer-tdd-agent)
Team Mode:     ~$0.242/feature  (3.5× more — Claude Code only, experimental)

Why offered:   <layers in domains>, Agent Teams enabled
Team spawns:   Lead + Tests + one teammate per layer in scope (Agent Teams)
```

then a three-option prompt: **Confirm Team Mode**, **Single agent**, **Cancel pipeline**.

### What the Lead spawns and when

The Implementer Lead applies real TDD across the team in three sequential phases:

```
Implementer Lead
│
├── RED phase ──► teammate-tests-agent      (spawned first, alone)
│                  Writes all tests before any implementation.
│                  All tests fail — this is correct.
│
│   [HITL: test plan gate — you review the test suite here]
│
├── GREEN phase ─► teammate-backend-agent    ┌
│                  teammate-frontend-agent   ├── spawned in parallel,
│                  teammate-database-agent   ┘   only for layers in scope
│                  Goal: make the pre-existing tests pass.
│
└── REFACTOR ───► all three teammates        (quality improvements,
                                         tests must stay green)
```

### Verify Agent Teams is enabled

Check that `Claude Code v2.1.32+` is installed and the env var is set:

```bash
claude --version
```

You can also verify the setting is active by looking at `.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Without this flag, the Lead cannot create a team and Team Mode will not work.

---

## Full pipeline

```
You ──► Orchestrator
         │
         ├─[HITL]─► PM Agent              → .kairos/01-requirements.md
         ├─[HITL]─► Architect Agent       → .kairos/02-architecture.md + .md
         ├─[HITL]─► implementer-tdd-agent    → .kairos/03-implementation.md
         │           or
         │          implementer-coder-agent (code-first)
         │           or
         │          Implementer Lead-agent (Team Mode)
         │           ├── teammate-tests-agent    [HITL: test plan gate]
         │           ├── teammate-backend-agent  ┌
         │           ├── teammate-frontend-agent ├── parallel
         │           └── teammate-database-agent ┘
         ├─[HITL]─► Code Reviewer         → .kairos/04-review.md + .md
         ├─[HITL]─► Test Verifier         → .kairos/05-test-verification.md + .md
         └─[HITL]─► Release Planner       → .kairos/06-deployment-plan.md + .md
```

Each `[HITL]` gate is a pause where **you** review and approve before the next agent runs.

---

## Customizing models

KAIROS's shipped frontmatter splits agents into two tiers: `opus` for the 7 reasoning-heavy agents (`orchestrator`, `architect`, `context-extractor`, `impact-assessment`, `security-reviewer`, `improvement-advisor`, `bug-triage`) and `sonnet` for the 10 execution agents (`pm`, `implementer-tdd`, `implementer-coder`, `code-reviewer`, `test-verifier`, `qa-plan`, `release-planner`, `documentation`, `retrospective`, `dependency-audit`). Those are the defaults: with nothing configured, every agent runs on its own `model:`.

Claude Code picks a subagent's model in this order: the `model` parameter of the call that starts it, then the agent's frontmatter `model:`, then the `CLAUDE_CODE_SUBAGENT_MODEL` environment variable, then the main conversation's model (older Claude Code versions ranked the environment variable first). There are four ways to change the result:

1. **A `models` file in `.kairos-cfg/` (recommended)** — a plain-text file, one `<agent>: <alias>` line per agent, written by `/kairos:setup` (Default, Economy or Custom strategy) or by hand. Put it in the project's `.kairos-cfg/` to share it with the team (it is committed) or in `~/.kairos-cfg/` to keep it to yourself; the project beats your home folder, and the older `.kairos/.models` is still read between the two (see [Customizing KAIROS](/customizing) for the full order). Before each dispatch the orchestrator reads the files and passes the alias as the call's `model` parameter, which outranks the agent's frontmatter. Nothing else changes: no forked agent files, no edits to re-apply after a plugin update, and deleting the file restores the shipped tiers. The Start Gate shows the lines in effect and where each came from. Never put an API key or token in these files: `.kairos-cfg/` is committed, and keys stay in your keychain.
   ```
   # .kairos-cfg/models
   architect-agent: opus
   pm-agent: haiku
   code-reviewer-agent: opus
   ```
   It has three limits. It holds aliases only (`opus`, `sonnet`, `haiku`, `fable`), because the per-call parameter takes neither `inherit` nor a full model ID; a line with anything else is reported and ignored. It applies only to agents the orchestrator dispatches: `impact-assessment`, `bug-triage`, `pm`, `architect`, both implementers, `code-reviewer`, `security-reviewer`, `test-verifier`, `qa-plan`, `release-planner` and `documentation`. The orchestrator itself, the agents you start yourself (`context-extractor`, `retrospective`, `improvement-advisor`, `dependency-audit`) and Team Mode teammates keep their frontmatter model. And it is Claude Code only: OpenCode and Kimi Code ignore it (their own model settings are on their setup pages).
2. **Edit the `model:` frontmatter** in your `.claude/agents/` copies. This is the way to get `inherit`, a full model ID (e.g. `claude-opus-5-5`), or a different model for the agents option 1 does not reach. Downside: your edits are local forks, so re-apply them after re-copying updated KAIROS agents.
3. **Global subagent model** — `CLAUDE_CODE_SUBAGENT_MODEL` in `settings.json` is only the fallback for a subagent that has no `model:` of its own. Every KAIROS agent declares one, so by itself the variable changes nothing. Add `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` to make it override both the frontmatter and the per-call parameter (which also switches `.kairos/.models` off):
   ```json
   {
     "env": {
       "CLAUDE_CODE_SUBAGENT_MODEL": "haiku",
       "CLAUDE_CODE_SUBAGENT_MODEL_FORCE": "1"
     }
   }
   ```
   Coarse but zero-maintenance: **all** subagents, architect and security review included, run on that one model, so it is a blunt cost cut, not a per-tier tuning.
4. **Shadow copy (manual variant of option 2)** — a same-named agent file in your project's `.claude/agents/` outranks the plugin's copy for the **bare** name (project scope > plugin scope). Caveat: the plugin's orchestrator routes via scoped calls (`@kairos:pm-agent`, …), which keep resolving to the plugin's agents with shipped models, so a lone shadow copy only affects direct bare-name invocations. For pipeline-wide effect, copy all 17 core agents and rewrite the scoped `@kairos:` calls to bare names (this is what the advanced path of `/kairos:setup` automates).

::: info Two things called effort
Claude Code's `effort:` agent-frontmatter field (`low`, `medium`, `high`, `xhigh`, `max`) sets how deeply that agent reasons. KAIROS's `effort` (`simple_fix`, `medium`, `significant_rework`) is the size of the change: `impact-assessment-agent` measures it and the orchestrator stamps it into every agent's prompt. The T-shirt `size` (`XS` to `XL`) is a finer label derived from the same facts; only `effort` decides how thorough an agent is. They are unrelated and live in different places. The shipped agents set no `effort:` in their frontmatter, and the Agent call has no per-call effort parameter, so reasoning depth can only be set per agent file, not per run.
:::

---

## Suggested Models

Claude Code accepts short aliases that always resolve to the latest model in each family, or full versioned IDs (e.g. `claude-sonnet-4-6`) to pin a specific release.

| Alias | Resolves to | Use for |
|-------|------------|--------|
| `sonnet` | Latest Sonnet | The 10 execution agents — good balance of quality and speed |
| `opus` | Latest Opus | Orchestrator and the 6 other reasoning-heavy agents (architect, context extractor, impact assessment, security reviewer, improvement advisor, bug triage) |
| `haiku` | Latest Haiku | Team Mode teammates — fast and cost-efficient |

### Per-agent defaults

These are the tiers `agents/*.md` actually ships with — same split as "Customizing models" above.

| Agent | Default | Upgrade trigger |
|-------|---------|----------------|
| `orchestrator-agent` | `opus` | Never downgrade — coordination requires full reasoning |
| `architect-agent` | `opus` | Never downgrade — system design requires full reasoning |
| `context-extractor-agent` | `opus` | Rarely needs downgrading — full-repo scans benefit from stronger reasoning |
| `impact-assessment-agent` | `opus` | Never downgrade — its facts drive the orchestrator's derivation of every downstream agent |
| `security-reviewer-agent` | `opus` | Never downgrade — adversarial security analysis requires full reasoning |
| `improvement-advisor-agent` | `opus` | Rarely invoked; keep on `opus` for cross-feature pattern recognition |
| `bug-triage-agent` | `opus` | Never downgrade — root-cause reasoning from partial evidence |
| `pm-agent` | `sonnet` | Upgrade to `opus` for enterprise features with competing constraints (compliance, multi-region, strict SLAs) |
| `implementer-tdd-agent` | `sonnet` | Upgrade to `opus` for complex TDD cycles spanning many files |
| `implementer-coder-agent` | `sonnet` | Upgrade to `opus` for complex codebases; no test-first overhead |
| `code-reviewer-agent` | `sonnet` | Upgrade to `opus` for deep security audits |
| `test-verifier-agent` | `sonnet` | Sufficient for coverage analysis |
| `qa-plan-agent` | `sonnet` | Sufficient for manual test design from real coverage gaps |
| `release-planner-agent` | `sonnet` | Sufficient for deployment planning |
| `documentation-agent` | `sonnet` | Sufficient for README/CHANGELOG/API-reference generation |
| `retrospective-agent` | `sonnet` | Sufficient for lessons synthesis from existing artifacts |
| `dependency-audit-agent` | `sonnet` | Scanning and tabulation; upgrade only for large monorepos with tangled transitive trees |

### Team Mode agents

| Agent | Model | Notes |
|-------|-------|-------|
| `implementer-lead-agent` | `opus` | Coordinates teammates — same tier as implementer |
| `teammate-*-agent` (×4) | `haiku` | Scoped, single-responsibility tasks — optimised for speed and cost |
