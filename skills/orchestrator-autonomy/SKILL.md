---
name: orchestrator-autonomy
description: "Autonomy for orchestrator-agent: the dial, the attention meter (criticality C and unsupervised load U), which rows and gates the orchestrator may decide without asking, the floor and fixed guards that are always asked, drift, and how every decision is traced and reverted. Read at the Start Gate, and at any Risk Disposition Loop or gate when `autonomy` is not `ask`."
---

# Orchestrator autonomy

Read by `orchestrator-agent` only. It decides how many questions a run asks. It never decides anything the `(Recommended)` option was not already going to say: step 2 of the HITL sequence derives that option mechanically from the row, and auto-decision executes that result when nothing below stops it. No new judgment, so no new way to be wrong; only who clicks changes.

## 1. The dial

`autonomy` is one of `ask`, `shadow`, `balanced`, `trust`. Resolve it once, at Step 0f, in this order: a phrase of the launch prompt (`chiedi tutto` or `ask all` gives `ask`; `fidati` or `trust` gives `trust`), then the `autonomy:` line of the project's `.kairos-cfg/config` (project folder only, never the home folder), then `balanced`. A saved `## KAIROS Pipeline` carries no autonomy line and never overrides the prompt. An unknown value reads as `balanced` and is named in the Start Gate line.

| Value | T | Behaviour |
|---|---|---|
| `ask` | 0 | Today's behaviour. No meter, no auto-decision, nothing from this skill. |
| `shadow` | 24 | Behaves exactly as `ask`, but computes S0, C and U at every decision and appends `shadow:` log lines (below). Opt-in, for calibration. |
| `balanced` | 24 | Default. Sections 4 to 7. The review gate never continues. |
| `trust` | 36 | As `balanced`, and the review gate may continue (section 6) for `simple_fix` and `medium`. |

`ask all`, `chiedi tutto`, `every gate` or `ogni gate` typed at any gate sets `autonomy: ask` for the rest of the run (and, for the two gate phrases, what the gate-setting correction already does). The Start Gate's **Change the pipeline** accepts the same words and `balanced`, `trust`, `shadow`. Interrupting the session halts at once.

## 2. The floor: always asked, whatever the dial says

