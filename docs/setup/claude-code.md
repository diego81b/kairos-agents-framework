# Claude Code Setup

Claude Code is the **recommended tool** for KAIROS. Each agent runs in an isolated context with its own model and tools list, and the orchestrator can ask you questions at every gate (`AskUserQuestion`) when it runs as the session's primary agent — exactly as KAIROS is designed. Layered Mode and the `/kairos:*` commands exist only here.

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

This gets you the 17 core agents, the internal skills (`contract-checklist`, `coding-discipline`, etc.), and the `/kairos:setup` / `/kairos:view` / `/kairos:usage` slash commands in one shot. Agents are invoked with the `kairos:` scope — `@kairos:orchestrator-agent`, `@kairos:pm-agent` — and the Layered Mode agents with `@kairos:team:implementer-lead-agent` (the orchestrator dispatches them; you do not start them yourself).

### Option B — Manual copy

Claude Code also discovers subagents from a `.claude/agents/` directory inside your project — useful if you want to edit the shipped agent files for your team's own conventions instead of tracking the plugin as-is.

```bash
# From your project root
mkdir -p .claude/agents/team
cp path/to/kairos/agents/*.md .claude/agents/
cp path/to/kairos/agents/team/*.md .claude/agents/team/
```

This copies **agents only**. The agents read the shared skills by relative link, so copy `skills/` too. For the `/kairos:setup` / `/kairos:view` / `/kairos:usage` commands, copy `commands/` as well. `/kairos:usage` also needs `scripts/usage.mjs` and Node 18 or later, and the command file calls it through `${CLAUDE_PLUGIN_ROOT}`, which only a plugin install defines: with a manual copy, run `node path/to/kairos/scripts/usage.mjs` yourself.

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
│       └── team/                      ← Layered Mode agents (folder name kept from v9.4)
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

The `team/` folder (`implementer-lead-agent.md` + the four layer agents) is only needed if you want Layered Mode to be offered.
:::

## Step 2 — Understand how subagents are loaded

When Claude Code starts, it reads every `.md` file in `.claude/agents/` and parses the YAML frontmatter:

```yaml
---
name: pm-agent
description: "Analyzes feature requirements and elicits constraints. Use when you have a vague feature request that needs structured analysis."
tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion
model: sonnet
---
```

The `description` field tells Claude Code what the agent is for, so it can pick it when you ask for it in a normal chat. Inside a KAIROS run the orchestrator does not read descriptions: it derives each agent from facts and its own rules, and you confirm or correct the result at the Start Gate.

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

The orchestrator reads the task and, if it reads as a bug report, has the bug triage reproduce it first. When the run covers analysis or development it then measures the change with the impact assessment, and shows the **Start Gate**: the pipeline it derived from those facts, the effort and the review loop in plain words. You start it, change it or stop it. Only then does the first pipeline agent run, usually `pm-agent` when the change is big enough to need requirements. Agents are never picked from a menu: every one is derived from facts, and you correct the result in free text or with **Change the pipeline**.

To say what the run is for, add a phrase to the request: `analizziamo` (analysis only), `scrivi le issue` (analysis, with `pm-agent`, ending in text you paste into your tracker), `implementiamo` (full pipeline), `finalizziamo` (review of a change already made). See [Templates](./templates) for the full list.

## Step 4 — The HITL loop in practice

After each phase the orchestrator walks the artifact's risk rows one by one (Accept, Mitigate now, Escalate, Refute premise), then prints the artifact's short `## Summary` block and asks for a decision:

```
## Summary
**What:** Requirements for Stripe payments: 6 acceptance criteria, 2 constraints
**Decision:** hosted checkout page, no card data stored by us
**Needs your attention:** R2 — see Risks
**Open:** Q1 — see ledger
**Next:** architect-agent

Approve · Request changes · Skip next · Stop pipeline
```

**You must choose before the orchestrator proceeds.** This is the HITL checkpoint: it keeps downstream agents from working on bad input. Reply `open` to see the full artifact in your editor, and the same gate comes back.

Three gates continue on their own when nothing needs a decision: the bug triage, the requirements and the last wave of Phase 3. They print what they accepted for you, and `every gate` in free text brings the question back. Gates that write outside `.kairos/` (the documentation draft, the QA plan) always ask.

