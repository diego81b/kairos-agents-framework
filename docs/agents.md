# The KAIROS Agents

KAIROS orchestrates a core pipeline of 11 specialized AI agents, plus an optional team of 5 specialists for Team Mode. Two agents run standalone before the main pipeline (Context Extractor and Impact Assessment); the remaining core agents run in sequence coordinated by the Orchestrator. Team Mode agents are Claude Code only and activated on explicit request.

::: tip Copy agents directly from the documentation
Need the raw agent definition to paste into your tool? Go to **[Agent Files](/agent-files)** — every agent is embedded as a ready-to-copy code block, auto-synced from the source files.
:::

::: warning Contributing — mandatory changelog entry
Every modification to an agent file must be accompanied by an entry in [`CHANGELOG.md`](/changelog). No exceptions.
:::

---

## [Context Extractor](/agents/context-extractor-agent)

Scans the codebase and an issue draft to produce a structured context file (`00-context.json`) that all downstream agents consume. Run this agent before launching the Orchestrator to give every phase accurate, verified knowledge of your stack, patterns, and conventions — without each agent re-scanning the repository independently.

::: tip Optional enhancements
**Skills:** `deep-research` (built-in), `audit-context-building` (Trail of Bits)  
Install: `claude plugin install trailofbits/skills/audit-context-building`
:::

---

## [Impact Assessment](/agents/impact-assessment-agent)

Issue-scoped grounding agent. Run this before the Orchestrator (optionally, after Context Extractor) to answer three questions before you select agents: How big is this? What already exists and what is missing? Which pipeline agents does this issue actually need?

Unlike the Context Extractor, which scans the full repository, this agent reads only the code the issue directly touches. It consumes `00-context.json` if already present rather than rescanning. Output is `00b-impact.json` with effort estimate (`simple_fix / medium / significant_rework`), domains touched (backend / frontend / db / auth / integrations), reusable assets with real file paths, gaps, risks, and a `recommended_agents` list with per-agent justification.

The recommendation is advisory only. When the Orchestrator detects `00b-impact.json`, it displays the recommendation as a `💡 Impact Assessment` block above the agent selection menu — the human confirms or ignores it. Nothing is pre-selected.

::: tip Optional enhancements
**Skills:** `deep-research` (built-in)
:::

---

## [Orchestrator](/agents/orchestrator-agent)

Master coordinator — initiates workflow, routes tasks to specialist agents, manages phase transitions, and ensures quality gates are passed before moving forward.

---

## [PM Agent](/agents/pm-agent)

Analyzes requirements, creates detailed specifications, identifies edge cases, and documents acceptance criteria. Transforms a vague feature request into a precise implementation brief.

::: tip Optional enhancements
**Skills:** `deep-research` (built-in), `outcome-issue-generator` (built-in), `ask-questions-if-underspecified` (Trail of Bits)  
Install: `claude plugin install trailofbits/skills/ask-questions-if-underspecified`
:::

---

## [Architect Agent](/agents/architect-agent)

Designs system architecture, plans database schema, designs API contracts, considers performance implications, and defines error handling patterns.

::: tip Optional enhancements
**Skills:** `deep-research` (built-in)  
Note: `trailmark/diagramming-code` skipped — plugin installs 10 skills, only 1 needed. Inline call graph analysis via Read + Grep is used instead.
:::

---

## [Implementer Agent — TDD](/agents/implementer-tdd-agent)

Implements code using **real TDD** (tests written before code). Runs tests iteratively until they pass, applies team coding patterns, and handles error cases explicitly. This is the **default implementer for all features** — works with Claude Code, API, and local models.

::: tip Optional enhancements
**Skills:** `karpathy-guidelines` (`claude plugin install multica-ai/andrej-karpathy-skills`), `verify` / `run` (built-in)
:::

---

## [Implementer Agent — Code Only](/agents/implementer-coder-agent)

Generates production-ready code **without a TDD cycle**. Use this agent when the project has no test suite or when writing tests is explicitly out of scope for the task. Follows the same two-gate workflow as the TDD Implementer (plan approval + implementation approval) but skips all TDD phases, coverage measurement, and test-file generation. Compatible with all platforms.

> **Note:** If your project has a test suite, prefer `implementer-tdd-agent` — TDD catches design issues that pure code generation does not.

::: tip Optional enhancements
**Skills:** `karpathy-guidelines` (`claude plugin install multica-ai/andrej-karpathy-skills`), `verify` / `run` (built-in)
:::

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

::: tip Optional enhancements
**Skills:** `karpathy-guidelines` (`claude plugin install multica-ai/andrej-karpathy-skills`)
:::

### [Teammate Tests](/agents/team/teammate-tests-agent)

Test specialist — generates the full test suite following the RED phase of TDD (failing tests first). Covers happy paths, error cases, edge cases, and integration tests. Target: >80% coverage.

::: tip Optional enhancements
**Skills:** `karpathy-guidelines` (`claude plugin install multica-ai/andrej-karpathy-skills`), `verify` / `run` (built-in), `property-based-testing` (Trail of Bits)  
**MCP:** Chrome DevTools MCP, Playwright MCP  
Install: `claude plugin install trailofbits/skills/property-based-testing`
:::

