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

| Agent | File |
|---|---|
| [Context Extractor](#context-extractor) | `agents/context-extractor-agent.md` |
| [Orchestrator](#orchestrator) | `agents/orchestrator-agent.md` |
| [PM Agent](#pm-agent) | `agents/pm-agent.md` |
| [Architect Agent](#architect-agent) | `agents/architect-agent.md` |
| [Implementer Agent](#implementer-agent) | `agents/implementer-agent.md` |
| [Code Reviewer](#code-reviewer) | `agents/code-reviewer-agent.md` |
| [Test Verifier](#test-verifier) | `agents/test-verifier-agent.md` |
| [Release Planner](#release-planner) | `agents/release-planner-agent.md` |

> Team Mode agent files are on a [separate page](/agent-files-team).

---

## Context Extractor

Standalone pre-pipeline agent. Run this before the Orchestrator to produce `00-context.json`.

<<< @/agents/context-extractor-agent.md{md}

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

## Implementer Agent

Code generation with real TDD. **Default implementer — works on every platform.**

<<< @/agents/implementer-agent.md{md}

---

## Code Reviewer

Quality assurance — standards, security, performance, architecture compliance.

<<< @/agents/code-reviewer-agent.md{md}

---

## Test Verifier

Test quality verification — coverage, assertion quality, edge-case coverage.

<<< @/agents/test-verifier-agent.md{md}

---

## Release Planner

Deployment planning — rollback procedures, monitoring, canary strategy.

<<< @/agents/release-planner-agent.md{md}
