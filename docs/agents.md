# The KAIROS Agents

KAIROS orchestrates a core pipeline of 8 specialized AI agents, plus an optional team of 5 specialists for Team Mode. The Context Extractor runs standalone before the main pipeline; the remaining core agents run in sequence coordinated by the Orchestrator. Team Mode agents are Claude Code only and activated on explicit request.

::: tip Copy agents directly from the documentation
Need the raw agent definition to paste into your tool? Go to **[Agent Files](/agent-files)** — every agent is embedded as a ready-to-copy code block, auto-synced from the source files.
:::

::: warning Contributing — mandatory changelog entry
Every modification to an agent file must be accompanied by an entry in [`CHANGELOG.md`](/changelog). No exceptions.
:::

---

## [Context Extractor](/agents/context-extractor-agent)

Scans the codebase and an issue draft to produce a structured context file (`00-context.json`) that all downstream agents consume. Run this agent before launching the Orchestrator to give every phase accurate, verified knowledge of your stack, patterns, and conventions — without each agent re-scanning the repository independently.

---

## [Orchestrator](/agents/orchestrator-agent)

Master coordinator — initiates workflow, routes tasks to specialist agents, manages phase transitions, and ensures quality gates are passed before moving forward.

---

## [PM Agent](/agents/pm-agent)

Analyzes requirements, creates detailed specifications, identifies edge cases, and documents acceptance criteria. Transforms a vague feature request into a precise implementation brief.

---

## [Architect Agent](/agents/architect-agent)

Designs system architecture, plans database schema, designs API contracts, considers performance implications, and defines error handling patterns.

---

## [Implementer Agent](/agents/implementer-agent)

Implements code using **real TDD** (tests written before code). Runs tests iteratively until they pass, applies team coding patterns, and handles error cases explicitly. This is the **default implementer for all features** — works with Claude Code, API, and local models.

---

## Implementer Team — Team Mode (Claude Code only, optional)

For complex multi-layer features, the Orchestrator can activate a coordinated team of specialists instead of the single Implementer Agent. Team Mode must be **explicitly requested** — the Orchestrator will show a cost warning (~$0.242 vs ~$0.068) before proceeding.

**Why Claude Code only?** Team Mode uses Claude Code's **experimental Agent Teams feature** (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, requires v2.1.32+). Each teammate runs as a separate Claude Code session with its own context window; teammates communicate peer-to-peer via a shared mailbox and coordinate via a shared task list. Other tools (Cursor, VS Code, JetBrains, Codex CLI) have no equivalent inter-session coordination mechanism.

The [Implementer Lead](/agents/team/implementer-lead-agent) acts as coordinator (not a coder). It creates binding contracts (API, database, test, pattern) and spawns four parallel teammates:

### [Implementer Lead](/agents/team/implementer-lead-agent)

Team coordinator — applies the full TDD discipline across specialized teammates. Defines four binding contracts (API, database, test, pattern) before anyone starts. Then orchestrates three distinct phases:

- **RED** — spawns `teammate-tests-agent` first; tests are written against the contracts before any implementation exists. Presents the test plan to the user (HITL gate) before proceeding.
- **GREEN** — spawns `teammate-backend-agent`, `teammate-frontend-agent`, `teammate-database-agent` in parallel; their goal is to make the pre-existing tests pass.
- **REFACTOR** — coordinates quality improvements across all layers while keeping tests green.

Monitors contract compliance throughout, flags mismatches, and aggregates the final output. Does not write code itself.

### [Teammate Tests](/agents/team/teammate-tests-agent)

Test specialist — generates the full test suite following the RED phase of TDD (failing tests first). Covers happy paths, error cases, edge cases, and integration tests. Target: >80% coverage.

### [Teammate Backend](/agents/team/teammate-backend-agent)

Backend specialist — implements API routes and business logic exactly per the API contract defined by the Lead. Validates input, calls services, returns responses, and handles errors as specified.

### [Teammate Frontend](/agents/team/teammate-frontend-agent)

Frontend specialist — implements UI components and client code that calls the Backend APIs exactly per the API contract. Handles all response and error codes defined in the contract.

### [Teammate Database](/agents/team/teammate-database-agent)

Database specialist — creates schema migrations and rollback scripts exactly per the database contract. Adds indexes and constraints as specified.

---

## [Code Reviewer](/agents/code-reviewer-agent)

Checks code quality against standards, verifies pattern compliance, reviews architecture alignment, and suggests improvements before the code reaches test verification.

---

## [Test Verifier](/agents/test-verifier-agent)

Verifies test quality, checks that coverage is >80%, validates assertion quality, and ensures edge cases are covered. Blocks progression if test quality is insufficient.

---

## [Release Planner](/agents/release-planner-agent)

Plans deployment steps, creates rollback procedures, identifies deployment risks, and generates a deployment checklist ready for production use.

---

> **Want to copy an agent?** Go to **[Agent Files](/agent-files)** — every agent is embedded as a ready-to-copy code block, kept in sync with the source automatically.

> **Want to customize an agent?** Edit the corresponding file in the `agents/` folder of the repository — each agent is a plain markdown file with instructions you can tailor to your team's patterns.
