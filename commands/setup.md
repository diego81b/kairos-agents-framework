---
description: Guided KAIROS model setup — pick per-tier models and write them to .kairos-cfg/models (this project or your home folder)
allowed-tools: AskUserQuestion, Read, Write, Edit, Glob, Grep, Bash
---

# KAIROS Setup — guided model configuration

You are configuring which models the KAIROS pipeline agents use, for this project or for the user. Work through the steps below in order, and never touch anything outside them.

## How models are chosen

Every core agent ships with a `model:` in its frontmatter (`opus` or `sonnet`). The orchestrator can override it per agent by passing a `model` parameter on the call, read from the `models` files: `.kairos-cfg/models` in the project (committed, shared with the team), then the older `.kairos/.models`, then `~/.kairos-cfg/models` in the user's home directory, the first line naming an agent winning. Claude Code ranks that parameter above frontmatter, so the files work on a plugin install without touching the plugin cache and without project copies of the agents. It takes aliases only: `opus`, `sonnet`, `haiku`, `fable`. `inherit` and full model IDs are not accepted by the parameter; the Advanced path below covers them.

## Tier map (canonical defaults)

| Tier | Agents the orchestrator dispatches (covered by the `models` files) | Shipped `model:` |
|------|------|------|
| Reasoning | `architect-agent`, `impact-assessment-agent`, `security-reviewer-agent`, `bug-triage-agent` | `opus` |
| Execution | `pm-agent`, `implementer-tdd-agent`, `implementer-coder-agent`, `code-reviewer-agent`, `test-verifier-agent`, `qa-plan-agent`, `release-planner-agent`, `documentation-agent` | `sonnet` |

