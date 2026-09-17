# Quality

KAIROS is a quality framework, not a speed one. It buys you fewer unreviewed decisions, not fewer hours — and this page is deliberate about which of those two it can promise.

There are no benchmark numbers here. Development speed depends on your codebase, your stack, your review culture, and how big the change is; any figure published as a general claim would be marketing, not measurement. What follows is what the framework actually enforces, and what you can measure in your own repository if you want numbers.

---

## What the framework enforces

| Guarantee | Enforced by |
|---|---|
| No phase advances without a human decision | The Orchestrator's gate after every active phase — Approve, Request changes, Skip next, Stop |
| Every risk, issue, and finding is dispositioned one by one | The Risk Disposition Loop, which resolves each row before the whole-artifact gate is shown |
| Acceptance criteria carry stable `AC-n` IDs, assigned once and never renumbered | `pm-agent`, read by every later phase and mapped to tests by `test-verifier-agent` |
| Tests are written before the code, and the RED phase is actually observed | `implementer-tdd-agent`, re-checked afterwards by `test-verifier-agent`'s TDD reality check |
| Coverage stays above 80%, with assertions that would fail if the behaviour broke | `test-verifier-agent`, which grades assertion strength and determinism rather than counting lines |
| Findings come with evidence at `file:line`, never with an unsupported verdict | The `analysis-discipline` skill, applied by every reviewing agent |
| Security is reviewed adversarially, with attack scenarios and real severity | `security-reviewer-agent`, optional and recommended for auth, payments, and write endpoints |
| What automated tests cannot check is planned, not assumed | `qa-plan-agent` — manual and exploratory cases, regression retest list, UAT sign-off per `AC-n` |
| Constraints, decisions, and open questions reach a terminal state before release | The ledger, re-walked in full at `architect-agent` and again at `release-planner-agent` |
| Every decision is on disk, reviewable like any other file | `.kairos/<feature>/` — one Markdown artifact per phase plus the ledger, committed with the branch |

None of these is a claim about output quality in the abstract. Each one is a mechanism you can read in the agent file that implements it.

---

## What it does not promise

- **A time saving.** Gates cost you attention on purpose. A run with an attentive human at every gate is not faster than one prompt to one model; it is auditable, which is a different thing.
- **Correct code without review.** The output is a strong draft with a written trail of what was checked. The gates exist because the drafts need you.
- **A number.** No "40% faster", no "90% correct". If you want figures for your team, measure them in your repository — see below.

---

## Measuring it in your own repository

Track these per feature over four to six weeks, with and without KAIROS, and compare like for like — the same kind of change, the same reviewers.

| What to track | How |
|---------------|-----|
| Review cycles | Number of back-and-forth rounds before merge |
| Post-merge incidents | Bugs or regressions traced to the feature |
| Rework after review | Commits made purely to answer review findings |
| Acceptance criteria coverage | `AC-n` rows with a test mapped to them, from `05-test-verification.md` |
| Unresolved questions at release | 🔴 rows left in `ledger/open-questions.md` when the feature ships |
| Escaped defects by phase | Which gate could have caught the defect, read back from the artifacts |

The last three come straight out of the artifacts KAIROS already writes, so they cost nothing extra to collect.
