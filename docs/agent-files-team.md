# Layered Mode Agent Files: Copy & Use

::: info Claude Code only
These five agents are the **Layered Mode** agents (called Team Mode until v9.5.0; the `agents/team/` folder and the agent ids keep their old names on purpose). The Orchestrator dispatches them, offers the mode when a test-first change touches two or more of backend/frontend/db, and activates it only after you confirm. They are not meant to be started on their own. See [how Layered Mode is offered](/setup/claude-code#how-layered-mode-is-offered) for details.
:::

> **How this stays in sync** — Each block is imported directly from the source file in the repository at build time. Any edit to the source agent file is automatically reflected here on the next build. No manual copy-paste between source and documentation is needed.

---

## Quick jump

| Agent | File |
|---|---|
| [Implementer Lead](#implementer-lead) | `agents/team/implementer-lead-agent.md` |
| [Teammate Tests](#teammate-tests) | `agents/team/teammate-tests-agent.md` |
| [Teammate Backend](#teammate-backend) | `agents/team/teammate-backend-agent.md` |
| [Teammate Frontend](#teammate-frontend) | `agents/team/teammate-frontend-agent.md` |
| [Teammate Database](#teammate-database) | `agents/team/teammate-database-agent.md` |

> The shared [Coding Discipline](skills/coding-discipline/SKILL.md) checklist used by Implementer Lead and all four layer agents before implementation is in `skills/coding-discipline/SKILL.md`.

---

## Implementer Lead

Lead of Layered Mode for complex multi-layer features. Claude Code only. Writes the contracts and the plan, then verifies and closes the run, while the Orchestrator dispatches the layer agents: Tests, plus one per layer in scope.

<<< @/agents/team/implementer-lead-agent.md{md}

---

## Teammate Tests

RED phase specialist — writes the full test suite before any implementation exists.

<<< @/agents/team/teammate-tests-agent.md{md}

---

## Teammate Backend

Backend specialist — API routes and business logic per the Lead's contracts.

<<< @/agents/team/teammate-backend-agent.md{md}

---

## Teammate Frontend

Frontend specialist — UI components and client code per the Lead's contracts.

<<< @/agents/team/teammate-frontend-agent.md{md}

---

## Teammate Database

Database specialist — schema migrations and rollback scripts per the Lead's contracts.

<<< @/agents/team/teammate-database-agent.md{md}
