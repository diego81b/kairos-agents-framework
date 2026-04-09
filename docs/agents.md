# The KAIROS Agents

KAIROS orchestrates a core pipeline of 8 specialized AI agents, plus an optional team of 5 specialists for Team Mode. The Context Extractor runs standalone before the main pipeline; the remaining core agents run in sequence coordinated by the Orchestrator. Team Mode agents are Claude Code only and activated on explicit request.

---

## [Context Extractor](/agents/context-extractor)

Scans the codebase and an issue draft to produce a structured context file (`00-context.json`) that all downstream agents consume. Run this agent before launching the Orchestrator to give every phase accurate, verified knowledge of your stack, patterns, and conventions — without each agent re-scanning the repository independently.

---

## [Orchestrator](/agents/orchestrator)

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

**Why Claude Code only?** Team Mode requires one agent to spawn other agents programmatically at runtime. Claude Code provides this via the native `agent` tool. Other tools (Cursor, VS Code, JetBrains, Codex CLI) only support user-triggered agent calls — an agent cannot autonomously instantiate teammates during its own execution.

The [Implementer Lead](/agents/implementer-lead) acts as coordinator (not a coder). It creates binding contracts (API, database, test, pattern) and spawns four parallel teammates:

### [Implementer Lead](/agents/implementer-lead)

Team coordinator — analyzes the Architect output, defines binding contracts for all layers, spawns teammates in parallel, monitors contract compliance, and aggregates the final output. Does not write code itself.

### [Teammate Tests](/agents/teammates/teammate-tests)

Test specialist — generates the full test suite following the RED phase of TDD (failing tests first). Covers happy paths, error cases, edge cases, and integration tests. Target: >80% coverage.

### [Teammate Backend](/agents/teammates/teammate-backend)

Backend specialist — implements API routes and business logic exactly per the API contract defined by the Lead. Validates input, calls services, returns responses, and handles errors as specified.

### [Teammate Frontend](/agents/teammates/teammate-frontend)

Frontend specialist — implements UI components and client code that calls the Backend APIs exactly per the API contract. Handles all response and error codes defined in the contract.

### [Teammate Database](/agents/teammates/teammate-database)

Database specialist — creates schema migrations and rollback scripts exactly per the database contract. Adds indexes and constraints as specified.

---

## [Code Reviewer](/agents/code-reviewer)

Checks code quality against standards, verifies pattern compliance, reviews architecture alignment, and suggests improvements before the code reaches test verification.

---

## [Test Verifier](/agents/test-verifier)

Verifies test quality, checks that coverage is >80%, validates assertion quality, and ensures edge cases are covered. Blocks progression if test quality is insufficient.

---

## [Release Planner](/agents/release-planner)

Plans deployment steps, creates rollback procedures, identifies deployment risks, and generates a deployment checklist ready for production use.

---

> **Want to customize an agent?** Edit the corresponding file in the `agents/` folder of the repository — each agent is a plain markdown file with instructions you can tailor to your team's patterns.