1. Security rows rated `medium` or more. A `low` security row keeps the automatic Accept: three were accepted in the first real runs and none came back.
2. Premise refutation rows.
3. Escalate rows, and their follow-up question.
4. Decision conflict and Constraint conflict rows (step 1b), and any row or answer that changes scope (a `Scope:` decision) or a product decision.
5. A Layered Mode `Contract divergence` row, and the Layered Mode cost question.
6. Anything written outside `.kairos/` or posted to a tracker: the documentation draft, the issue write-back, QA delivery, the project summary, the size label.
7. Destructive or irreversible acts: the phase-file cleanup (unless the person's own `cleanup:` setting answers it, which is a standing human answer and not a dial decision), a data migration or rollback row rated `high`.
8. Failure states: a review loop exhausted with a row or an `AC-n` gap still standing, a stalled run, a failed contract check, a failing test.
9. A `critical` row of any agent.
10. A row of `medium` impact or more that names a constraint of a category the person declared (`SECURITY`, `PRIVACY`, `COMPLIANCE`): it skips the `quick_fix_mode` widening too. And every row at the architecture and plan gates while `domains` hold `auth` or `db`.
11. A `test-verifier-agent` row that names an `AC-n` with no covering test and no `VERIFICATION` row. It skips the automatic Accept of `low` rows and the `quick_fix_mode` widening too, at every dial value.

Fixed checkpoints, asked even when `on_signal` would continue: the Start Gate; the implementation plan gate for `medium` and `significant_rework` (a `simple_fix` plan may continue, section 6); the closing question. No dial value lifts the floor or a checkpoint, and no value lets a run go from the Start Gate to the close without a human answer.

## 3. The attention meter

Two numbers per run, kept in `run.md` under `attention`:

- **C, criticality.** Starts at S0 and only grows.
- **U, unsupervised load.** Grows with every decision taken without the person. Resets to 0 when the person answers a gate with a real choice (any answer other than Approve on a gate the rules would have continued, any disposition, any Escalate follow-up).

**Rule:** the run may decide on its own while `C + U < T`. At or over T it asks, and the answer resets U, never C. The room is `T - C - U`. A light issue flows through, a heavy one asks almost everything, and a surprise raises C and shrinks the room on the spot. Every figure here is a first cut with no outcome behind it; `shadow` exists to calibrate them.

**S0, the Work Score**, computed once at the Start Gate from facts that exist then (a fact that is absent adds 0, and the Start Gate line says `no impact assessment`):

| Axis | Points | Source |
|---|---|---|
| Footprint | size `XS` 0, `S` 1, `M` 3, `L` 5, `XL` 8 | `00b-impact.md` `size` |
| Reach | +1 per domain beyond the first; +3 for each of `auth` and `db`; +3 `contract_change: yes`; +2 `test_suite: no` | `00b-impact.md` frontmatter |
| Uncertainty | +2 per fact reported `unknown`; +1 per `Open` row (cap 4) | `00b-impact.md` |
| Hazard | its risk rows: `critical` 4, `high` 2, `medium` 1; cap 8 | `00b-impact.md` `risk_counts` |

S0 is a measure of how much work and how uncertain, not a predictor of rework.

**C grows with** (one `attention | C +2 | <reason>` log line each): a risk, issue or finding row of `medium` or more raised after the start (`medium` +1, `high` +2); an `AC-n` changed +2, dropped +4; a file written outside the approved plan +1 each (cap 4 per pass); a new domain +3; a contract change the architecture said was none +4; each fix pass after the first +2; a fix pass larger than 30 percent of the diff under review +2; a `Scope:` row +2; a `revert` +3; an answer that is not the `(Recommended)` option +1; a Request changes +2.

**U grows with:** a row decided without asking (`low` 1, `medium` 2, `high` 4); a gate continued without asking (release plan 2, architecture 4, implementation plan 3, review 5, bug triage or requirements 2). Waves continued by HITL step 1c cost nothing: they keep their own rule.

**When C is counted.** At HITL step 5b of every gate, from the tables that gate read: each row of `medium` or more that was not counted at an earlier gate (`high` and `critical` both +2), each `AC-n` whose state changed, each answer that is not the `(Recommended)` option, each fix pass and each file outside the plan. Rows of `00b-impact.md` are in S0 (Hazard) and never counted again here. Write `attention` to `run.md` in the same edit as the log lines.

Every C event and U cost is one `_tracking.md` log line, and the next gate that asks sums them in its digest.

## 4. Row auto-decision

HITL step 2 reads this section once, before it asks anything, when `autonomy` is `balanced` or `trust`. The existing automatic Accept of `low` rows and the `quick_fix_mode` widening stay as they are, cost no U, and run first, except for a row of floor item 10 or 11, which the widening skips (item 11 also the `low` rule).

A remaining row is decided without asking only when **all** hold: no floor item of section 2 applies; `C + U + cost < T`, with the row's U cost counted first; the row is not a Premise row; the mechanical `(Recommended)` option of step 2 is not Escalate (a Fix that is empty or describes a choice); and the row is **self-contained**: it cites a `file:line` or a section of an artifact, its Fix is one concrete action touching at most three files, it leans on no other row of the same gate and on no open question (`see R4`, `depends on Q2`), and the author's `Needs your attention` line names nothing. A row that fails any of these goes to the prompt loop exactly as today, whatever its impact.

The result is the agent's cell below, and it is taken only when it equals the mechanical recommendation. Where they differ, ask.

| Agent | `medium` | `high` (never `critical`) |
|---|---|---|
| `pm-agent`, `architect-agent` | Accept | ask |
| `implementer-*` plan risks | Accept | Mitigate now |
| `impact-assessment-agent` | ask | ask |
| `code-reviewer-agent`, `test-verifier-agent` | ask (never auto-Accepted: the person agreed with Accept on 1 reviewer `medium` row in 8) | ask |
| `security-reviewer-agent` | ask | ask |
| `qa-plan-agent` | Accept, except `open question` and `automatable gap` rows (ask) | ask |
| `release-planner-agent` | Accept | Mitigate now, ask when the row is about a migration or rollback |
| `documentation-agent` | Accept | ask |

A row decided here is written exactly as the person's pick would have been (Disposition cell, ledger row), with two differences: the ledger note ends `(auto-decided)` (`MUST — from 03 R2 (auto-decided)`), and an entry goes into `run.md`'s `auto_decided`. A fix pass started by an auto Mitigate now counts against the run's auto-fix budget.

**Cost shown where it is chosen.** A **Mitigate now** option whose Fix names files says what it touches in its description: `Fix touches 3 files, 2 outside the approved plan`. A person who still chooses it is not overruled; C grows by the files.

**Volume check.** More than 5 rows decided at one gate means something is off: undo them all (they are rows of that gate only, so nothing has been consumed), ask that whole batch, and log `auto stopped: volume, 7 rows`.

## 5. Drift

**Baseline** = what a person last approved. Record it in `run.md` at the Start Gate (`size`, `effort`, `domains`, the files `00b-impact.md` names, the number of `AC-n`, `contract_change`, and C), replace the file list with the plan's at the approval of the implementation plan gate, and replace the whole baseline only on **Accept and re-measure**. Measured against the declared size instead, the alarm would fire almost every run: growth past the declared size is the norm.

**Measure** after the impact assessment, at the plan (3a), at the last wave, at the review gate and after each fix pass, from numbers already in artifacts: production files in the plan and in `## Files Written` (the `Kind` column; `code` rows count), files on neither plan list, plan files absent from `02-architecture.md`, `AC-n` states in `_tracking.md`, `Scope:` decisions, `contract_change` in the diff.

- **Yellow**: C rose 6 or more since the baseline, not counting rows and answers a person decided at a gate (those are supervised, and the meter already holds them), or one soft fact: a file outside the approved plan, a `Scope:` row, an `AC-n` changed. None of the gates of section 6 continues while it holds (the base rules of HITL steps 1c and 2b are unchanged); rows may still be decided inside the room. It clears when a person answers a gate whose digest carried the drift line with anything but **Stop pipeline**: that answer sets the baseline's C to the current C and closes the soft facts; the rest of the baseline stays. Without this, C only grows and the level would stay yellow from the first `medium` row to the release plan.
- **Red**: C rose 8 or more, or one binary fact: an out-of-scope item touched, an `AC-n` dropped, a contract change the architecture said was none. The room is zero, no gate continues (base rules included) and the current gate asks the drift question first.

Held in `run.md` as `drift: green | yellow | red`. A change of level is one log line (`drift | green to yellow | plan lists 6 production files, approved 2`). A size declared higher than the work is only a line in the digest.

**The drift question** states what moved in plain words with the numbers and the artifact each came from, and offers: **Accept and re-measure** (Recommended when the added work follows from an answer the person gave; re-runs `impact-assessment-agent` with the new facts, which re-derives the pipeline and updates the `size:` label, then sets the new baseline; only at a gate, never inside a wave), **Cut it back** (a Request changes at the current phase with the out-of-scope items as feedback), **Split it** (the extra work becomes `_findings.md` entries, a `Scope:` decision cuts it from this run, the baseline stays), **Stop pipeline**. With the dial at `ask` a red level only prints the drift line.

## 6. Gates that may continue

Beyond HITL step 1c (waves) and step 2b (bug triage, requirements, last wave), `balanced` and `trust` let these continue, each only when `phase_gates` is `on_signal` and `C + U + cost < T`, and none when drift is yellow or red or a floor item holds. A continued gate runs every check a gate runs (step 0, step 1b, step 2) and logs as step 2b does, adding `rule:`.

1. **Release plan** (`06-deployment-plan.md`): status not `blocked`, no row asked at step 2, nothing about a migration or rollback rated `high`.
2. **Architecture** (`02-architecture.md`): `promptable: yes`, `effort` not `significant_rework`, `contract_change` none, `domains` hold no `db` or `auth`, and the phase added no open question, `Scope:` decision or `BLOCKING` constraint.
3. **Implementation plan** (3a), `simple_fix` only: step 2 asked nothing, no Escalate stands, the plan has no `## Test Decision` that skips tests, every `code` file is on the impact assessment's surface, Layered Mode is not chosen. The plan is not opened in the editor, and the log line names its path. `medium` and `significant_rework` always ask here.
4. **Review gate**, `trust` only, `simple_fix` and `medium` only: no row remains to ask and no reviewer reports a status the loop could not close. Never for `significant_rework`.

Stay `ask` always: the documentation draft, the QA plan gate (a plan with `delivery: none` still shows its gate), any gate with a floor item.

## 7. Tracing and revert

Nothing decided here is hidden.

- **Log keys.** A row decision adds `auto-decided: R3 Accept, R5 Mitigate now (rule: <agent> <impact>, concrete fix)` beside `auto-accepted` and `off-recommendation`. A guard that stops the run is `auto stopped: <reason>, <n> rows`. A continued gate keeps its existing line and adds `rule:`.
- **`## Status`** of `_tracking.md` gains one line: `**Autonomy:** balanced · attention C 9 (S0 6, +3), U 5, room 10 · drift green · auto-decided 4`. At `ask` it reads `**Autonomy:** ask`.
- **`## Auto-decisions`**, a derived section of `_tracking.md`: id, agent, the row in plain words, the option taken, the rule, state (`standing` or `reverted`). Rewritten from one read of `run.md`'s `auto_decided` and the ledger, like the other derived sections.
- **Digest.** The next gate that asks prints up to three lines of what was decided for the person since the last gate (`Decided for you: R3 Accept (low risk, concrete fix) ...`), and the closing summary lists all.
- **Revert.** Free text `revert R3` or `annulla R3` at any gate reopens that row at the current gate, while the phase that consumed it has not run: clear its Disposition cell, delete the ledger row the decision wrote, mark the `auto_decided` entry `reverted`, ask the row normally. After that phase has run it is logged as an `after run` line and the person uses Request changes at that phase's gate. A revert costs C +3 and makes the agent's rows ask for the rest of the run (log it).
- **Second surprise.** A second revert, off-recommendation answer or Request changes in the same run sets `autonomy: ask` for the rest of it; log `auto stopped: trust lost`.
- **Metrics**, read by a person from the logs: asked gates per run, guard stops per run, rework after a continued gate, `revert` count and `off-recommendation` per agent. A rule whose agent shows a late catch or a revert on more than one decision in ten should be cut.

## 8. Shadow

At every point where `balanced` would have decided a row or continued a gate, `shadow` asks as `ask` does and appends `shadow | would auto-decide R3 Accept, cost 2, room 14` (or `shadow | would continue <gate>, cost 3, room 9`) to the log, then, once the person answers, `shadow | person chose Mitigate now` when the answer differs. S0, C and U are computed and written as under `balanced`, so the lines carry the calibration data the figures above lack.
