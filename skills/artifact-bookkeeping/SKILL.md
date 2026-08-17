---
description: Deterministic bookkeeping rules for phase artifacts — tallying Risk/Issue/Finding tables by Impact, counting open Dispositions, and deriving each phase's pass/fail status from those counts. Shared reference for every agent that emits risk_counts/issues_summary/findings_summary and a status field.
---

# Artifact Bookkeeping

Shared reference for `pm-agent`, `architect-agent`, `impact-assessment-agent`, `implementer-tdd-agent`, `implementer-coder-agent` (Phase 0 plan), `code-reviewer-agent`, `security-reviewer-agent`, `test-verifier-agent`, `release-planner-agent`, and `documentation-agent`.

Every one of these agents ends its output with two things that are pure arithmetic over a table already in the same document, not judgment: a per-Impact tally, and a derived pass/fail status. Compute them exactly as below — don't eyeball a count from re-reading the table, and don't hand-increment a single field when the table changes.

## 1. Recount

Given the artifact's own Risks/Issues/Findings/Documentation-Gaps table (whichever this agent produces) and its `Impact` and `Disposition` columns:

- `byImpact.critical` / `high` / `medium` / `low` — count of rows whose `Impact` cell equals that value.
- `total` — total row count.
- `openDispositions` — count of rows whose `Disposition` cell is still empty (or the literal `*(filled by gate)*` placeholder).

Recompute this after every edit to the table — including a single row appended by the orchestrator's Constraint-Conflict Scan, and every row the Risk Disposition Loop fills in. Never hand-increment `total` / `open_dispositions` / a single Impact bucket in isolation; re-run the full recount instead, so a partial update can't drift from what the table actually contains.

## 2. Status derivation

Each phase's `status` (or equivalent verdict field) is a fixed threshold rule over the recount above, plus at most one phase-specific extra signal. Nothing here is a judgment call — given the counts and the extra signal, the value is determined:

| Phase | Rule |
|-------|------|
| `code-reviewer-agent` | `NEEDS_FIXES` iff `byImpact.critical + byImpact.high > 0`; else `READY` |
| `security-reviewer-agent` | `VULNERABILITIES_FOUND` iff `byImpact.critical + byImpact.high > 0` OR any Contract Enforcement gap; else `SECURE` |
| `test-verifier-agent` | `NEEDS_FIXES` iff `byImpact.critical + byImpact.high > 0` OR `coverage_summary.status != PASS`; else `READY` |
| `release-planner-agent` | `blocked` iff any `constraints.md` row still `🔴 open` at the final pass, OR `byImpact.critical > 0`, OR any unresolved `## Scope Gaps` row; else `ready` |
| `documentation-agent` | `needs_input` iff any Documentation Gap above `low` impact; else `ready` |
| `architect-agent` | `promptable` is `yes`/`no` per its own Promptable Signal rule (a judgment call, not a count) — `status` itself stays `ready` regardless |
| `pm-agent`, `impact-assessment-agent` | no pass/fail state — `status` (or equivalent) is always `ready`; only the recount tallies apply |
| `implementer-tdd-agent`, `implementer-coder-agent` (Phase 0 plan) | no status derivation here — the plan's `risk_counts` / `open_dispositions` still follow the recount above |

## 3. Acceptance-criteria coverage (test-verifier-agent only)

Given the numbered `AC-1, AC-2, ...` list from `01-requirements.md`'s Success Criteria and the Acceptance Criteria Mapping table's rows:

- `mapped` — count of AC numbers with at least one non-empty entry in the Tests column.
- `gapIds` — AC numbers with an empty Tests column (a `—` in the Gap column).

Same recount discipline as §1, applied to a different table.