Each artifact is saved as soon as the agent finishes, before the gate: `.kairos/<feature_folder>/01-requirements.md` for this one.

## Step 5 — Check `.kairos/` outputs

Each phase writes a single Markdown file: a small YAML frontmatter header (status, counts) followed by the human-readable report body (data model, issues, findings, runbook). One folder per issue, named after the issue key (`issue-42_add-stripe`), or `feature_<slug>` when the run has no issue:

```
.kairos/
└── issue-42_add-stripe/
    ├── _tracking.md                 ← where the run is, open questions, one log line per gate: keep this tab open
    ├── 00b-impact.md                ← impact assessment (size, effort, domains)
    ├── 01-requirements.md           ← pm-agent
    ├── 02-architecture.md           ← architect-agent
    ├── 03-implementation-plan.md    ← implementer plan (gate before any source file changes)
    ├── 03-implementation.md         ← implementer
    ├── 04-review.md                 ← code-reviewer-agent
    ├── 04b-security-review.md       ← security-reviewer-agent, when it runs
    ├── 05-test-verification.md      ← test-verifier-agent
    ├── 05b-qa-plan.md               ← qa-plan-agent, when a person verifies by hand
    ├── 06-deployment-plan.md        ← release-planner-agent
    ├── _issues.md                   ← only an analysis-only run: issue text to paste into your tracker
    └── ledger/                      ← constraints, decisions, open questions, run.md
```

Which of these exist depends on the run: a small fix has no `01`, `02` or `06`. The orchestrator creates the folder itself and offers once per project to add `.kairos/` to `.gitignore`; these files are the audit trail, and you can commit them if you want what was decided and why in git.

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

Each phase agent offers to post its validated output as a comment (optional, after your approval). These are the commands behind it:

```bash
# Jira (jira-cli — https://github.com/ankitpokhrel/jira-cli)
jira issue comment add PROJ-42 "$(cat .kairos/PROJ-42_my-feature/01-requirements.md)"

# GitLab (glab CLI — https://gitlab.com/gitlab-org/cli)
glab issue note 42 --message "$(cat .kairos/issue-42_my-feature/01-requirements.md)"

# Bitbucket (REST API)
curl -X POST "https://api.bitbucket.org/2.0/repositories/{workspace}/{repo}/issues/42/comments" \
  -u "${BITBUCKET_USER}:${BITBUCKET_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"content":{"raw":"..."}}'
```

Requires the respective CLI authenticated: `jira init`, `glab auth login`, or a Bitbucket app password in `BITBUCKET_TOKEN`.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Agent not found | Check `.claude/agents/` exists and contains `.md` files with valid YAML frontmatter |
| Wrong model used | Check the model lines the Start Gate printed and the file each came from (`.kairos-cfg/config`, an older `models` file or `~/.kairos-cfg/config`; they outrank frontmatter for agents the orchestrator dispatches), then the agent's `model:` frontmatter. `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` in `settings.json` overrides both |
| Orchestrator not calling an agent you expected | It derives agents from facts, not from descriptions. Read the Start Gate's `✅`/`⏭️` lines for the rule that decided it, then use **Change the pipeline** (or `add <agent>` in free text) to force it. A saved `## KAIROS Pipeline` section in the issue wins over the derivation |
| `.kairos/` not created | The orchestrator creates `.kairos/<feature_folder>/` at the start of a run with its `Write` and `Bash` tools. If nothing appears, the session probably did not start with the orchestrator as primary agent (see Step 3), or the run stopped at the Start Gate |
| Gates keep degrading to a text menu / `AskUserQuestion` unavailable | The orchestrator is running as a subagent, not as the session's primary agent — it was invoked by name (`@orchestrator-agent` / `@kairos:orchestrator-agent`) inside an existing chat instead of at startup. Exit and relaunch with `claude --agent kairos:orchestrator-agent` (plugin) or `claude --agent orchestrator-agent` (manual copy) — see Step 3 |
| Orchestrator seems to vanish mid-pipeline with no error | Same root cause as above — a subagent-dispatched orchestrator dies if its parent session ends or resets. Restart the same way as above; start the same issue again and the run resumes from `ledger/run.md` (an interrupted agent is re-invoked, a gate left open is shown again) |
| `claude plugin install` succeeds but agents don't show up | The plugin may need explicit activation — run `claude plugin enable kairos` and confirm with `claude plugin list` |