Not covered, frontmatter only: `orchestrator-agent` (the session's own model), the agents you start yourself (`context-extractor-agent`, `retrospective-agent`, `improvement-advisor-agent`, `dependency-audit-agent`), and the Team Mode files in `agents/team/`. This command writes no line for them; the orchestrator would honor a hand-written `implementer-lead-agent` line, but the teammates the lead spawns are out of its reach.

## Step 1 — Look at what exists

Read each of the three `models` files that exists and show its contents under its label: `project` (`.kairos-cfg/models`), `local` (`.kairos/.models`) and `user` (`~/.kairos-cfg/models`; resolve the home directory with Bash, `printf '%s' "${HOME:-$USERPROFILE}"`). Tell the user that applying a strategy replaces the file at the scope they choose in Step 2, so hand-written per-agent lines in it are lost, and that a `local` file is removed when the project file is written, because it would otherwise bring its old lines back.

## Step 2 — Choose the scope and the strategy

Ask both in one `AskUserQuestion` call. First the scope:

- **Only me, every project (Recommended)** — writes `~/.kairos-cfg/models`. Nothing is committed, so it cannot change anyone else's models.
- **This project, shared with the team** — writes `.kairos-cfg/models` in the project, which is meant to be committed. It beats each person's own file for the agents it names, so choose it only when the team means to share the models.

Then the strategy:

1. **Default (Recommended)** — reasoning = `opus`, execution = `sonnet`. As shipped, so nothing needs to be written: remove the file at the chosen scope if it exists (it only exists to differ from the defaults; for the project scope that is `.kairos-cfg/models` and `.kairos/.models`) and go to Step 4.
2. **Economy** — reasoning = `sonnet`, execution = `haiku`. Biggest token savings while keeping the two-tier split.
3. **Custom** — ask once per tier (both questions in one `AskUserQuestion` call); accept `opus`, `sonnet`, `haiku` or `fable`.
4. **Advanced** — you need `inherit`, a full model ID, or a model for an agent the file does not cover. Go to the Advanced path at the end and skip Steps 3-4.

## Step 3 — Write the `models` file

Create `.kairos-cfg/` at the chosen scope if it is missing (the project root, or the home directory). Expand each tier choice into one line per covered agent (the 12 agents in the tier map) and write `.kairos-cfg/models` there. For the project scope, then remove `.kairos/.models` if it exists. Never write a key, token or password into this folder: it is committed, and no setting needs one. Never touch `.gitignore`: `.kairos-cfg/` is meant to be committed.

```
# KAIROS models: one "<agent>: <alias>" line per agent. Written by /kairos:setup, safe to edit by hand.
# Aliases only: opus, sonnet, haiku, fable. Delete a line to use that agent's own model.
# No keys, tokens or passwords in this folder.
architect-agent: sonnet
impact-assessment-agent: sonnet
security-reviewer-agent: sonnet
bug-triage-agent: sonnet
pm-agent: haiku
...
```

Preserve the file's line endings if it already existed. Never edit an agent file in this path.

## Step 4 — Report

Print the models in effect, reading the three files again: agent → model, the file each line came from (`project`, `local`, `user`, or `shipped` when no file names the agent), marking each line that differs from the shipped model. A file at the other scope may still set lines the chosen strategy did not touch (a Default at the project scope leaves the user's file in force): say so by name. Then remind the user:

- The orchestrator reads the files before every dispatch, so a run in progress picks up an edit at its next call.
- It is Claude Code only. OpenCode and Kimi Code ignore them (their own model settings are on their setup pages).
- They cover only the agents in the tier map. The orchestrator and the agents started by hand keep their frontmatter model.
- The project file is meant to be committed, so the team gets the same models; the home file is only this user's. `docs/customizing.md` lists every setting and the order the files are read in.
- `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` in `settings.json` overrides these files.

## Advanced path — frontmatter or one global model

Use this only when the user picked **Advanced**. It changes agent files or `settings.json` instead of the `models` files.

### A — Detect install mode

Glob for `.claude/agents/*-agent.md` in the current project root.

- **All 17 core files present** → copy-install mode. Go to C.
- **Missing (or only some present)** → plugin mode. Go to B.

### B — Plugin mode only: choose how to apply models

Briefly explain to the user, then ask via `AskUserQuestion`:

- The plugin cache (`~/.claude/plugins/cache/...`) must never be edited — updates overwrite it.
- The plugin's orchestrator routes via scoped calls (`@kairos:pm-agent`, …), so per-agent frontmatter models require project-level copies of the agents; project `.claude/agents/` files outrank the plugin for the bare names.

Options:

1. **Materialize project copies (Recommended)** — copy the 17 core agents into this project's `.claude/agents/`, then set per-tier models there. Full two-tier control, including `inherit` and full model IDs.
2. **One global subagent model** — write `CLAUDE_CODE_SUBAGENT_MODEL` and `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` to `settings.json`. Coarse: every subagent (architect and security review included) runs on that single model, and the `models` files stop having any effect. Without the FORCE variable the model would only apply to agents with no `model:` of their own, which is none of ours.
3. **Cancel** — stop here.

**If option 2:** ask which model (`opus`, `sonnet`, `haiku`, `inherit`, or a full model ID) and which scope (project `.claude/settings.json` — committed, shared with the team; or global `~/.claude/settings.json` — this machine only). Read the chosen file if it exists, merge `"env": { "CLAUDE_CODE_SUBAGENT_MODEL": "<model>", "CLAUDE_CODE_SUBAGENT_MODEL_FORCE": "1" }` preserving every existing key, write it back, confirm to the user, and STOP here.

**If option 1:** locate the newest plugin cache agents directory, e.g. with Bash `ls -d ~/.claude/plugins/cache/kairos/kairos/*/agents | sort -V | tail -1`. Copy the 17 core agent files (NOT `team/`) into `.claude/agents/`. Then, in every copied file, rewrite each `@kairos:<name>` call to `@<name>` for the 17 core agent names only — leave any `@kairos:team:*` reference untouched (Team Mode still resolves through the plugin). Continue to C.

### C — Choose the model strategy

The frontmatter tiers cover all 17 core agents:

| Tier | Agents | Shipped `model:` |
|------|--------|------------------|
| Reasoning | `orchestrator-agent`, `architect-agent`, `context-extractor-agent`, `impact-assessment-agent`, `security-reviewer-agent`, `improvement-advisor-agent`, `bug-triage-agent` | `opus` |
| Execution | `pm-agent`, `implementer-tdd-agent`, `implementer-coder-agent`, `code-reviewer-agent`, `test-verifier-agent`, `qa-plan-agent`, `release-planner-agent`, `documentation-agent`, `retrospective-agent`, `dependency-audit-agent` | `sonnet` |

Ask via `AskUserQuestion`:

1. **Default (Recommended)** — reasoning = `opus`, execution = `sonnet`. As shipped; if the copies are unmodified, no edits needed.
2. **Economy** — reasoning = `sonnet`, execution = `haiku`.
3. **Inherit** — every agent `inherit` (follows the main conversation's model; simplest, single model for the whole pipeline).
4. **Custom** — ask once per tier; accept `opus`, `sonnet`, `haiku`, `inherit`, or a full model ID (e.g. `claude-opus-5-5`).

### D — Apply

For each of the 17 core files in `.claude/agents/`, set the frontmatter `model:` line according to the tier map and the chosen strategy. Edit **only** the `model:` line inside the YAML frontmatter — never the body. Preserve each file's formatting and line endings.

### E — Report

Print the resulting 17-row table (agent → model). Then remind the user:

- Project copies are local forks of the agent files: after a KAIROS update, re-copy the agents (or re-run `/kairos:setup` after materializing fresh copies) and re-apply.
- If copies were materialized from the plugin in B, the pipeline now runs on the **project** orchestrator: invoke `@orchestrator-agent` (bare name), not `@kairos:orchestrator-agent` — the scoped plugin orchestrator would route to the plugin's agents with the shipped models.
- A `models` file (`.kairos-cfg/models`, `.kairos/.models` or the home folder's) still outranks these frontmatter edits for the agents it names. Delete a line, or the file, if you want the frontmatter value to apply.
