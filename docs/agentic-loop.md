# Agentic Loop

KAIROS v4.0.0 introduces optional intra-phase auto-retry loops that reduce the number of HITL confirmations needed for iterative fix cycles — without removing any phase gate.

## What It Is

The agentic loop is an **intra-phase retry mechanism**. When enabled, the orchestrator automatically re-invokes the implementer and the verifying agent (test-verifier or code-reviewer) after a `NEEDS_FIXES` result, without asking for human confirmation on each iteration.

Two independent loops are available:

| Loop | Agents | Trigger |
|---|---|---|
| **Phase 3** | Implementer ↔ Test Verifier | `status: NEEDS_FIXES` from test-verifier |
| **Phase 4** | Code Reviewer ↔ Implementer | `status: NEEDS_FIXES` with `critical` or `high` issues from code-reviewer |

The default for both is `manual` — identical to the v3.x behavior. Loops are opt-in per pipeline run.

## How to Enable

The orchestrator asks at agent selection time:

```
🔁 Loop Policy — optional, default: manual

   Phase 3: Implementer ↔ Test Verifier loop
     auto <N>   — auto-retry up to N times on NEEDS_FIXES
     manual     — HITL gate on every NEEDS_FIXES (default)

   Phase 4: Code Reviewer ↔ Implementer loop
     auto <N>   — auto-retry up to N times on critical/high issues only
     manual     — HITL gate on every NEEDS_FIXES (default)
```

Reply with values like `"phase3: auto 3 / phase4: manual"` or press Enter to keep both as `manual`.

## Termination Guarantees

Every loop has multiple independent exit conditions — infinite loops are impossible by design.

| Guard | Condition | Action |
|---|---|---|
| **Max retries** | `iteration >= max_retries` | Stop loop, escalate to HITL with count of remaining issues |
| **Monotonic progress** | `issues_critical_high` not decreasing | Stop loop immediately with thrash warning |
| **READY signal** | Agent returns `status: READY` | Exit loop (success) |

After any exit, the normal HITL gate for that phase runs unchanged.

## HITL Preservation

The loop operates **intra-phase**. Every existing phase gate is preserved:

- The consent gate (loop policy prompt) runs before any agent is called
- If the loop exits by max_retries or thrash, the HITL gate shows the remaining issues and waits for human input
- Phase-to-phase advancement always requires explicit human approval

The only reduction in friction is within a loop: iterations 2–N do not ask for approval. The boundaries (start of loop, end of loop, phase advancement) remain gated.

## State Store: The Ledger

Loop state is stored in `ledger/open-questions.md` under a `## Loop State` section, not in agent prompts. This means:

- The implementer detects Iteration Mode by reading the ledger (no extra prompt needed)
- The cumulative issue list grows across iterations — the implementer always sees every unfixed issue from all prior iterations
- Cleanup is mandatory: the orchestrator removes `## Loop State` from `open-questions.md` before advancing to the next phase, so downstream agents (security-reviewer, release-planner) never see stale loop data

## Guard 3: Post-Phase-4 Regression Check

If the Phase 4 loop (Code Reviewer ↔ Implementer) ran at least one iteration, the orchestrator invokes test-verifier as a single-pass check before presenting the Phase 4 HITL gate. This detects regressions introduced by code-review-driven fixes. If the test-verifier returns `NEEDS_FIXES`, an explicit warning is shown and the HITL gate blocks advancement.

## Cost Estimate

| Config | Extra invocations (worst case) |
|---|---|
| Phase 3: `auto 3` only | Up to 3 extra implementer + 3 test-verifier (sonnet) |
| Phase 4: `auto 3` only | Up to 3 extra code-reviewer + 3 implementer (sonnet) |
| Both `auto 3` | Up to 12 extra subagent invocations (all sonnet) |

Orchestrator remains active (opus) throughout.

## Backward Compatibility

If `loop_policy` is not configured, or both phases are set to `manual`, the pipeline is identical to v3.4.0. No agent behavior changes unless `## Loop State` is present in the ledger.
