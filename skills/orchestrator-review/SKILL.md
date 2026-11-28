---
name: orchestrator-review
description: "Review calibration for orchestrator-agent's review gate (4.4) and recheck gates: reading the cause and anchor of each reviewer row, the recommended disposition by cause, the contract digest, Finish now, the uncertainty question, the settled set and the recompute of a stale reviewer status. Read when a review wave or recheck has returned and its rows are about to be walked."
---

# Orchestrator: review calibration

Text moved out of `orchestrator-agent`, which names the point where it applies. Terms such as `Disposition`, `Mitigate now`, `Escalate`, `run.md` and `Scope:` keep the meaning they have there. The reviewers write a cause and an anchor on every row ([`artifact-template`](../artifact-template/SKILL.md) §7); this skill is what the orchestrator does with them. The point: a review that defends the work done against what was agreed, so the loop stops polishing and a person is asked only what is theirs to decide.

A row with no cause prefix (an artifact from an older run, or an agent that missed it) behaves as it did before: nothing below applies to it.

## 1. Reading a row

The cause is the first word of the Description: `Work:`, `Extra:`, `Issue:`, `Design:`, `Pre-existing:`, `Taste:`, `Unsure:`. Before the prompt loop, check each row's claim with no model:

- the cited `AC-n`, `Cn`, `Dn` or plan row exists in `01-requirements.md`, the ledger or the plan;
- the cited `file:line` exists;
- a `Pre-existing:` line lies outside every hunk of `git diff -U0` for the change under review;
- a `Work:` row cites an anchor or a failing path.

A row that fails is read as `Unsure:`: rewrite its prefix in the artifact, log `review | R3 Work to Unsure | AC-9 not in 01-requirements`, and carry on. An `Unsure:` row names the datum it lacks; when you can fetch it (run the command, open the file) do that before you ask, and re-read the row. Never judge a cause by re-reviewing the code: the reviewer decided it, and you check only what a lookup can prove.

## 2. Recommended option by cause

HITL step 2 marks one option `(Recommended)` from the row's impact. For a row with a cause, this table marks it instead, with the reason in one clause. It changes the label and nothing else: every option stays available, and a person who picks another is never overruled.

| Cause | Recommended | Why |
|---|---|---|
| `Work:` | **Mitigate now** when the Fix is one concrete action (a `file:line`, at most three files, inside the diff), else **Escalate** | the agreement exists and the work does not meet it |
| `Extra:`, `Issue:`, `Design:` | **Escalate** | fixing it is a scope change; the alternatives come from the row's Fix and go through the Escalate follow-up |
| `Pre-existing:` | **Defer**, and the Mitigate now description says `file already in the diff: yes\|no` | the diff did not cause it |
| `Taste:` | **Accept** | no agreed anchor and no defect; never Mitigate now |
| `Unsure:` | **Escalate** | names who can answer |

A `low` row keeps the automatic Accept of step 2, except a row of `Extra:`, `Issue:`, `Design:` or `Unsure:`, which skips both automatic Accepts and the auto-decision at every dial value, the way floor item 11 does. Rows of these four are asked, never decided for the person.

**What an Escalate answer writes**, besides the usual Escalate writes:

| Row | Answer | Writes |
|---|---|---|
| `Extra:` | Keep it | `decisions.md` `Scope: keep - <behaviour>` |
| `Extra:` | Take it out of the diff | Mitigate now (a `MUST` row) and `Scope: out - <behaviour>` |
| `Issue:` | Add the criterion and fix it | `Scope: add - <behaviour>` and Mitigate now |
| `Issue:` | Accept as it is | `Scope: as written - <behaviour>` |
| `Issue:` or `Design:` | Later slice | Defer with a `_findings.md` entry, and `Scope: later - <behaviour>` |
| `Design:` | Change the design | `Scope: design change - <what>` naming the decision `Dn`, then stop as **Stop here** does (`gate_pending`, `run_status: stopped`); the line says which phase to start again from (`architect-agent`), which **Start a new run** re-derives |
| `Design:` | Accept | no write |

A `Scope:` row is a decision the person just made, so C does not grow for the row itself; a `Decide:`-class row (`Issue:`, `Design:`) adds 2 to C when it is raised, as a scope event does.

## 3. Protect the work done

