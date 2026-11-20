---
description: "Run-setup choices for orchestrator-agent that fire in some runs only: the manual pipeline dialog, deciding agent by agent, and the once-per-project Manual QA and QA directory settings. Read at the point orchestrator-agent names each one."
---

# Orchestrator: run choices

Text moved unchanged out of `orchestrator-agent`, which names the point where each section applies. Terms such as `derivation`, `areas`, `corrected` and `run.md` keep the meaning they have there.

## Manual pipeline

**Manual pipeline** (the answer **Choose the pipeline myself**). One `AskUserQuestion` call with four questions, one per area, so the person goes through the pipeline in one dialog and picks agents inside each group. Each option's description is the agent's job in one clause, and an empty answer means none of that group:
- `header` `"Analysis"`, `multiSelect: true`: `impact-assessment-agent` (measures the change and reports the facts), `pm-agent` (requirements and acceptance criteria), `architect-agent` (design and contracts).
- `header` `"Development"`, `multiSelect: false`: `Skip development`, `implementer-tdd-agent` (test first), `implementer-coder-agent` (code first, then the tests it decides on) and, on Claude Code only, `implementer-lead-agent` (Layered Mode, one lead and one agent per layer). Mark `(Recommended)` the tdd implementer when the test-suite check (Step 0e) finds a suite, the coder otherwise, and name the fact in the description (`test suite found: jest.config.js`, or `no test suite found`): the check is a filesystem fact and needs no assessment.
- `header` `"Review"`, `multiSelect: true`: `code-reviewer-agent`, `security-reviewer-agent`, `test-verifier-agent`.
- `header` `"Delivery"`, `multiSelect: true`: `qa-plan-agent`, `release-planner-agent`, `documentation-agent`.

Build a checklist from the ticked agents, in pipeline order: `template_kind = checklist`, `derivation = off`, `active_agents` the ticked agents, `areas` the areas with at least one ticked agent, `corrected = true` and `manual_pipeline = pending` (Run Settings Persistence; the Issue Write-back below clears it). It is a checklist with an Auto-fix line, not a legacy one: the Effort Presets apply, and `effort` is the impact assessment's when it is ticked, else `medium` named as `default, no impact assessment in your pipeline`; the Start Gate's free text changes it. Then continue as the Checklist path does, with two differences: nothing is read from the issue, so the line `Using the checklist saved in <issue key>` reads `Using the pipeline you chose`, and there is no **Derive instead**. A run with no agent ticked ends here as an empty pipeline (Step 0f). Without `AskUserQuestion`, print the four groups and ask for the agent names to run in each, or `none`.

## Deciding agent by agent

**Deciding agent by agent** (`agent_decisions: ask`, derived runs only; `derived` unless the human chose **Decide each step** in the Area Selection question, wrote `decide each step` / `decidi tu ogni step` in the prompt that started the run (which answers that question when it is asked), or replied it at the Start Gate; `derive` and **All areas** (`full`) turn it off, and a saved pipeline never has it). **A pipeline the issue already decided is never put to the human again.** An issue whose `## KAIROS Pipeline` section made this a fast start (an override block, with or without `Areas:`, or a checklist, where `derivation=off` and there are no rules to recommend) asks no agent question at any point, and a `decide each step` in the launch prompt does not change that: print one line, `🧭 <issue key> carries its own pipeline: Decide each step ignored. Edit the issue's section to change it.`, and go on. The one way in is the human typing it at a Start Gate that asks anyway (Step 0f, **Fast start**), which is their own act and not a question put to them. The rules still run at every decision point and decide nothing alone: the Decision Announcement above becomes a question, so the human has the last word on each agent and the rules' answer is the recommendation, never silently the outcome. Print the same `🧭` block under the header `🧭 The rules say:`, then ask, once per decision point, about the agents that point decides inside `areas`, **except** the implementer (which one runs follows `change_kind` and the design, and `Add: <implementer>` still forces another) and any agent already in `overrides.add` or `overrides.skip`, which keep the human's earlier word and print as `(added by you)` / `(skipped by you)`. The points are the Start Gate (the Step 0e rows, asked after the pipeline is printed and before `Start the pipeline as shown?`), the Phase 3 gate (before the review wave) and the review gate (before Phase 5b). One row changes point: `code-reviewer-agent`'s rule reads whether an implementer runs, so in this mode it is asked at the Phase 3 gate, with the two reviewers decided there, and not at the Start Gate, where it would be a question about reviewing code nothing has written yet, put to a person who may have come for an analysis. It stays in the Start Gate question only when no implementer will run (`development` not selected, or `change_kind: analysis`), because there is no Phase 3 gate to ask it at. Ask even where `phase_gates: on_signal` would let the gate continue: the question is the stop the human asked for. If `AskUserQuestion` is available, call it:
- `question`: `"Which of these should run?"`, `header`: `"Agents"`, `multiSelect: true`; one option per agent, the label the agent's name with ` (Recommended)` when the rules say it runs, the description says in plain words what the agent does and why the rules recommend it or not (`reviews the code this run writes`, `not needed: the change adds no contract`), never the rule's own wording (`an implementer runs`), which names a condition and gives a person nothing to weigh. A point left with one agent is asked as a single-select, `Run <agent>` and `Skip <agent>`, the rules' answer marked `(Recommended)`. A point has at most three agents, which is the option limit of one question.

