# Team Mode Agent Files — Copy & Use

::: info Claude Code only
These five agents are used exclusively in **Team Mode** — activated on explicit user request via the Orchestrator. See [Team Mode setup](/setup/claude-code#how-to-activate-team-mode) for details.
:::

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
| [Implementer Lead](#implementer-lead) | `agents/team/implementer-lead-agent.md` |
| [Teammate Tests](#teammate-tests) | `agents/team/teammate-tests-agent.md` |
| [Teammate Backend](#teammate-backend) | `agents/team/teammate-backend-agent.md` |
| [Teammate Frontend](#teammate-frontend) | `agents/team/teammate-frontend-agent.md` |
| [Teammate Database](#teammate-database) | `agents/team/teammate-database-agent.md` |

---

## Implementer Lead

Team coordinator for complex multi-layer features. Claude Code only. Spawns four parallel specialists.

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
