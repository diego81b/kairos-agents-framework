---
description: Closed vocabulary for the ledger's constraint Category column, plus the reader, writer, and gating rules that let a review section run only when its obligation was explicitly declared upstream. Invoked by every agent that creates or updates a constraints.md row, and by every conditional check gated on a declared obligation.
---

# Constraint Taxonomy

Shared reference for `context-extractor-agent`, `pm-agent`, `architect-agent`, `impact-assessment-agent`, `implementer-coder-agent`, `implementer-tdd-agent`, `implementer-lead-agent`, `code-reviewer-agent`, `security-reviewer-agent`, `test-verifier-agent`, `qa-plan-agent`, `release-planner-agent`, `documentation-agent`, and `orchestrator-agent`.

Some quality dimensions apply to a minority of projects. Accessibility, privacy, and regulatory compliance are obligations a product either carries or does not — most do not. A review check that fires on every run regardless, and is therefore waived on every run, teaches the human at the gate to stop reading that section. The opposite failure is just as real: a check that never exists cannot catch the one project that needed it.

This skill resolves both with one mechanism: **an obligation is checked when, and only when, it was explicitly declared upstream as a constraint**. The `Category` cell of a `constraints.md` row is the declaration, and the sections below fix what may go in it, who may write it, and how a downstream check reads it.

---

## 1. The Category Column

`ledger/constraints.md` carries seven columns:

```markdown
| ID | Constraint | Category | Source | Status | Updated by | Note |
|----|-----------|----------|--------|--------|------------|------|
| C1 | No breaking changes to existing REST API | COMPATIBILITY | context-extractor | 🔴 open | — | — |
| C2 | WCAG 2.2 AA on all public-facing screens | ACCESSIBILITY | pm-agent | 🔴 open | — | — |
```

`Category` is written **once, by whoever creates the row**, and never rewritten afterwards. Every other cell except `ID` and `Constraint` changes as the constraint moves through the pipeline; `Category` does not, because it is what downstream conditional checks key on. A Category rewritten mid-pipeline silently disables or enables a check with no error and no trace.

## 2. The Closed Vocabulary

Exactly these twelve values. Uppercase, exact match.

| Category | Covers |
|----------|--------|
| `PERFORMANCE` | Latency, throughput, resource ceilings |
| `SCALE` | Volume, concurrency, growth headroom |
| `SECURITY` | Threat resistance, authn/authz, secrets, hardening |
| `PRIVACY` | Personal-data handling: lawful basis, minimization, retention, data-subject rights |
| `COMPLIANCE` | A named external regime: PCI-DSS, SOC 2, HIPAA, ISO 27001, sector rules |
| `ACCESSIBILITY` | A named accessibility standard: WCAG 2.x, Section 508, EN 301 549 |
| `I18N` | Localization, translation, locale-sensitive formatting |
| `TEAM` | Skills available, ownership boundaries, review capacity |
| `TIMELINE` | Deadlines, sequencing against external dates |
| `COMPATIBILITY` | Backward compatibility, supported versions, no-touch zones |
| `VERIFICATION` | A check no single developer environment can stage: several applications running together, a particular configuration or flag, concurrent sessions on distinct machines, a role or tenant the developer does not hold. Its `Constraint` text names the `AC-n` it covers |
| `OTHER` | Anything the list above does not fit |

`OTHER` is always legal and **never gates anything**. Use it rather than stretching a category to fit; a mis-categorized row is worse than an uncategorized one, because it silently arms a check the project never asked for.

`VERIFICATION` is about how an obligation is *checked*, not about what the system must do. Its `Constraint` text names the `AC-n` it covers (`"AC-7: checking concurrent-edit behavior needs two signed-in sessions on separate machines"`), which is what `test-verifier-agent` reads to route that criterion to manual verification instead of counting it as a coverage gap. "Two operators on two machines must not both save the same order" is the requirement and belongs in an acceptance criterion; "checking it needs two signed-in sessions on separate machines" is the `VERIFICATION` row. Declare it only when the human names the setup — the presence of a second application in the architecture does not declare it.

`SECURITY` and `PRIVACY` are distinct. "Passwords must be hashed with argon2id" is `SECURITY`. "Email addresses must be erasable on request" is `PRIVACY`. A row about a named regime that mandates both is `COMPLIANCE`, and warrants a separate `PRIVACY` row when it carries specific data-handling duties.

## 3. Gating on a Category

Any check conditioned on a declared obligation uses this predicate, unchanged:

> A category is *declared* for this feature when `constraints.md` contains at least one row whose `Category` cell equals that category exactly and whose `Status` is not `❌ dropped`. Any other state — no such row, no `Category` column, no file — is *undeclared*.

The `❌ dropped` exclusion is load-bearing. A constraint that an earlier phase declared and then dismissed with justification must not resurrect the full check; letting it do so recreates exactly the fires-every-time, waived-every-time pattern this mechanism exists to prevent. `⚠ deferred` and `♻ modified` still count as declared — a deferred obligation is still an obligation.

**Never infer a declaration.** The presence of UI code does not declare `ACCESSIBILITY`; the presence of an email column does not declare `PRIVACY`; a dependency on a payment SDK does not declare `COMPLIANCE`. An absent category is the normal case, and keeping it quiet is the point.

## 4. Reader Rule

Cited inline by every conditional check:

> If `constraints.md` does not exist, or its header row does not contain a `Category` column, treat every category as undeclared: no conditional check gated on a Category may run, and each one reports its `N/A` line.

This rule stands alone. It must never depend on a migration having run, because a pipeline running entirely in Lean Mode may touch no ledger file at all.

## 5. Writer Rule

Cited by every site that appends a constraint row:

> Before appending a row to `constraints.md`, check the header. If it has the legacy 6 columns (`ID | Constraint | Source | Status | Updated by | Note`), first rewrite the header and every existing row to the 7-column form, assigning each pre-existing row the taxonomy Category that best matches its `Constraint` text and `OTHER` when none fits — then append. Never leave a table with rows of two different widths.

Migration is a one-shot judgment made at write time, not a guess repeated at every read. That is why no conditional check ever falls back to keyword matching on the `Constraint` text: a grep for `WCAG|GDPR|PII` is a second predicate to maintain and it misfires on ordinary rows like "no PII in application logs."

## 6. Preservation Rule

Cited by every "update the Status of every existing row" block:

> Never rewrite an existing row's `Category` cell — it is set once by whoever created the row and is what downstream conditional checks key on. Only `Status`, `Updated by`, and `Note` change here.

## 7. Adding a New Conditional Check

The pattern generalizes; `ACCESSIBILITY` in `code-reviewer-agent`, `PRIVACY`/`COMPLIANCE` in `security-reviewer-agent`, and `VERIFICATION` in `qa-plan-agent`'s Cross-Environment Verification section are the current tenants, and `I18N` or a specific `COMPLIANCE` regime would be the next with no new machinery. A new conditional check needs four things, and nothing else:

1. A category from §2 that a human can be asked about at requirement time.
2. An elicitation question in `pm-agent` that does not manufacture the obligation when the human has none.
3. A section whose **first paragraph** applies the §3 predicate and the §4 reader rule, and which reports an `N/A — no <X> obligation declared` line when undeclared. The opening paragraph is the right place: a collapse rule placed in an agent's `Effort Detection & Lean Mode` block would be scoped to `simple_fix` and would therefore fire the full check on every larger feature, which is the failure this mechanism exists to prevent.
4. A statement that the gate is the obligation and not the diff size — the check runs in full at `effort: simple_fix` when declared, and stays `N/A` at `significant_rework` when not.
