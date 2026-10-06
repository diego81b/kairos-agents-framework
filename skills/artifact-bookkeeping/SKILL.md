---
description: Deterministic bookkeeping rules for phase artifacts — tallying Risk/Issue/Finding tables by Impact and deriving each phase's pass/fail status from those counts. Shared reference for every agent that emits risk_counts/issues_summary/findings_summary and a status field.
---

# Artifact Bookkeeping

Shared reference for `pm-agent`, `architect-agent`, `impact-assessment-agent`, `bug-triage-agent`, `implementer-tdd-agent`, `implementer-coder-agent` (Phase 0 plan), `code-reviewer-agent`, `security-reviewer-agent`, `test-verifier-agent`, `release-planner-agent`, `documentation-agent`, and `dependency-audit-agent`.

Every one of these agents ends its output with two things that are pure arithmetic over a table already in the same document, not judgment: a per-Impact tally, and a derived pass/fail status. Compute them exactly as below — don't eyeball a count from re-reading the table, and don't hand-increment a single field when the table changes.

## 1. Recount

Given the artifact's own Risks/Issues/Findings/Documentation-Gaps table (whichever this agent produces) and its `Impact` and `Disposition` columns:

- `byImpact.critical` / `high` / `medium` / `low` — count of rows whose `Impact` cell equals that value.
- `total` — total row count.

Recompute this after every edit to the table — including a single row appended by the orchestrator's Constraint-Conflict Scan. Never hand-increment `total` or a single Impact bucket in isolation; re-run the full recount instead, so a partial update can't drift from what the table actually contains.

There is no count of unresolved dispositions. Every `Disposition` cell is empty when you write the artifact ([`artifact-template`](../artifact-template/SKILL.md) §2), so such a count would always equal `total`, and the orchestrator's Risk Disposition Loop reads the cells themselves, not a tally of them.

## 2. Status derivation

Each phase's `status` (or equivalent verdict field) is a fixed threshold rule over the recount above, plus at most one phase-specific extra signal. Nothing here is a judgment call — given the counts and the extra signal, the value is determined:

| Phase | Rule |
|-------|------|
| `code-reviewer-agent` | `NEEDS_FIXES` iff `byImpact.critical + byImpact.high > 0`; else `READY` |
| `security-reviewer-agent` | `VULNERABILITIES_FOUND` iff `byImpact.critical + byImpact.high > 0` OR any Contract Enforcement gap; else `SECURE` |
| `test-verifier-agent` | `NEEDS_FIXES` iff `byImpact.critical + byImpact.high > 0` OR `coverage_summary.status != PASS` OR `gapIds` (§3) non-empty; else `READY`. The `gapIds` term only applies when the Success Criteria list was available (see the agent's own Input Validation) — otherwise it's vacuously empty, same as today |
| `qa-plan-agent` | `NEEDS_ATTENTION` iff `byImpact.critical + byImpact.high > 0`; else `READY`. An acceptance criterion marked **not verifiable as written** is written as a `high` row in the same `## Risks` table, so this one count covers it rather than a separate term. The status never triggers a loop — no implementer re-runs from Phase 5b |
| `release-planner-agent` | `blocked` iff any `constraints.md` row still `🔴 open` at the final pass, OR `byImpact.critical > 0`, OR any unresolved `## Scope Gaps` row; else `ready` |
| `documentation-agent` | `needs_input` iff any Documentation Gap above `low` impact; else `ready` |
| `architect-agent` | `promptable` is `yes`/`no` per its own Promptable Signal rule (a judgment call, not a count) — `status` itself stays `ready` regardless |
| `pm-agent`, `impact-assessment-agent` | no pass/fail state — `status` (or equivalent) is always `ready`; only the recount tallies apply |
| `bug-triage-agent` | no pass/fail state — `status` is always `ready`. `reproduced`, `root_cause_found`, and `severity` are observations, not a verdict on the artifact; `root_cause_found` is never `yes` when `reproduced` is not `yes`. No Disposition tables, so no recount applies |
| `dependency-audit-agent` | no pass/fail state — `status` is always `ready`. `vulnerabilities` is a by-severity tally of Vulnerabilities rows following §1; `backlog_count` is the row count of the Backlog table. No Disposition column anywhere in this artifact, so the Risk Disposition Loop never runs against it |
| `implementer-tdd-agent`, `implementer-coder-agent`, `implementer-lead-agent` (Phase 3a plan) | no status derivation here — `status` is always `pending_approval` on a plan artifact, and only ever on a plan artifact. The plan's `risk_counts` still follows the recount above |

## 3. Acceptance-criteria coverage (test-verifier-agent only)

Given the numbered `AC-1, AC-2, ...` list from `01-requirements.md`'s Success Criteria and the Acceptance Criteria Mapping table's rows:

- `mapped` — count of AC numbers with at least one non-empty entry in the Tests column.
- `gapIds` — AC numbers with an empty Tests column (a `—` in the Tests column, with the gap explained in the Gap column instead). A Tests cell reading `manual — <Cn> → 5b` is **not** empty: that criterion is routed to manual verification by a declared `VERIFICATION` constraint row and is not a gap. It counts as `mapped` for this purpose and never reaches `convergence_signal.ac_gaps`, because a loop cannot close it — see `test-verifier-agent`'s three-state rule.

Same recount discipline as §1, applied to a different table. `gapIds` feeds directly into §2's `test-verifier-agent` status rule above — a non-empty `gapIds` blocks `READY` the same way a critical/high issue does.

## 4. Required frontmatter fields per phase

The orchestrator's Artifact Contract Check (`orchestrator-agent.md` HITL step 0) validates more than the phase's verdict field — it also confirms every field below is present with a non-null value before treating the artifact as well-formed. A missing field is a malformed artifact, same as an unparseable verdict field: re-run the phase once with that specific error before falling back to `## Error Handling`'s retry-tracking. This is presence-only — confirming the field exists and holds a value from its documented shape — not a deep type/schema validator; each field's own agent file remains the source of truth for what a *valid* value looks like.

| Phase | Required fields (beyond `phase`) |
|-------|-----------------------------------|
| `pm-agent` | `status`, `risk_counts` |
| `architect-agent` | `status`, `promptable`, `risk_counts`, `domains`, `test_first`, `contract_change`, `behaviour_delta`, `threat_rows` |
| `impact-assessment-agent` | `risk_counts`, `size`, `effort`, `domains`, `test_suite`, `contract_change`, `change_kind` |
| `context-extractor-agent` | `status` |
| `bug-triage-agent` | `status`, `reproduced`, `severity`, `root_cause_found`, `recommended_entry` |
| `dependency-audit-agent` | `status`, `audited_on`, `vulnerabilities`, `backlog_count` |
| `implementer-plan` (Phase 3a — any implementer variant) | `status`, `risk_counts`, `total_waves` |
| `implementer-tdd-agent` | `status`, `iteration_mode`, `wave`, `total_waves`, `next_wave`, `tdd_verification`, `coverage_summary` |
| `implementer-coder-agent` | `status`, `iteration_mode`, `wave`, `total_waves`, `next_wave`, `tests_written` |
| `code-reviewer-agent` | `status`, `issues_summary`, `convergence_signal` |
| `security-reviewer-agent` | `status`, `findings_summary` |
| `test-verifier-agent` | `status`, `execution`, `coverage_summary`, `issues_summary`, `convergence_signal` |
| `qa-plan-agent` | `status`, `delivery`, `risk_counts` |
| `release-planner-agent` | `status`, `risk_counts` |
| `documentation-agent` | `status`, `findings_summary` |

`risk_counts` / `issues_summary` / `findings_summary` are the by-Impact tally from §1 (`{ critical, high, medium, low }`, with `total` as an optional fifth key: only `qa-plan-agent`'s template writes it, and the presence check never requires it) regardless of which name a given phase uses for it. This table is a presence checklist derived from each agent's own Output Format block — if an agent file's frontmatter template changes, update its row here in the same edit. Look the row up by the artifact's own `phase:` value, not by which agent produced it: one agent can emit two artifacts with different contracts. The Phase 3a plan (`phase: implementer-plan`) is the case that forces this — it comes from an implementer but carries none of that implementer's execution fields, so checking it against the implementer's row would fail every run on fields that cannot exist before any code is written.

The fact fields added in v9.0.0 (`domains`, `test_first`, `contract_change`, `behaviour_delta`, `threat_rows` on the architecture; `domains`, `test_suite`, `contract_change`, `change_kind` on the impact assessment; `tests_written` on the coder's implementation; `size` on the impact assessment and `delivery` on the QA plan, added after v9.0.0's first cut) are required only on artifacts written from then on. A resumed folder's older artifact that lacks them is not malformed and is never re-run for it: the orchestrator reads each missing fact as unknown, which its Selection Rules resolve toward running the agent that fact gates. An older impact assessment's `recommended_agents` is ignored. The one exception is a fact that exists only because an agent ran: `threat_rows` and `behaviour_delta` are absent by design, not unknown, when `architect-agent` did not run (see the orchestrator's Step 0e).

### Verdict values per phase

This is documentation, not enforcement: it lists the values each agent writes, exactly as written, so a reader matches the one its row shows. Case is not normalized (`READY` and `ready` are different values, and the phases below mix them). Normalizing would touch sixteen agents and their mirrors and break every `.kairos/` folder written before it, for a reader that is another agent or a person; do it only in a release that migrates older folders on first touch, as v8.4.0 did.

| `phase:` | `status:` | Other verdict fields |
|----------|-----------|----------------------|
| `context-extractor`, `dependency-audit`, `retrospective`, `pm-agent` | `ready` | none |
| `improvement-advisory` | `ready`, `insufficient_data` | none |
| `impact-assessment` | none written | `effort`, `size`, `open_dispositions` |
| `bug-triage` | `ready` | `reproduced`: `yes`, `no`, `cannot-reproduce-here`; `root_cause_found`: `yes`, `no`; `recommended_entry`: `quick-fix`, `full-pipeline`, `not-a-defect` |
| `architect` | `ready` | `promptable`: `yes`, `no` |
| `implementer-plan` | `pending_approval` | none |
| `implementer` | `complete`, `partial`, `too_big`, `blocked` | none |
| `code-review`, `test-verify` | `READY`, `NEEDS_FIXES` | `convergence_signal` |
| `security-review` | `SECURE`, `VULNERABILITIES_FOUND` | none |
| `qa-plan` | `READY`, `NEEDS_ATTENTION` | `delivery`: `comment`, `file` |
| `release-plan` | `ready`, `blocked` | none |
| `documentation` | `ready`, `needs_input` | none |

Two things in the table above are not what §1 and the rows of §4 would suggest. `impact-assessment-agent` alone writes `open_dispositions`, the count of Risks and Open Questions rows whose Disposition cell is still empty. It is not the count §1 rules out (that one would equal one table's `total`, and this one spans two tables), and it exists for the person who ran the agent standalone: the orchestrator never reads it and the presence check does not require it. And `implementer-lead-agent`'s execution artifact (Team Mode, outside the mirrors) writes `phase: 3` and `status: COMPLETE`, with no row in §4, so the presence check has nothing to apply to it; its plan artifact uses `phase: implementer-plan` like every other implementer's.