## Layered Mode: no extra setup

Layered Mode replaces the single implementer (`implementer-tdd-agent` or `implementer-coder-agent`) with a lead and up to four layer agents: tests, backend, frontend and database. It needs no flag and no setting, only Claude Code and the plugin, which ships the `team/` folder with the rest.

::: info Formerly Team Mode
Until v9.5.0 this was called Team Mode and ran on Claude Code's experimental Agent Teams feature. Under the Orchestrator it could not start: the Orchestrator dispatches the lead as a subagent, and only the main conversation can create an Agent Team. The mode now runs as ordinary subagent calls that the Orchestrator coordinates. The agent ids and file names are unchanged (`kairos:team:implementer-lead-agent`, `teammate-*-agent`), so a `## KAIROS Pipeline` checklist or an `Add:` line that names them keeps working.

`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is no longer needed and KAIROS no longer reads it. If it is still set in your settings nothing in KAIROS depends on it, but what Claude Code does with it while the Orchestrator dispatches named subagents has not been verified here, so you may want to remove it if you set it only for KAIROS.
:::

### What changed from the Agent Teams version

| | Team Mode (v9.4 and earlier) | Layered Mode (v9.5.0) |
| --- | --- | --- |
| Coordinator | The lead, creating an Agent Team | The Orchestrator, with plain subagent calls |
| Needs | Experimental flag, Claude Code 2.1.32 or later, an interactive main session | Claude Code with the plugin |
| Started under the Orchestrator | No: the lead had no way to create a team | Yes |
| Peer messaging and a shared task list | Offered; in practice teammates only messaged the lead | Not used |
| Live progress, messaging a running teammate | Yes | No: each call returns a report on disk |
| Fixing a contract mismatch | A message to the live teammate | A new call that reads the fix tasks from disk, in a fresh context |
| Who runs the test suite | Every teammate | Only the lead's verify stage |
| Running the lead on its own | Mentioned, never documented as a path | Not supported: the lead is dispatched by the Orchestrator |

What it keeps from the old design: four binding contracts written before any layer starts, tests before code (RED before GREEN), owned paths per layer, the layers working in parallel, and one compliance check against the contracts.

What it costs is not measured. A run is one `opus` lead call to plan, one to verify and one to close (more for each fix round), plus one `haiku` call per layer for each stage. The old "3.5 times" figure predicted a mode that never ran, so it is gone. Read `_usage.md` after the first runs to see what your project pays.

### How Layered Mode is offered

It is never started automatically. Right before the implementation plan, when the TDD path was chosen, two or more of backend/frontend/db are touched and the host is Claude Code, the Orchestrator offers it with a short cost note and asks for confirmation. The same question appears when an issue checklist or an `Add:` override names `implementer-lead-agent`:

```
⚠️  LAYERED MODE — COST WARNING

Single Agent:  one implementer run (implementer-tdd-agent)
Layered Mode:  more calls than that, several of them on opus (Claude Code only)

Why offered:   <layers in domains>
Calls:         lead plan, tests RED, one call per layer in scope for GREEN, lead verify,
               REFACTOR, lead close, plus a fix round for every contract mismatch found.
Cost:          not measured. Read _usage.md after the run.
Worth it for:  changes where the layers must agree on binding contracts.
```

then a three-option prompt: **Confirm Layered Mode**, **Single agent**, **Cancel pipeline**. Confirming lowers the review loop's retries to 2 if they were higher.

### Stages

```
3a  Lead (opus)    reads the design, writes the four contracts and the plan   → plan gate (you approve)
3b  RED            tests agent      writes the failing tests, alone
    GREEN          backend / frontend / database agents, in parallel, only the layers in scope
    VERIFY         lead             checks every layer against the contracts and runs the whole suite
    FIX            only the layers VERIFY named, then VERIFY again
    REFACTOR       the implementation layers, in parallel, tests stay green
    CLOSE          lead             re-runs the suite, updates the ledger, writes 03-implementation.md
