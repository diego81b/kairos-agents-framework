---
description: Guided KAIROS model setup — pick per-tier models and apply them to this project
allowed-tools: AskUserQuestion, Read, Write, Edit, Glob, Grep, Bash
---

# KAIROS Setup — guided model configuration

You are configuring which models the 11 KAIROS core pipeline agents will use in this project. Work through the steps below in order, and never touch anything outside them.

## Tier map (canonical defaults)

| Tier | Agents | Shipped `model:` |
|------|--------|------------------|
| Reasoning | `orchestrator-agent`, `architect-agent`, `context-extractor-agent`, `impact-assessment-agent`, `security-reviewer-agent` | `opus` |
| Execution | `pm-agent`, `implementer-tdd-agent`, `implementer-coder-agent`, `code-reviewer-agent`, `test-verifier-agent`, `release-planner-agent` | `sonnet` |

Team Mode files (`agents/team/`) are out of scope — leave them untouched.

## Step 1 — Detect install mode

Glob for `.claude/agents/*-agent.md` in the current project root.

- **All 11 core files present** → copy-install mode. Go to Step 3.
- **Missing (or only some present)** → plugin mode. Go to Step 2.

## Step 2 — Plugin mode only: choose how to apply models

Briefly explain to the user, then ask via `AskUserQuestion`:

- The plugin cache (`~/.claude/plugins/cache/...`) must never be edited — updates overwrite it.
- The plugin's orchestrator routes via scoped calls (`@kairos:pm-agent`, …), so per-agent models require project-level copies of the agents; project `.claude/agents/` files outrank the plugin for the bare names.

Options:

1. **Materialize project copies (Recommended)** — copy the 11 core agents into this project's `.claude/agents/`, then set per-tier models there. Full two-tier control.
2. **One global subagent model** — write `CLAUDE_CODE_SUBAGENT_MODEL` to `settings.json`. Coarse: every subagent (architect and security review included) runs on that single model.
3. **Cancel** — stop here.

**If option 2:** ask which model (`opus`, `sonnet`, `haiku`, `inherit`, or a full model ID) and which scope (project `.claude/settings.json` — committed, shared with the team; or global `~/.claude/settings.json` — this machine only). Read the chosen file if it exists, merge `"env": { "CLAUDE_CODE_SUBAGENT_MODEL": "<model>" }` preserving every existing key, write it back, confirm to the user, and STOP here (skip Steps 3–5).

**If option 1:** locate the newest plugin cache agents directory, e.g. with Bash `ls -d ~/.claude/plugins/cache/kairos/kairos/*/agents | sort -V | tail -1`. Copy the 11 core agent files (NOT `team/`) into `.claude/agents/`. Then, in every copied file, rewrite each `@kairos:<name>` call to `@<name>` for the 11 core agent names only — leave any `@kairos:team:*` reference untouched (Team Mode still resolves through the plugin). Continue to Step 3.

## Step 3 — Choose the model strategy

Ask via `AskUserQuestion`:

1. **Default (Recommended)** — reasoning = `opus`, execution = `sonnet`. As shipped; if the copies are unmodified, no edits needed.
2. **Economy** — reasoning = `sonnet`, execution = `haiku`. Biggest token savings while keeping the two-tier split.
3. **Inherit** — every agent `inherit` (follows the main conversation's model; simplest, single model for the whole pipeline).
4. **Custom** — ask once per tier; accept `opus`, `sonnet`, `haiku`, `inherit`, or a full model ID (e.g. `claude-opus-5`).

## Step 4 — Apply

For each of the 11 core files in `.claude/agents/`, set the frontmatter `model:` line according to the tier map and the chosen strategy. Edit **only** the `model:` line inside the YAML frontmatter — never the body. Preserve each file's formatting and line endings.

## Step 5 — Report

Print the resulting 11-row table (agent → model). Then remind the user:

- Project copies are local forks of the agent files: after a KAIROS update, re-copy the agents (or re-run `/kairos:setup` after materializing fresh copies) and re-apply.
- If copies were materialized from the plugin in Step 2, the pipeline now runs on the **project** orchestrator: invoke `@orchestrator-agent` (bare name), not `@kairos:orchestrator-agent` — the scoped plugin orchestrator would route to the plugin's agents with the shipped models.