A ticked agent runs and an unticked one does not. Where the answer differs from the rules, store it as the same override a free-text correction would: ticked against the rules into `overrides.add`, unticked against them into `overrides.skip` (removing the name from the other list), set `corrected = true`, add the agents that run to `active_agents` and rewrite `run.md`. Append `<date> | <point> | chosen by you | runs <agents> / skipped <agents> (against the rules: <agents, or none>)` to `_tracking.md`'s `## Log` in place of the `derived` line. A point whose agents all hold an override asks nothing and logs `derived` as usual. Without `AskUserQuestion`, print the rules' answer and ask for a typed reply: `ok` takes it, or a list of the agents that should run.

**Before the first agent question** (`agent_decisions: ask`). Two agents belong to no area and run before the Start Gate, where the first agent question sits: `bug-triage-agent` (the Bug-Input Check) and `impact-assessment-agent` (Impact Grounding). Left alone, a person who asked to decide agent by agent meets a lone yes or no about the triage, then watches the triage and the assessment run back to back with no question between them. Print this block once, as soon as `agent_decisions` is `ask` and before the first of the two is asked about or dispatched:

```
🧭 Before the Start Gate, where you decide the other agents, this run does two things first:
   ❓ bug-triage-agent: reproduces the bug and finds its root cause. You answer next.
   ▶️ impact-assessment-agent: sizes the change. Not asked: the rules need its facts to say what the other agents do.
```

Name a line only when that agent will run: the triage line when the Bug-Input Check will fire, the assessment line when Impact Grounding will run. Print nothing when neither does. The Bug-Input Check question and the assessment dispatch stay as they are, and the assessment is not asked about because the derivation cannot do without its facts. What changes is the stop between them: in this mode the triage gate never continues on its own (HITL step 2b), so the person reads the triage before the assessment starts.

## Manual QA and QA directory

**Manual QA setting** (once per project, and only at the gate that decides the `qa-plan-agent` row: the review gate normally, the Phase 3 gate when the review wave is skipped, Step 0e when `development` is not selected; never at the Start Gate). Whether a person verifies features by hand is a fact about the organisation, not the code, so no agent can report it. Asking it before any code was read, in a run that may never write a QA plan, is a question with no information behind it, so it waits until the answer can change the decision. Read the setting with this command before you decide anything, never from memory or from an earlier listing; it prints `<value> <file>` for the first usable file, `unusable <file>` for each file it skips, and nothing when no file exists:

```bash
for f in .kairos-cfg/config .kairos-cfg/manual-qa .kairos/.manual-qa; do
  [ -f "$f" ] || continue
  case $f in *config) t=$(grep -i '^manual-qa:' "$f");; *) t=$(cat "$f");; esac
  [ -n "$t" ] || continue
  v=$(printf %s "$t" | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]' | sed 's/^manual-qa://')
  case "$v" in yes|no) echo "$v $f"; break;; *) echo "unusable $f";; esac
done
for f in .kairos-cfg/manual-qa .kairos/.manual-qa; do
  [ -f "$f" ] || continue
  v=$(tr -d '[:space:]' < "$f" | tr '[:upper:]' '[:lower:]')
  case "$v" in yes|no) echo "$v $f"; break;; *) echo "unusable $f";; esac
done
```

A printed `yes` or `no` is the setting: apply the row with it and do not ask. Ask only when **all** of these hold: `derivation = on`; no usable `manual-qa` setting exists (see **Settings files**); `delivery` is in `areas`; `qa-plan-agent` is neither in `overrides.skip` nor already in `overrides.add` or `active_agents`; no `ledger/constraints.md` row with Category `VERIFICATION` already put it in; and at least one of the row's other conditions holds on the facts of this gate (`## Files Written`, or the change surface, has no `test` row; `05-test-verification.md` routes an `AC-n` to manual verification or lists one under `## Uncovered`; `frontend` in `domains`). Otherwise do not ask, and read a missing file as `no` for this decision without writing it. When all hold, ask just before the Decision Announcement, once the gate's summaries are printed. If `AskUserQuestion` is available (Claude Code), call it:
- `question`: `"<the fact that fired it, in one clause>: does a person verify features by hand in this project (QA, UAT)? Asked once per project."` Name the real fact, for example `"No test file in this change"`, `"AC-3 goes to manual verification"` or `"This change touches the frontend"`; when several hold, name the first one.
- `header`: `"Manual QA"`
- `options`:
  - **Yes** — a QA plan is written for this change, and for later ones that leave something for a person to check.
  - **No** — no QA plan is written, unless a constraint says a check needs a setup no developer environment has.

Write `yes` or `no` into `.kairos/.manual-qa`, then apply the row with it. If `AskUserQuestion` is not available, print the same two options as a menu and wait for a typed reply. The human changes the answer by editing or deleting the file, or shares it with the team by adding `manual-qa:` to the committed `.kairos-cfg/config`, which then wins. A run that never reaches this gate with every condition true never asks.

**QA directory setting** (once per project, and only when a QA plan has to be written into the repository, so it is asked from Phase 5b and never at the Start Gate). Where plans live is a fact about the project's own layout, so no agent can report it. If no `qa-dir` setting exists (see **Settings files**), ask. If `AskUserQuestion` is available (Claude Code), call it:
- `question`: `"Where should QA plans be saved in the repository? Asked once per project."`
- `header`: `"QA directory"`
- `options`:
  - **docs/qa-plans/** `(Recommended)` — created if it does not exist.
  - **qa-plans/** — at the project root.

A free-text reply is the path. Write it, relative to the project root, into `.kairos/.qa-dir`; refuse an absolute path and any path containing `..`, and ask again. If `AskUserQuestion` is not available, print the same two options as a menu and wait for a typed reply. The human changes the answer by editing or deleting the file, or shares it with the team by adding `qa-dir:` to the committed `.kairos-cfg/config`, which then wins.
