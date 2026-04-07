# The 8 Agents

KAIROS orchestrates 8 specialized AI agents. The Context Extractor runs standalone before the main pipeline; the remaining 7 run in sequence coordinated by the Orchestrator.

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

Implements code using **real TDD** (tests written before code). Runs tests iteratively until they pass, applies team coding patterns, and handles error cases explicitly.

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
