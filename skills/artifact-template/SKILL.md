---
description: Shared body skeleton for every KAIROS phase artifact — the mandatory Summary head block that makes a gate readable in seconds, and the fixed column sets for any table the orchestrator's Risk Disposition Loop parses. Invoked by every agent that writes a .kairos/ phase artifact.
---

# Artifact Template

Shared reference for `context-extractor-agent`, `impact-assessment-agent`, `bug-triage-agent`, `pm-agent`, `architect-agent`, `implementer-tdd-agent`, `implementer-coder-agent`, `implementer-lead-agent`, `code-reviewer-agent`, `security-reviewer-agent`, `test-verifier-agent`, `qa-plan-agent`, `release-planner-agent`, `documentation-agent`, `retrospective-agent`, `improvement-advisor-agent`, and `dependency-audit-agent`.

Every phase artifact has two readers with opposite needs. The human at the HITL gate wants to know in ten seconds what happened and whether to approve. The next agent needs the full data model, the complete API contracts, the whole issues table as prompt input. Cutting detail to serve the first reader breaks the second one. This skill layers instead: a fixed head block that answers the gate, and everything else below it, unchanged.

It governs two things only — the head block, and the column sets of Disposition tables. Each agent's own Output Format section stays the source of truth for its frontmatter and for every detail section it emits.

## 1. The Summary block

Every artifact body opens with `## Summary` as its first section — after the `# <Title>` heading where the phase uses one, immediately after the frontmatter where it doesn't — and nothing else comes before the phase's own sections. Five bold labels, in this order, one line each, always all five present:

```markdown
## Summary
**What:** <what this phase produced, one line>
**Decision:** <the one choice this phase made, or `none — analysis only`>
**Needs your attention:** <row IDs of every critical/high row, or `nothing above medium`>
**Open:** <ledger IDs of the questions this phase leaves open, or `none`>
**Next:** <next agent, or `end of pipeline`, or `stop — <reason>`>
```

Rules:

- **Seven lines maximum**, heading included. This block is what the orchestrator prints at the gate (HITL step 3), which is capped at ~7 lines. A block that runs long defeats its own purpose.
- **`Needs your attention` carries row IDs, never restated descriptions** — `R1, R3 — see Risks` or `F2 — see Findings`. The Risk Disposition Loop edits those rows after this file is written; a restated description drifts out of sync the moment it does, and a reader who wants the detail is one scroll away. Cap at three IDs, then `and N more`. Write `nothing above medium` when no row is `critical` or `high`, or `none` when the phase has no Impact-rated table at all — never leave the line out.
- **`Open` carries `ledger/open-questions.md` row IDs**, never restated questions and never IDs invented locally — `Q3, Q7 — see ledger`. That file is the authoritative list; a question this phase raised has a row there before this line names it. Cap at three IDs, then `and N more`. Write `none` when this phase left nothing open — never leave the line out. (`impact-assessment-agent` is the one exception: it runs before the ledger exists and names its own `## Open Questions` table's IDs instead.)
- **An open point written in prose but not in `open-questions.md` does not exist.** This is the rule that makes the line above honest. A question raised in a paragraph of the body, and nowhere else, is invisible to every later phase, to the orchestrator's end-of-run ledger audit, and to `_recap.md` — it reaches nobody. Before writing the Summary, check that every unresolved question the body raises has a ledger row; raise the row if it doesn't, then name it here.
- **`Decision` is the phase's own choice**, not a summary of the work: the selected architecture option, the effort classification, the pass/fail verdict, the chosen deployment strategy. Phases that only observe (`context-extractor`, `retrospective`) write `none — analysis only`.
- **`Next` is the only place the successor is named.** Name the agent that runs after this one; when the phase is terminal (`release-planner`, `documentation`), write `end of pipeline`; when the phase's own `status` blocks advancement, write `stop — <one-clause reason>`. No frontmatter field duplicates it — the orchestrator derives the next phase from which artifacts exist, not from a field the artifact declares about itself.
- Write the block **last**, after the body is complete and the tallies are final — it describes what the artifact actually says, not what you set out to write.

## 2. Disposition table columns

Any table the orchestrator's Risk Disposition Loop walks row by row must carry exactly one of the column sets below, spelled exactly as written. The loop reads these tables by their `Disposition` column, wherever they sit in the body — this skill fixes the columns, not the position. Keep each table where its own agent's Output Format puts it.

**Standard (five columns)** — Risks, Issues, Findings, Contract Drift, Documentation Gaps, Flagged Conflicts:

```markdown
| ID | Description | Impact | Mitigation/Fix | Disposition |
```

The fourth column is `Mitigation/Fix` in every phase, whatever the table is named. `Mitigation` alone and `Fix` alone are not variants of it — the orchestrator's Constraint & Decision Conflict Scan appends rows written against this exact header, and a table that spells it differently ends up internally inconsistent the first time that scan fires.

**Extended (seven columns)** — `test-verifier-agent` only:

```markdown
| ID | Category | File:Line | Description | Impact | Mitigation/Fix | Disposition |
```

Leading columns before `Description` are the extension point. The last three columns stay `Impact | Mitigation/Fix | Disposition`, in that order, in every variant.

**Secondary (four columns)** — `impact-assessment-agent`'s Open Questions:

```markdown
| ID | Description | Why it matters | Disposition |
```

In all three shapes: leave every `Disposition` cell empty in your own output. The orchestrator's Risk Disposition Loop fills it from the human's per-row choice; when running standalone, the human does at the gate.

**Row overflow.** When a row's reasoning doesn't fit one line, keep a one-line `Description` ending in a "see below" pointer and add a short prose paragraph immediately under the table for that row. The table itself always keeps its own column count — the loop parses it either way, and the paragraph is what the loop's on-demand explain trigger reads from.

## 3. Detail sections

Everything after the Summary block is the phase's own. Section names, order, and depth come from that agent's Output Format section and are not constrained here. This skill adds a head, it does not reshape the body.

## 4. Exemptions

| Artifact | Exempt from | Why |
|----------|-------------|-----|
| `_recap.md` (orchestrator-written) | §1 Summary | It is already a whole-pipeline summary; a summary of a summary adds nothing. |
| `retrospective-agent`'s Friction Points table | §2 columns | It has no `Disposition` column — nothing downstream reads it; it is the evidence trail for the lessons below it. |
| `improvement-advisor-agent`'s ADR files | §1 Summary | ADRs are a fixed external format (Status/Context/Decision/Consequences), not a phase artifact behind a gate. Its `_improvement-advisory.md` is not exempt. |
| `implementer-lead-agent`'s `03-contracts.md` | §1 Summary | A supporting artifact, not a gated phase output — the gate is on `03-implementation-plan.md`, whose own Summary covers it. |
| `context-extractor-agent`'s Prompt Template section | §1 Summary | Only the artifact body opens with Summary — the prompt block inside it is copy-paste input for another agent, not a section of this document. |
| `bug-triage-agent`'s Evidence table | §2 columns | It is the proof trail behind the root cause, not a set of findings for a gate to resolve. |
| `qa-plan-agent`'s tables other than `## Risks` (Coverage Complement, Manual Test Cases, Exploratory Charters, Existing Manual Cases to Re-run, Test Data & Environment, UAT Sign-off) | §2 columns | They are a plan for a human to execute, not findings for a gate to resolve. `## Risks` is the artifact's one Disposition table and uses the standard five columns. |
| `qa-plan-agent`'s `_qa-regression.md` catalogue | §1 Summary, §2 columns | A project-wide catalogue a human draws from across features, not a gated phase output — no Disposition column, and the Loop never runs against it. |
| `dependency-audit-agent`'s tables (Vulnerabilities, Version Currency, Licenses, Debt Hotspots, Backlog) | §2 columns | A standing backlog a human draws from over time, not a gate resolved in one sitting — no Disposition column anywhere, and the Loop never runs against `_tech-debt.md`. |
