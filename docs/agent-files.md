# Agent Files — Copy & Use

This page embeds the **raw content of every KAIROS agent file**. Click the copy button on any code block to grab the full agent definition, then paste it into your AI tool's agent configuration.

> **How this stays in sync** — Each block is imported directly from the source file in the repository at build time. Any edit to the source agent file is automatically reflected here on the next build. No manual copy-paste between source and documentation is needed.

::: warning Contributor rule — mandatory changelog entry
**Every modification to any agent file must produce an entry in [`CHANGELOG.md`](/changelog).**

Format:
```
## [vX.Y.Z] — YYYY-MM-DD

### Changed
- `agents/<filename>.md` — describe what changed and why
```
No exceptions. A pull request that modifies an agent without a matching changelog entry will be rejected.
:::

---

## Quick jump

| Agent | File | Started by |
|---|---|---|
| [Context Extractor](#context-extractor) | `agents/context-extractor-agent.md` | **You** |
| [Impact Assessment](#impact-assessment) | `agents/impact-assessment-agent.md` | Orchestrator at Step 0e, or **you** beforehand (its output is then reused) |
| [Bug Triage](#bug-triage) | `agents/bug-triage-agent.md` | **You**, or the Orchestrator at its Bug-Input Check |
| [Orchestrator](#orchestrator) | `agents/orchestrator-agent.md` | **You** (drives the pipeline rows) |
| [PM Agent](#pm-agent) | `agents/pm-agent.md` | Orchestrator |
| [Architect Agent](#architect-agent) | `agents/architect-agent.md` | Orchestrator |
| [Implementer Agent — TDD](#implementer-tdd-agent) | `agents/implementer-tdd-agent.md` | Orchestrator |
| [Implementer Agent — Code First](#implementer-coder-agent) | `agents/implementer-coder-agent.md` | Orchestrator |
| [Code Reviewer](#code-reviewer) | `agents/code-reviewer-agent.md` | Orchestrator |
| [Security Reviewer](#security-reviewer) | `agents/security-reviewer-agent.md` | Orchestrator |
| [Test Verifier](#test-verifier) | `agents/test-verifier-agent.md` | Orchestrator |
| [QA Plan Agent](#qa-plan-agent) | `agents/qa-plan-agent.md` | Orchestrator |
| [Release Planner](#release-planner) | `agents/release-planner-agent.md` | Orchestrator |
| [Documentation Agent](#documentation-agent) | `agents/documentation-agent.md` | Orchestrator |
| [Retrospective Agent](#retrospective-agent) | `agents/retrospective-agent.md` | **You** |
| [Improvement Advisor](#improvement-advisor) | `agents/improvement-advisor-agent.md` | **You** |
| [Dependency Audit](#dependency-audit) | `agents/dependency-audit-agent.md` | **You** |

> Team Mode agent files are on a [separate page](/agent-files-team).
>
> The shared [Contract Checklist](skills/contract-checklist/SKILL.md) used by Architect Agent and Implementer Lead is in `skills/contract-checklist/SKILL.md`.
>
> The shared [Threat Model](skills/threat-model/SKILL.md) checklist — design-time trust boundaries, attack surface, authority, and blast radius, used by Architect Agent's Step 5b and emitting into that phase's own Risks table — is in `skills/threat-model/SKILL.md`.
>
> The shared [Migration Safety](skills/migration-safety/SKILL.md) checklist — expand/contract sequencing, lock duration, backfill restartability, reversibility, and what a code rollback does to new-shaped data, used by Architect Agent when the data model changes and by Release Planner when it writes the rollback strategy — is in `skills/migration-safety/SKILL.md`.
>
> The shared [Constraint Taxonomy](skills/constraint-taxonomy/SKILL.md) reference — the closed `Category` vocabulary of the ledger's `constraints.md`, plus the reader, writer, and gating rules that let Code Reviewer's Accessibility check and Security Reviewer's Compliance & Privacy check run only when that obligation was declared upstream — is in `skills/constraint-taxonomy/SKILL.md`.
>
> The shared [Analysis Discipline](skills/analysis-discipline/SKILL.md) checklist — evidence-backed findings, restraint on low-value nitpicks, scope-bounded investigation, and a defect-class sweep of the enclosing unit before any finding is recorded, applied by every agent that reads, judges, or reports on someone else's requirement, design, or code — is in `skills/analysis-discipline/SKILL.md`.
>
> The shared [Code Simplification](skills/code-simplification/SKILL.md) checklist used by the Implementer Agent (TDD and Code First) REFACTOR step is in `skills/code-simplification/SKILL.md`.
>
> The shared [Artifact Bookkeeping](skills/artifact-bookkeeping/SKILL.md) reference — the recount and status-derivation rules used by PM, Architect, Impact Assessment, both Implementers, Code Reviewer, Security Reviewer, Test Verifier, Release Planner, and Documentation Agent, plus the per-phase required-frontmatter-fields table the Orchestrator's Artifact Contract Check validates against — is in `skills/artifact-bookkeeping/SKILL.md`.
>
> The shared [Coding Discipline](skills/coding-discipline/SKILL.md) checklist — scope discipline, anti-speculative-abstraction, and verifiable success criteria, applied before implementation by both Implementer agents and (Team Mode) Implementer Lead and all four teammates — is in `skills/coding-discipline/SKILL.md`.

---

## Context Extractor

Standalone pre-pipeline agent. Run this before the Orchestrator to produce `00-context.md`.

<<< @/agents/context-extractor-agent.md{md}

---

## Impact Assessment

Pre-pipeline grounding agent, dispatched by the Orchestrator at Step 0e in Orchestrated mode unless you already ran it yourself (then its `00b-impact.md` is reused). Produces `00b-impact.md` — T-shirt size and the effort that follows from it, domains, test suite, contract change and change kind: facts the Orchestrator derives the pipeline from. It never names an agent; its gate is folded into the Orchestrator's Start Gate.

<<< @/agents/impact-assessment-agent.md{md}

---

## Bug Triage

Standalone entry point for a bug report rather than a feature request. Reproduces the defect, isolates it, finds the root cause with evidence, rates severity, and recommends where the fix re-enters the pipeline — its `recommended_entry` feeds the Orchestrator's effort resolution (`quick-fix` → `simple_fix`, unless the impact assessment measured `medium` or more; a triage can raise the effort, never lower it). Never fixes anything itself. Produces `00c-bug-triage.md`. Runs either directly from you or dispatched by the Orchestrator's Bug-Input Check in Orchestrated mode, where it skips its own gate and the Orchestrator presents the artifact instead.

<<< @/agents/bug-triage-agent.md{md}

---

## Orchestrator

Master coordinator. Routes the full pipeline and manages HITL gates.

<<< @/agents/orchestrator-agent.md{md}

---

## PM Agent

Requirement analysis — transforms a vague request into a structured brief.

<<< @/agents/pm-agent.md{md}

---

## Architect Agent

System design — architecture options, database schema, API contracts.

<<< @/agents/architect-agent.md{md}

---

## Implementer Agent — TDD

Code generation with real TDD. **Default implementer when the project has a test suite — works on every platform.**

<<< @/agents/implementer-tdd-agent.md{md}

---

## Implementer Agent — Code First

Code first, then the tests its plan's Test Decision calls for — extending the tests of touched modules, a regression test for a bug fix, none (with a stated verification) when the project has no suite. **Chosen by the Orchestrator for `simple_fix`, for projects without a test suite, and when the design says `test_first: no`.**

<<< @/agents/implementer-coder-agent.md{md}

---

## Code Reviewer

Quality assurance — standards, security, performance, architecture compliance.

<<< @/agents/code-reviewer-agent.md{md}

---

## Security Reviewer

Adversarial security review — IDOR, auth, injection, secrets, data exposure, input validation, dependencies. Optional; runs in the review wave alongside Code Reviewer when derived at the implementation gate. Read-only agent.

<<< @/agents/security-reviewer-agent.md{md}

---

## Test Verifier

Test quality verification — coverage, assertion quality, edge-case coverage.

<<< @/agents/test-verifier-agent.md{md}

---

## QA Plan Agent

Manual and exploratory verification planning — what the automated suite cannot cover, regression retest selection, test data and environment, UAT sign-off. Never sends a tester to the developer's tools. Writes the comment and, above three checks or for an epic, the file the Orchestrator delivers after you approve the plan.

<<< @/agents/qa-plan-agent.md{md}

---

## Release Planner

Deployment planning — rollback procedures, monitoring, canary strategy.

<<< @/agents/release-planner-agent.md{md}

---

## Documentation Agent

Optional Phase 6b, runs after Release Planner. Feature-facing documentation (README, API reference, CHANGELOG) in the target project — the second agent, after the Phase 3 implementer, permitted to write outside `.kairos/`, scoped strictly to documentation files. Also writes, verbatim and only after the Orchestrator's own gate, the project summary and the QA plan file.

<<< @/agents/documentation-agent.md{md}

---

## Retrospective Agent

Standalone post-pipeline agent. Run any time after work on a feature stops to synthesize its own artifacts and ledger into lessons, appended to the project-root `.kairos/_lessons.md`.

<<< @/agents/retrospective-agent.md{md}

---

## Improvement Advisor

Standalone, infrequent agent. Run every few features to read the accumulated `.kairos/_lessons.md` and propose framework changes as `.kairos/decisions/ADR-*.md` records. Never edits `agents/*.md` itself — proposals only.

<<< @/agents/improvement-advisor-agent.md{md}

---

## Dependency Audit

Standalone, periodic agent. Run every few months, outside any feature, to audit the whole project's dependencies and accumulated debt — known CVEs, stale versions, license conflicts, unused and duplicated packages, debt hotspots — into a prioritized backlog at the project-root `.kairos/_tech-debt.md`. Never applies an upgrade itself; a human takes backlog rows through the pipeline like any other work.

<<< @/agents/dependency-audit-agent.md{md}
