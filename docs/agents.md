# The 7 Agents

KAIROS orchestrates 7 specialized AI agents that work together in a coordinated pipeline. You don't need to manage them individually — just mention "KAIROS" and the Orchestrator handles the rest.

---

## Orchestrator

Master coordinator — initiates workflow, routes tasks to specialist agents, manages phase transitions, and ensures quality gates are passed before moving forward.

---

## PM Agent

Analyzes requirements, creates detailed specifications, identifies edge cases, and documents acceptance criteria. Transforms a vague feature request into a precise implementation brief.

---

## Architect Agent

Designs system architecture, plans database schema, designs API contracts, considers performance implications, and defines error handling patterns.

---

## Implementer Agent

Implements code using **real TDD** (tests written before code). Runs tests iteratively until they pass, applies team coding patterns, and handles error cases explicitly.

---

## Code Reviewer

Checks code quality against standards, verifies pattern compliance, reviews architecture alignment, and suggests improvements before the code reaches test verification.

---

## Test Verifier

Verifies test quality, checks that coverage is >80%, validates assertion quality, and ensures edge cases are covered. Blocks progression if test quality is insufficient.

---

## Release Planner

Plans deployment steps, creates rollback procedures, identifies deployment risks, and generates a deployment checklist ready for production use.

---

> **Want to customize an agent?** Edit the corresponding file in the `agents/` folder of the repository — each agent is a plain markdown file with instructions you can tailor to your team's patterns.