### [Teammate Backend](/agents/team/teammate-backend-agent)

Backend specialist — implements API routes and business logic exactly per the API contract defined by the Lead. Validates input, calls services, returns responses, and handles errors as specified.

::: tip Optional enhancements
**Skills:** `karpathy-guidelines` (`claude plugin install multica-ai/andrej-karpathy-skills`), `security-review` (built-in), `sharp-edges` (Trail of Bits), `insecure-defaults` (Trail of Bits)  
Install: `claude plugin install trailofbits/skills/sharp-edges trailofbits/skills/insecure-defaults`
:::

### [Teammate Frontend](/agents/team/teammate-frontend-agent)

Frontend specialist — implements UI components and client code that calls the Backend APIs exactly per the API contract. Handles all response and error codes defined in the contract.

::: tip Optional enhancements
**Skills:** `karpathy-guidelines` (`claude plugin install multica-ai/andrej-karpathy-skills`), `verify` / `run` (built-in)  
**MCP:** Chrome DevTools MCP, Playwright MCP
:::

### [Teammate Database](/agents/team/teammate-database-agent)

Database specialist — creates schema migrations and rollback scripts exactly per the database contract. Adds indexes and constraints as specified.

::: tip Optional enhancements
**Skills:** `karpathy-guidelines` (`claude plugin install multica-ai/andrej-karpathy-skills`)  
Note: No generic database MCP available — all database MCPs are vendor-specific.
:::

---

## [Code Reviewer](/agents/code-reviewer-agent)

Checks code quality against standards, verifies pattern compliance, reviews architecture alignment, and suggests improvements before the code reaches test verification.

::: tip Optional enhancements
**Skills:** `code-review` (built-in), `security-review` (built-in), `differential-review` (Trail of Bits), `static-analysis/semgrep` (Trail of Bits), `static-analysis/sarif-parsing` (Trail of Bits), `sharp-edges` (Trail of Bits), `fp-check` (Trail of Bits)  
Install: `claude plugin install trailofbits/skills/differential-review trailofbits/skills/static-analysis trailofbits/skills/sharp-edges trailofbits/skills/fp-check`
:::

---

## [Security Reviewer](/agents/security-reviewer-agent)

Adversarial security review — posture is "how do I break this", not "looks okay". Optional; runs after Code Reviewer when selected. Read-only agent (`tools: Read, Grep, Glob`, `model: opus`).

Covers seven categories: authorization and IDOR (including writes through nested payloads where a PUT on a parent can mutate a child belonging to a different parent), authentication on sensitive endpoints, injection (SQL, command, template, NoSQL), secret handling, data over-exposure in responses, input validation at the server boundary, and dependency risks.

Also includes a mandatory **contract enforcement check**: reads `02-architecture.json` and verifies that ownership constraints defined by the Architect are actually present in the implementation code. Gaps are flagged regardless of direct exploitability.

Output is `04b-security-review.json` with findings ranked by exploitable severity, each with a concrete attack scenario and remediation. Because this agent is read-only, the Orchestrator writes and opens the output file on its behalf.

::: tip Optional enhancements
**Skills:** `security-review` (built-in), `insecure-defaults` (Trail of Bits), `supply-chain-risk-auditor` (Trail of Bits), `variant-analysis` (Trail of Bits)  
Install: `claude plugin install trailofbits/skills/insecure-defaults trailofbits/skills/supply-chain-risk-auditor trailofbits/skills/variant-analysis`
:::

---

## [Test Verifier](/agents/test-verifier-agent)

Verifies test quality, checks that coverage is >80%, validates assertion quality, and ensures edge cases are covered. Blocks progression if test quality is insufficient.

::: tip Optional enhancements
**Skills:** `verify` / `run` (built-in), `property-based-testing` (Trail of Bits), `mutation-testing` (Trail of Bits), `sarif-parsing` (Trail of Bits `static-analysis`), `fp-check` (Trail of Bits)  
**MCP:** Chrome DevTools MCP, Playwright MCP  
Install: `claude plugin install trailofbits/skills/property-based-testing trailofbits/skills/mutation-testing trailofbits/skills/static-analysis trailofbits/skills/fp-check`  
Note: `coverage-analysis` skipped — `testing-handbook-skills` installs 15 skills (AFL++, fuzzing stack, etc.), only 1 needed. Inline coverage check used instead.
:::

---

## [Release Planner](/agents/release-planner-agent)

Plans deployment steps, creates rollback procedures, identifies deployment risks, and generates a deployment checklist ready for production use.

::: tip Optional enhancements
**Skills:** `verify` / `run` (built-in)  
Note: No generic deploy MCP available — all deploy MCPs are vendor-specific (Vercel, Buildkite, etc.).
:::

---

> **Want to copy an agent?** Go to **[Agent Files](/agent-files)** — every agent is embedded as a ready-to-copy code block, kept in sync with the source automatically.

> **Want to customize an agent?** Edit the corresponding file in the `agents/` folder of the repository — each agent is a plain markdown file with instructions you can tailor to your team's patterns.