```

A review-loop or post-gate fix pass skips RED and REFACTOR: the lead scopes the fix to the layers that own the files in question, those layers fix, and the lead closes.

Four rules keep the parallel part safe:

- **One runner of the suite.** The GREEN and REFACTOR layers write code to the contract and run static checks on their own files at most. Only the lead's VERIFY and CLOSE stages run tests, a build or a migration, so three agents in one worktree never trample each other's output; the whole suite runs once, at the close of the last planned wave, and every other run is the related tests. RED runs alone, so the tests agent may run its own new tests to confirm they fail.
- **One writer of shared state.** Only the lead writes the ledger and the contracts. Each layer agent writes its own report, `03-layer-<layer>.md`, and the lead writes `03-verify.md`; the Orchestrator keeps `run.md`.
- **Handoff on disk.** Contracts, fix tasks and cross-domain requests travel as files in the feature folder, not pasted into prompts. A layer that needs a change in another layer's files says so in its report, and the lead routes it.
- **At most two repeats per contract field.** A layer that misses the same field twice stops the run for your decision instead of being asked a third time.

Contract mismatches found while the lead writes the contracts appear as rows in the plan's `## Risks` table, so you resolve them at the plan gate with the same Accept, Mitigate now, Escalate and Defer options as any other row. Escalate sends the work back to the architect.

### Where Layered Mode runs

| Host | Layered Mode |
| --- | --- |
| **Claude Code plugin** | Yes. The Orchestrator coordinates the stages above. |
| OpenCode, Kimi Code, Cursor, VS Code, JetBrains, Codex | Not offered. The `team/` agents are not mirrored there, and the Orchestrator offers the mode only on Claude Code. Use the single implementer. |
| **kairos-cli** (the v10 runner, a separate project) | Not part of this repository, and Layered Mode there is a separate decision. A runner schedules waves natively, so it needs no Agent Teams: the same stages (contracts first, RED before GREEN, parallel GREEN per layer, one verify) are what its dispatcher would run. |

---

## Full pipeline

```
You ──► Orchestrator
         │
         ├─ bug-triage-agent (bug reports only)        → 00c-bug-triage.md
         ├─ impact-assessment-agent (analysis or code) → 00b-impact.md
         ├─[Start Gate]─ the pipeline derived from those facts: you confirm or change it
         │
         ├─[gate]─► pm-agent                  → 01-requirements.md
         ├─[gate]─► architect-agent           → 02-architecture.md
         ├─[gate]─► implementer plan          → 03-implementation-plan.md
         ├─[gate]─► implementer-tdd-agent     → 03-implementation.md
         │           or
         │          implementer-coder-agent (code-first)
         │           or
         │          implementer-lead-agent (Layered Mode)
         │           ├── teammate-tests-agent    [RED, alone]
         │           ├── teammate-backend-agent  ┌
         │           ├── teammate-frontend-agent ├── GREEN, parallel
         │           ├── teammate-database-agent ┘
         │           └── lead verifies, layers refactor, lead closes
         ├─[one gate]─► review wave, in parallel
         │           ├── code-reviewer-agent      → 04-review.md
         │           ├── security-reviewer-agent  → 04b-security-review.md (when derived)
         │           └── test-verifier-agent      → 05-test-verification.md (when tests were written)
         │           then one fix pass and a recheck, until nothing blocks
         ├─[gate]─► qa-plan-agent (optional)          → 05b-qa-plan.md
         ├─[gate]─► release-planner-agent             → 06-deployment-plan.md
         └─[gate]─► documentation-agent (optional)    → 06b-documentation.md
```

Each `[gate]` is a pause where **you** review and decide before the next agent runs, except the three that continue on their own when nothing needs a decision. Which agents run at all is derived from the change: a `simple_fix` goes from the impact assessment to the code-first implementer and the code review, and skips the rest. All files land in `.kairos/<feature_folder>/`.

---

## Customizing models

KAIROS's shipped frontmatter splits agents into two tiers: `opus` for the 7 reasoning-heavy agents (`orchestrator`, `architect`, `context-extractor`, `impact-assessment`, `security-reviewer`, `improvement-advisor`, `bug-triage`) and `sonnet` for the 10 execution agents (`pm`, `implementer-tdd`, `implementer-coder`, `code-reviewer`, `test-verifier`, `qa-plan`, `release-planner`, `documentation`, `retrospective`, `dependency-audit`). Those are the defaults: with nothing configured, every agent runs on its own `model:`.

Claude Code picks a subagent's model in this order: the `model` parameter of the call that starts it, then the agent's frontmatter `model:`, then the `CLAUDE_CODE_SUBAGENT_MODEL` environment variable, then the main conversation's model (older Claude Code versions ranked the environment variable first). There are four ways to change the result:

1. **`model.` lines in `.kairos-cfg/config` (recommended)** — a plain-text file, one `model.<agent>: <alias>` line per agent, written by `/kairos:setup` (Default, Economy or Custom strategy) or by hand. Put it in the project's `.kairos-cfg/` to share it with the team (it is committed) or in `~/.kairos-cfg/` to keep it to yourself; the project beats your home folder, and the older `models` files (`.kairos-cfg/models`, `.kairos/.models`, `~/.kairos-cfg/models`) are still read (see [Customizing KAIROS](/customizing) for the full order). Before each dispatch the orchestrator reads the files and passes the alias as the call's `model` parameter, which outranks the agent's frontmatter. Nothing else changes: no forked agent files, no edits to re-apply after a plugin update, and deleting the file restores the shipped tiers. The Start Gate shows the lines in effect and where each came from. Never put an API key or token in these files: `.kairos-cfg/` is committed, and keys stay in your keychain.
   ```
   # .kairos-cfg/config
   model.architect-agent: opus
   model.pm-agent: haiku
   model.code-reviewer-agent: opus
   ```
   It has three limits. It holds aliases only (`opus`, `sonnet`, `haiku`, `fable`), because the per-call parameter takes neither `inherit` nor a full model ID; a line with anything else is reported and ignored. It applies only to agents the orchestrator dispatches: `impact-assessment`, `bug-triage`, `pm`, `architect`, both implementers, `code-reviewer`, `security-reviewer`, `test-verifier`, `qa-plan`, `release-planner` and `documentation`. The orchestrator itself and the agents you start yourself (`context-extractor`, `retrospective`, `improvement-advisor`, `dependency-audit`) keep their frontmatter model. Since v9.5.0 the Layered Mode lead and layer agents are dispatched by the orchestrator, so a line such as `model.teammate-backend-agent: sonnet` applies to them too. And it is Claude Code only: OpenCode and Kimi Code ignore it (their own model settings are on their setup pages).
2. **Edit the `model:` frontmatter** in your `.claude/agents/` copies. This is the way to get `inherit`, a full model ID (e.g. `claude-opus-5-5`), or a different model for the agents option 1 does not reach. Downside: your edits are local forks, so re-apply them after re-copying updated KAIROS agents.
3. **Global subagent model** — `CLAUDE_CODE_SUBAGENT_MODEL` in `settings.json` is only the fallback for a subagent that has no `model:` of its own. Every KAIROS agent declares one, so by itself the variable changes nothing. Add `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` to make it override both the frontmatter and the per-call parameter (which also switches the model lines off):
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
Claude Code's `effort:` agent-frontmatter field (`low`, `medium`, `high`, `xhigh`, `max`) sets how deeply that agent reasons. KAIROS's `effort` (`simple_fix`, `medium`, `significant_rework`) is the size of the change: `impact-assessment-agent` measures it and the orchestrator stamps it into every agent's prompt. The T-shirt `size` (`XS` to `XL`) is a finer label derived from the same facts; only `effort` decides how thorough an agent is. They are unrelated and live in different places. The shipped agents set no `effort:` in their frontmatter except `qa-plan-agent` (`medium`, since v9.10.0, Claude Code only), and the Agent call has no per-call effort parameter, so reasoning depth can only be set per agent file, not per run.
:::

---

## Suggested Models

Claude Code accepts short aliases that always resolve to the latest model in each family, or full versioned IDs (e.g. `claude-sonnet-5-5`) to pin a specific release.

| Alias | Resolves to | Use for |
|-------|------------|--------|
| `sonnet` | Latest Sonnet | The 10 execution agents — good balance of quality and speed |
| `opus` | Latest Opus | Orchestrator and the 6 other reasoning-heavy agents (architect, context extractor, impact assessment, security reviewer, improvement advisor, bug triage) |
| `haiku` | Latest Haiku | Layered Mode layer agents — fast and cost-efficient |

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

### Layered Mode agents

| Agent | Model | Notes |
|-------|-------|-------|
| `implementer-lead-agent` | `opus` | Writes the contracts, verifies each layer against them, closes the pass: three or more calls per run |
| `teammate-*-agent` (×4) | `haiku` | Scoped, single-responsibility tasks — optimised for speed and cost |
