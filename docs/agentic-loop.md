# Agentic Loop

Without the loop, every blocking review result stops the pipeline and asks you to approve the retry. The agentic loop lets KAIROS retry automatically a few times before bothering you. Nothing else about the gates changes.

## The Problem It Solves

An implementer writes code, the reviewers check it, find issues, send it back. Normally you'd approve that retry by hand every time, and for small issues that's a lot of clicking for no real decision. The loop automates just that retry step, within a limit you set.

## One Review Loop

Since v8.5.0 code review, security review and test verification run together as one **review wave**: the orchestrator starts the active reviewers on the same code, in parallel where the host allows it, and shows you one combined gate. There is one loop around that wave, not one per reviewer.

| Who feeds the loop | Counts toward it |
|---|---|
| **code-reviewer-agent** | every `critical` or `high` issue, except rows marked `Pre-existing:` |
| **test-verifier-agent** | every `critical` or `high` issue, plus every acceptance-criteria gap |
| **security-reviewer-agent** | nothing: its findings always wait for you at the gate |

The loop fires when that count is above zero and you gave it a budget. `simple_fix` and `medium` both preset one automatic retry, announced at Step 0f where you can still change it; the orchestrator does not ask. Only `significant_rework` gets the loop-policy question at agent selection time, because that is the one size where the retry budget is worth deciding before anyone has seen a finding.

Coverage below target is not in the count either. Before v8.5.0 any `NEEDS_FIXES` from test verification restarted the implementer, including a coverage figure that could not be measured, which the implementer cannot fix and which only ends in a thrash. It still reaches you at the gate as a finding.

A `Pre-existing:` row is a defect the change did not introduce. It still reaches you at the gate, where you can fix it now or defer it, but it never makes the implementer loop: fixing old code was never what the retry budget was for.

## Worked Example

Feature: *"Add rate limiting to the `/login` endpoint."* Budget: 2 automatic retries.

1. **implementer-tdd-agent** writes the rate-limit middleware and its tests.
2. The review wave starts: **code-reviewer-agent**, **security-reviewer-agent** and **test-verifier-agent** read the same code at the same time.
3. Test verification finds the concurrent-request edge case uncovered (one `high`); code review finds nothing blocking; security review flags a `medium` on the error message.
4. The count is 1, the budget is 2: KAIROS re-invokes the implementer with that finding, without asking you.
5. **implementer-tdd-agent** adds the missing test case. The reviewers whose findings drove the retry check again: the count is 0.
6. Because a retry ran, all three reviewers take one final pass on the code as it now stands. That pass replaces the separate regression checks older versions ran.
7. You see one gate with three summaries. The security `medium` is still there, waiting for your decision. If you choose **Mitigate now**, it goes to the implementer in the same single fix pass as anything else you pick.

That's the whole mechanism: the loop only skips the *retry-approval* step, never the gate.

## How to Enable

For `significant_rework`, the orchestrator asks at agent selection time, right after you pick the agents. It prints the cost estimate, then asks one question with four fixed choices: `Manual` *(recommended)* · `Auto — 1 retry` · `Auto — 2 retries` · `Auto — 3 retries`.

No number to type. In IDEs without the checkbox prompt the orchestrator prints the same options as a typed menu and you reply `auto 2` (an empty reply keeps `manual`).

For `simple_fix` and `medium` the question is skipped. The preset appears on the Step 0f pipeline announcement marked `(preset — reply to change)`; replying there with a different budget applies it before Phase 1. An issue can set it too, with an `Auto-fix: N` line in its `## KAIROS Pipeline` section.

Works with any Phase-3 implementer: TDD, code-only, or Team Mode's lead agent. Under Team Mode the `Auto — 3 retries` option disappears: each retry there spawns a full team, so the ceiling is 2.

Settings written before v8.5.0 had two budgets, one after review and one after tests (`phase4`/`phase3` in `ledger/run.md`, `Auto-fix after review`/`Auto-fix after tests` in an issue). They still work: the single loop takes the larger of the two.

## Why It Can't Loop Forever

Three independent exits, checked every iteration:

| Guard | Condition | What happens |
|---|---|---|
| **Max retries** | Hit the `N` you set | Stop, show remaining issues at the review gate |
| **No progress** | Issue count isn't decreasing | Stop immediately with a thrash warning: retrying isn't helping |
| **Clean pass** | Count reaches zero | Loop exits successfully |

Whichever way it exits, the review gate still runs. The loop never replaces it, only what happens *before* you see it.

## Where the State Lives

Loop progress (iteration count, current issue list) is written to `ledger/loops.md` under `## Loop State`, not passed around in prompts. The orchestrator deletes that section once the loop exits, so later agents never see stale retry data. A loop that did not converge leaves a `## Loop History` entry in the same file, which the retrospective reads as a friction signal, and a line in `_tracking.md`'s log. Runs started before v8.4.0 kept both sections in `ledger/open-questions.md`; the orchestrator moves them into `loops.md` when it resumes such a run, and records a loop that was interrupted mid-run as `interrupted` instead of resuming it. A run started before v8.5.0 and resumed mid-review with two loop sections finishes with the single loop.

## After the Gate: One Fix Pass

What you choose at the review gate also goes out as a unit. Every row you mark **Mitigate now**, across all three reports, plus any change you ask for, reaches the implementer as one fix pass, followed by one recheck of the reviewers scoped to that fix. Older versions ran a separate fix pass and recheck after each review phase.

`qa-plan-agent` (Phase 5b) sits deliberately **outside** the loop: it runs only once the loop has exited and the review gate has resolved. Its own `NEEDS_ATTENTION` never re-invokes an implementer by itself. By that point the code is settled, and the status means you have a regression risk or an unverifiable acceptance criterion to decide on.

## If You Never Touch This

Leave the budget on `manual` and every blocking finding stops and asks you, one retry at a time. The review wave and the combined gate apply either way.
