# Agentic Loop

Without the loop, every `NEEDS_FIXES` result stops the pipeline and asks you to approve the retry. The agentic loop lets KAIROS retry automatically a few times before bothering you — nothing else about the gates changes.

## The Problem It Solves

An implementer writes code, a verifying agent checks it, finds issues, sends it back. Normally you'd approve that retry by hand every time — for small issues, that's a lot of clicking for no real decision. The loop automates just that retry step, within limits you set.

## Two Independent Loops

| Loop | Who talks to whom | Fires on |
|---|---|---|
| **Phase 3** | Implementer ↔ Test Verifier | Test Verifier returns `NEEDS_FIXES` |
| **Phase 4** | Code Reviewer ↔ Implementer | Code Reviewer returns `NEEDS_FIXES` with a `critical` or `high` issue |

The default depends on the effort you picked at the Effort Check. `simple_fix` and `medium` both preset `phase4: auto 1` (one silent retry on a review finding) and `phase3: manual`, announced at Step 0f where you can still change them — the orchestrator does not ask. Only `significant_rework` gets the full loop-policy prompt at agent selection time, because that is the one size where the retry budget is worth deciding before anyone has seen a finding.

## Worked Example

Feature: *"Add rate limiting to the `/login` endpoint."* You set `phase3: auto 2` and leave `phase4: manual`.

1. **implementer-tdd-agent** writes the rate-limit middleware and its tests.
2. **test-verifier-agent** runs the suite: the concurrent-request edge case isn't covered → `NEEDS_FIXES`.
3. Because Phase 3 is `auto 2`, KAIROS skips asking you and re-invokes the implementer directly with that finding.
4. **implementer-tdd-agent** adds the missing test case.
5. **test-verifier-agent** re-checks: coverage is now adequate → `READY`. Loop exits, no human involved in steps 2–5.
6. Pipeline reaches the normal Phase 3 HITL gate — you review the final result once, not twice.
7. Later, **code-reviewer-agent** flags a `high`-severity issue (missing input sanitization). Since Phase 4 is `manual`, this stops and asks you before the implementer touches anything.

That's the whole mechanism: loops only skip the *retry-approval* step, never the phase-boundary gate.

## How to Enable

For `significant_rework`, the orchestrator asks at agent selection time, right after you pick the agents. It prints the cost estimate, then asks one question per loop with four fixed choices:

| Question | Choices |
|---|---|
| **Phase 3 loop** — Implementer ↔ Test Verifier, auto-retry on `NEEDS_FIXES` | `Manual` *(recommended)* · `Auto — 1 retry` · `Auto — 2 retries` · `Auto — 3 retries` |
| **Phase 4 loop** — Code Reviewer ↔ Implementer, auto-retry on critical/high issues | same four |

No number to type: pick a button per loop. In IDEs without the checkbox prompt the orchestrator prints the same options as a typed menu and you reply `"phase3: auto 3 / phase4: manual"` (empty reply keeps both `manual`).

For `simple_fix` and `medium` this prompt is skipped entirely. The preset (`phase3: manual`, `phase4: auto 1`) appears on the Step 0f pipeline announcement marked `(preset — reply to change)`; replying there with a different policy applies it before Phase 1.

Works with any Phase-3 implementer — TDD, code-only, or Team Mode's lead agent. Under Team Mode the `Auto — 3 retries` option disappears: each retry there spawns a full team, so the ceiling is 2.

## Why It Can't Loop Forever

Three independent exits, checked every iteration:

| Guard | Condition | What happens |
|---|---|---|
| **Max retries** | Hit the `N` you set | Stop, show remaining issues at the normal HITL gate |
| **No progress** | Issue count isn't decreasing | Stop immediately with a thrash warning — retrying isn't helping |
| **Clean pass** | Agent returns `READY` | Loop exits successfully |

Whichever way it exits, the normal phase gate still runs — the loop never replaces it, only what happens *before* you see it.

## Where the State Lives

Loop progress (iteration count, cumulative issue list) is written to `ledger/open-questions.md` under `## Loop State` — not passed around in prompts. The orchestrator deletes that section before moving to the next phase, so later agents (security-reviewer, release-planner) never see stale retry data.

## One Extra Safety Check

If the Phase 4 loop ran at all, the orchestrator runs test-verifier once more before showing the Phase 4 gate — catching any regression the code-review fixes introduced. A `NEEDS_FIXES` here blocks the gate with an explicit warning.

`qa-plan-agent` (Phase 5b) sits deliberately **outside** both loops: it runs only once the Phase 3 loop has exited and its Guard has resolved. Its own `NEEDS_ATTENTION` never re-invokes an implementer — by that point the code is settled, and the status means a human has a regression risk or an unverifiable acceptance criterion to decide on.

## If You Never Touch This

Leave both loops on `manual` (the default) and nothing changes from earlier KAIROS versions — every `NEEDS_FIXES` still stops and asks you, one retry at a time.
