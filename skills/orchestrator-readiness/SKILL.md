---
name: orchestrator-readiness
description: "Readiness check and interview for orchestrator-agent Step 0e: decides whether the issue says enough to build from, runs the pm-agent interview when it does not, and keeps the Scope Contract that later drift is measured against. Read when the impact assessment has returned and analysis or development is in areas."
---

# Orchestrator: readiness and interview

Text moved out of `orchestrator-agent`, which names the point where it applies. Terms such as `areas`, `derivation`, `run.md` and `Scope:` keep the meaning they have there. The drift alarm measures against the issue, and a thin issue gives a baseline that means little: the cost shows up later as a wrong size, an `AC-n` found at review or a second run. The cheapest place to fix it is once, before the pipeline starts.

## 1. When it runs

At Step 0e, after Impact Grounding and its HITL steps 0 to 2 return, before the Start Gate. Only when `derivation = on` and `analysis` or `development` is in `areas` (a run that reviews or delivers has code, not an intent to clarify).

It does not run, and `readiness` is `ready`, when the issue is **ready by construction**: an `Analysis: <folder>` pointer, an existing `01-requirements.md` or `00d-interview.md` in the folder, or an issue in the `_issues.md` layout KAIROS writes. It never runs on a resumed run (`ledger/run.md` read back in Step 0b), and `run.md`'s `readiness` is read back as it stands; a missing value reads as `ready`.

## 2. The three signals

| Signal | Reads |
|---|---|
| S1 No outcome | The issue states no observable result: no expected behaviour, no `AC-n` or acceptance list, no before and after. |
| S2 No surface | The issue names no screen, endpoint, entity, role, file or job. |
| S3 Unknown | `00b-impact.md` reports two or more unknown facts or two or more `Open` rows. |

**Thin** means two or more of the three. S1 and S2 are read from prose, so the verdict is never silent: print the line `Issue: thin (S1, S3): <one clause each>` and ask.

**A bug report** (Bug-Input Check) keeps its triage offer and gets no second question here. S1 is the missing expected behaviour, S2 the missing reproduction, S3 an unknown cause with open rows. When triage ran, the report is ready by construction. When the person chose **Continue without it** and the signals read thin, set `readiness: waived`, log `readiness | waived | bug report continued without triage (S1, S2)` and go on.

## 3. The question

Header `Issue`, asked with `AskUserQuestion` (a typed menu with the same options when it is not available). The question is on the floor of the autonomy skill (item 12): no dial value answers it.

- **Interview first** (Recommended): runs section 4 before anything else.
- **Proceed as written**: the person owns the gaps. Set `readiness: waived`, add a `decisions.md` row whose Decision is `Scope: as written, readiness waived`, log `readiness | waived by you`. The baseline is the issue as it stands, and the Start Gate shows `issue: thin, waived by you`. A waiver adds 3 to S0 (autonomy skill, section 3).
- **Stop here**: the person improves the issue and starts again. End the run as the Start Gate's **Stop** does.

## 4. The interview

A subagent cannot ask the person, so `pm-agent` writes the questions to a file and you ask them. It is plain `pm-agent`, called with `mode: orchestrated` and `step: interview` each on its own line, plus `feature_folder`, `effort` and `round`, recorded in `in_flight` (applying **Model override** first). It reads the issue, `00b-impact.md`, the triage if any, the ledger and the code, and writes `.kairos/$feature_folder/00d-interview.md` itself; it asks nothing and runs no gate of its own.

**Round 1** (`round: 1`): the file holds up to 3 questions in its `## Questions` table (`Id`, `Question`, `Fact`, `Readings`, `Consequence`, `Answer`; `Answer` empty), `status: questions`. A question that the code already answers is not a question: the agent derives it and records it as derived. If nothing is left to ask, it writes the contract at once with `status: contract`; skip to the end of this section.

**Ask them**, one `AskUserQuestion` each, in the table's order. The question text is its `Question` cell, which names the concrete file or screen and says what is undecided in product or code words. The options are its `Readings` (the recommended one first, marked `(Recommended)`) and `I don't know`; the free field is the person's own reading. Write each answer into the `Answer` cell as the person gave it (`I don't know` verbatim), in one edit, and log one line `interview | Q1 answered: <reading>`. An answer that is not the recommended reading counts as one for the autonomy meter.

**Then call again** with `round: close`. `pm-agent` reads the answers and writes `## Scope Contract` into the same file, `status: contract`. Only when an answer opened a new concrete fact in the code may it write a second round of at most 3 questions instead (`round: 2`, `status: questions`): ask them as above, then call `round: close` again. There is no third question round, so the interview cannot become the session. A question still unanswered at close is recorded by the agent as an assumption plus a `🔴 open` row in `open-questions.md` (`Raised by: pm-agent`), and the Start Gate lists it.

**Scope Contract** (the block, in this order): `Goal` (one sentence); `In scope` (the `AC-n` list, each a trigger and an observable outcome); `Out of scope` (each item on its own line, `- <item>`); `Slices` (only when the work does not ship as one piece: slice 1 runs, the others are written as issue text in `_issues.md`; `N/A: one run` otherwise); `Done means` (one line). A slice ships alone: one outcome, its tests, no `AC-n` that needs a later slice.

When the close call returns: write each `Out of scope` line as a `decisions.md` row, Decision `Scope: out - <item>` (so the Conflict Scan of HITL step 1b guards it), set `readiness: interviewed`, and log `readiness | interviewed | <n> AC, <n> out of scope, slice <i> of <n>`. If the call returns an `🚨 AGENT ERROR` or no file, relay it and offer **Proceed as written** and **Stop here** only.

The impact assessment re-runs only when an answer adds or removes a file, flow or criterion (the existing rule of the Start Gate).

## 5. How the contract is used

- **Every later subagent prompt** carries the path of `00d-interview.md` and the sentence `The Scope Contract in it is binding: anything under Out of scope is not built.`, like a triage. When `pm-agent` runs its phase it copies the block to the top of `01-requirements.md` and does not redraft it.
- **The Start Gate** prints one line under `Effort:`: `Contract: goal, 4 AC, 3 out of scope, slice 1 of 2`, or `Issue: thin, waived by you`.
- **Drift** (autonomy skill, section 5): the contract is part of the baseline. Touching an out-of-scope item is a binary fact: red, not yellow.
- **On request** it is offered as a paste-ready block or tracker comment through the existing write-back. That offer stays a question (floor item 6).
- **Accept and re-measure** (autonomy skill, section 5) runs `step: interview` again on the delta only (`round: 1`, at most 3 questions, the earlier file as `previous:`), because a new baseline nobody described is how the next drift starts.
- **Start a new run** keeps `00d-interview.md` like `00c-bug-triage.md`. The closing summary lists the `Scope: out` rows.

## 6. Logs and status

One `_tracking.md` `## Log` line for the verdict (`readiness | thin (S1, S2) | interview`), one per answered question, one for the contract (`readiness | interviewed | ...`) and one for a waiver. `## Status` carries `readiness: ready | interviewed | waived`. `## Issue Alignment` compares each `AC-n` with the contract's `In scope` list.
