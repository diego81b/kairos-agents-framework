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
| `implementer-tdd-agent`, `implementer-coder-agent`, `implementer-lead-agent` (Phase 3a plan) | no status derivation here — `status` is always `pending_approval` on a plan artifact, and only ever on a plan artifact. The plan's `risk_counts` / `open_dispositions` still follow the recount above |

## 3. Acceptance-criteria coverage (test-verifier-agent only)

Given the numbered `AC-1, AC-2, ...` list from `01-requirements.md`'s Success Criteria and the Acceptance Criteria Mapping table's rows:

- `mapped` — count of AC numbers with at least one non-empty entry in the Tests column.
- `gapIds` — AC numbers with an empty Tests column (a `—` in the Gap column).

Same recount discipline as §1, applied to a different table.

## 4. Required frontmatter fields per phase

The orchestrator's Artifact Contract Check (`orchestrator-agent.md` HITL step 0) validates more than the phase's verdict field — it also confirms every field below is present with a non-null value before treating the artifact as well-formed. A missing field is a malformed artifact, same as an unparseable verdict field: re-run the phase once with that specific error before falling back to `## Error Handling`'s retry-tracking. This is presence-only — confirming the field exists and holds a value from its documented shape — not a deep type/schema validator; each field's own agent file remains the source of truth for what a *valid* value looks like.

| Phase | Required fields (beyond `phase`) |
|-------|-----------------------------------|
| `pm-agent` | `status`, `risk_counts`, `open_dispositions`, `next_agent` |
| `architect-agent` | `status`, `promptable`, `risk_counts`, `open_dispositions`, `next_agent`, `database_changes_summary`, `error_codes_count`, `selected_option` |
| `impact-assessment-agent` | `risk_counts`, `open_dispositions`, `effort`, `recommended_agents` |
| `context-extractor-agent` | `status` |
| `implementer-plan` (Phase 3a — any implementer variant) | `status`, `risk_counts`, `open_dispositions`, `total_waves` |
| `implementer-tdd-agent` | `status`, `risk_counts`, `open_dispositions`, `iteration_mode`, `wave`, `total_waves`, `next_wave`, `tdd_verification`, `coverage_summary` |
| `implementer-coder-agent` | `status`, `risk_counts`, `open_dispositions`, `iteration_mode`, `wave`, `total_waves`, `next_wave` |
| `code-reviewer-agent` | `status`, `checks`, `issues_summary`, `open_dispositions`, `convergence_signal`, `next_agent` |
| `security-reviewer-agent` | `status`, `findings_summary`, `open_dispositions`, `contract_enforcement_summary`, `next_agent` |
| `test-verifier-agent` | `status`, `execution`, `coverage_summary`, `checks`, `issues_summary`, `open_dispositions`, `convergence_signal`, `next_agent` |
| `release-planner-agent` | `status`, `risk_counts`, `open_dispositions`, `monitoring_summary`, `rollback_summary` |
| `documentation-agent` | `status`, `findings_summary`, `open_dispositions`, `docs_touched` |

`risk_counts` / `issues_summary` / `findings_summary` are the by-Impact tally from §1 (`{ critical, high, medium, low, total }`) regardless of which name a given phase uses for it. This table is a presence checklist derived from each agent's own Output Format block — if an agent file's frontmatter template changes, update its row here in the same edit. Look the row up by the artifact's own `phase:` value, not by which agent produced it: one agent can emit two artifacts with different contracts. The Phase 3a plan (`phase: implementer-plan`) is the case that forces this — it comes from an implementer but carries none of that implementer's execution fields, so checking it against the implementer's row would fail every run on fields that cannot exist before any code is written.