- A **settled file** is one whose every mapped `AC-n` is `covered` by a passing test at the last review (`05-test-verification.md`'s mapping and `03-implementation.md`'s `## Files Written`). When a row that is not `Work:` and not a security row would be fixed in a settled file, say so in the Mitigate now description (`touches a settled file: Defer recommended`) and recommend **Defer**.
- A fix pass touches only the files of the rows chosen and their tests. Any other file is the existing "file outside the plan" signal. A fix pass over 30 percent of the diff under review (`git diff --stat` changed lines) adds 2 to C (the meter's rule). The 30 is a first cut.
- On a recheck or a `final_pass: true` run, a reviewer reports only rows about the fix itself. Count each `Held back: N` clause of their Summaries into one line of the gate digest. A `Taste:` row that still arrives in the table is treated as a normal `Taste:` row.
- Security is never narrowed here: a `high` security row is asked, and **Finish now** never overrides it.

## 4. The digest

At the review gate, after step 3 prints the summaries, print two lines, computed from the artifacts on disk and not from a model's recollection:

```
Review found: 6 work, 1 design (draft lost on lock), 1 pre-existing, 0 issue, 0 extra, 0 taste
Contract: 5 of 6 AC covered, 1 manual (QA), 0 gap | scope rows 1 | unsure 2 | polish held back 7 | fix passes 1 of 2 | drift green
```

`Review found:` counts the rows of all three artifacts by cause, with the title of each `Design:` and `Issue:` row in parentheses. `Contract:` takes the `AC-n` states from `05-test-verification.md`'s mapping (else `_tracking.md`'s `## Issue Alignment`), the `Scope:` rows of `decisions.md` added in this run, `Unsure:` rows plus the `Could not verify:` counts, the `Held back:` total plus `Taste:` rows, the fix passes against the auto-fix budget, and `run.md`'s `drift`. Both lines go into `_tracking.md`'s `## Status` after each review pass. Read over several runs, the split is the calibration: many `Issue:` and `Design:` rows on runs whose issue passed the readiness check mean the thresholds of [`orchestrator-readiness`](../orchestrator-readiness/SKILL.md) are too loose; many `Work:` rows on one implementer path mean its plan, tests or review input need work.

## 5. The uncertainty question

After the Risk Disposition Loop, when an `Unsure:` row was kept open or an `AC-n` is still `gap`, ask once before the gate shows its options, with `AskUserQuestion` (header `Unsure`; a typed menu otherwise): **Finish it now** (the row, or the criterion's missing test, goes to the fix pass as Mitigate now), **Move it to a later slice** (an entry in `_findings.md` and `Scope: later - <item>`), **Cut the criterion** (`Scope: cut - <AC-n>`; the criterion is `dropped`), **Stop** (as **Stop here**). It is on the floor of [`orchestrator-autonomy`](../orchestrator-autonomy/SKILL.md) (item 8): no dial value and no guard skips it, and a gate that continues by section 6 of that skill never has a standing row or gap.

## 6. Finish now

When no `Work:` row stands open (undispositioned or Mitigate now), no `AC-n` is `gap`, no `Extra:`, `Issue:`, `Design:` or `Unsure:` row stands, and drift is not red, label the gate's **Approve** option `Approve and finish now` and mark it `(Recommended)`. It is Approve: nothing else changes, and the review ends without another loop pass. Its extra effect is the summary line: the closing summary names `Held back: N` and the `Taste:` rows left, so nothing found is lost silently (a `Taste:` row the person Deferred already has its `_findings.md` entry). The loop is not exhausted in the failure sense when only `medium`, `Taste:` or `Pre-existing:` rows are left: `blocking` counts `Work:` and unprefixed rows of `critical` or `high` impact and `AC-n` gaps only, so the exhausted exit of 4.3 means one of those still stands, and only then is the exhausted question asked (floor item 8).

## 7. A stale reviewer status

A reviewer derives `status` once, when it writes ([`artifact-bookkeeping`](../artifact-bookkeeping/SKILL.md) §2), so a row the person dispositioned **Accept** (a `VERIFICATION` constraint, a criterion routed to manual QA) still leaves `NEEDS_FIXES`, and no fix pass follows to rewrite it. After step 2 of the review gate and of every recheck gate, recompute each wave artifact's `status` with the §2 formula over the rows that stay open (Disposition empty or **Mitigate now**; not Accept, not Defer) and over the `AC-n` with neither a covering test nor a `VERIFICATION` row. Write the frontmatter `status` back in the same edit as the dispositions and log `status recomputed: 05 NEEDS_FIXES to READY`. Reviewers are not re-run for it, and the `## Summary`'s `Decision:` line stays as the reviewer wrote it: the frontmatter is the live value, and the section 6 continuation of the autonomy skill reads it.
