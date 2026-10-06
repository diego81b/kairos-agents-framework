# The KAIROS Agents

KAIROS orchestrates a core pipeline of 17 specialized AI agents, plus an optional team of 5 specialists for Team Mode. Two agents run before the main pipeline: Context Extractor, standalone and launched by you, and Impact Assessment, which the Orchestrator dispatches at every run (or reuses when you already ran it yourself). Bug Triage is the entry point when what you have is a defect rather than a feature — run directly by you, or offered by the Orchestrator at its Bug-Input Check and dispatched from there; the numbered core agents run in sequence coordinated by the Orchestrator, which derives which of them run from facts, including an optional Phase 6b (Documentation Agent). Three more agents — Retrospective, Improvement Advisor, and Dependency Audit — are standalone and run after work stops or outside any feature entirely, never invoked by the Orchestrator. Team Mode agents are Claude Code only, offered by the Orchestrator when a test-first change spans two or more layers, and activated only after you confirm the cost.

::: tip Copy agents directly from the documentation
Need the raw agent definition to paste into your tool? Go to **[Agent Files](/agent-files)** — every agent is embedded as a ready-to-copy code block, auto-synced from the source files.
:::

::: warning Contributing — mandatory changelog entry
Every modification to an agent file must be accompanied by an entry in [`CHANGELOG.md`](/changelog). No exceptions.
:::

---

## [Context Extractor](/agents/context-extractor-agent)

Standalone, pre-pipeline — you launch it, the Orchestrator never does. Scans the codebase and an issue draft to produce a structured context file (`00-context.md`) that all downstream agents consume. Run this agent before launching the Orchestrator to give every phase accurate, verified knowledge of your stack, patterns, and conventions — without each agent re-scanning the repository independently.

::: tip Optional enhancements
**Skills:** `deep-research` (built-in)
:::

---

## [Impact Assessment](/agents/impact-assessment-agent)

Pre-pipeline, issue-scoped grounding agent, and a required fact source for the Orchestrator's pipeline derivation. The Orchestrator dispatches it at Step 0e in **Orchestrated mode** (the same shape as Bug Triage) at every run, unless `00b-impact.md` already exists because you ran it yourself — then that file is reused. It answers two questions before any agent is chosen: How big is this? What already exists and what is missing?

Unlike the Context Extractor, which scans the full repository, this agent reads only the code the issue directly touches. It consumes `00-context.md` if already present rather than rescanning. Output is `00b-impact.md` with a T-shirt size (`XS / S / M / L / XL`) and the effort estimate that follows from it (`simple_fix / medium / significant_rework`), domains touched (backend / frontend / db / auth / integrations), whether the project has a test suite, whether a contract changes, what kind of change the issue asks for, reusable assets with real file paths, gaps, and risks.

The size counts production files only (tests, docs, lockfiles and generated files follow a change, they do not size it) and takes the smaller of two adjacent sizes when nothing forces the larger. It measures how much of the codebase the change moves, not hours, and it is a label for people: only the effort decides how thorough each agent is. The Orchestrator puts the size on the issue as a `size:` label once you confirm the Start Gate. It reports facts and never names an agent. The Orchestrator applies its selection rules to those facts and folds this agent's gate into the Start Gate, where you see the derived pipeline and confirm or correct it.

::: tip Optional enhancements
**Skills:** `deep-research` (built-in)
:::

---

## [Bug Triage](/agents/bug-triage-agent)

Standalone entry point from the other direction: a bug report rather than a feature request. Reproduces the defect first — a root cause for a symptom nobody observed is a guess with a citation — then isolates it, states the root cause at `file:line` with an evidence trail, separates it from the contributing factors that let it reach production, and rates severity on observed impact rather than on how hard the fix looks.

Finishes by recommending where the fix re-enters the pipeline: `quick-fix` (local cause, contained fix) sets the run's effort to `simple_fix` unless the impact assessment measured `medium` or more (a triage can raise the effort, never lower it), and `simple_fix` derives the short path with the code-first implementer, `full-pipeline` says the cause is structural and names the phase to start from, `not-a-defect` says the code behaves as designed and the expectation was wrong. Output is `00c-bug-triage.md`.

Two ways in, same artifact. Run it yourself when the bug report arrives before any pipeline does. Or start the Orchestrator with the report: at its Bug-Input Check it recognises a bug report with no triage on disk and offers to run this agent first — accept, and it dispatches it in **Orchestrated mode**, where the agent writes `00c-bug-triage.md` and returns without a gate of its own, and the Orchestrator presents that artifact at its own gate. Alongside Impact Assessment, this is one of the two agents the Orchestrator may dispatch outside the numbered phases, and only from Step 0e: in that mode both skip every gate and question of their own and return the artifact, and the Orchestrator runs the Risk Disposition Loop and presents it, so nothing is lost by running them as subagents.

Never fixes anything. It has `Bash` to reproduce — run a test, read a log, `git blame` — and writes only its own artifact under `.kairos/`.

::: tip Optional enhancements
**Skills:** `deep-research` (built-in)
:::

---

## [Orchestrator](/agents/orchestrator-agent)

Master coordinator — initiates workflow, routes tasks to specialist agents, manages phase transitions, and ensures quality gates are passed before moving forward.

The review wave's three reviewers do not write the ledger themselves: it applies their `## Ledger Update` blocks one after another, so two reviewers never overwrite each other. In Claude Code it also keeps `_usage.md`, the model and tokens of every agent call, rewritten after each agent returns and measured from the transcripts. It also keeps `_tracking.md`, the one file written for you rather than for the agents: current status, blockers, open points, how far the work has moved from the issue's acceptance criteria and scope, and a log of every gate, wave, fix pass and resume. It opens that file once and keeps it current; phase reports open only when you ask, except the implementation plan. It runs Code Reviewer, Security Reviewer and Test Verifier as one review wave with a single gate and a single fix pass.

---

## [PM Agent](/agents/pm-agent)

Analyzes requirements, creates detailed specifications, identifies edge cases, and documents acceptance criteria. Transforms a vague feature request into a precise implementation brief.

When the issue says the work lands in several steps (parts that ship at different times, parts blocked on another branch) or is `XL` with independent parts, it also writes a `## Slices` table: every acceptance criterion belongs to exactly one slice, a later run of the same issue keeps the earlier slices and IDs, and the test verification and the tracking file use the table to show a criterion of an unbuilt slice as `later` instead of as a gap.

::: tip Optional enhancements
**Skills:** `deep-research` (built-in), `issues-generator` (user-installed)
:::

---

## [Architect Agent](/agents/architect-agent)

Designs system architecture, plans database schema, designs API contracts, considers performance implications, and defines error handling patterns.

Writes a single `02-architecture.md`: a YAML frontmatter header (selected option, table/error-code counts) followed by the design doc body — the full data model and API contracts as Markdown tables.

For bug-type inputs that state a reachability or severity claim, it also runs a **Premise Check** before designing: the claim is verified against the actual code, and a refutation surfaces as a `Premise refutation:` risk row — never as a deferrable scope question. The Orchestrator's Risk Disposition Loop gives such rows a dedicated disposition (**Refute premise**) and flips the gate's recommendation to **Stop pipeline**, so a pipeline cannot silently ship a fix for a scenario that cannot occur.

When the change alters what a user of an already-shipped flow can observe, it adds a **Behaviour Delta**: for each affected flow, what the user sees before and after, including on any new rejection or limit, with every new limit recorded as a constraint that names its unit. `N/A` otherwise.

::: tip Optional enhancements
**Skills:** `deep-research` (built-in)  
Note: `trailmark/diagramming-code` skipped — plugin installs 10 skills, only 1 needed. Inline call graph analysis via Read + Grep is used instead.
:::

---

## [Implementer Agent — TDD](/agents/implementer-tdd-agent)

Implements code using **real TDD** (tests written before code). Runs tests iteratively until they pass, applies team coding patterns, and handles error cases explicitly. This is the **default implementer when the project has a test suite** and the change is not a `simple_fix` — the Orchestrator chooses it unless the architecture reports `test_first: no`. Works with Claude Code, API, and local models.

It runs as two Orchestrator invocations. Step 3a produces the implementation plan — `03-implementation-plan.md`, listing files to create and modify, every test case with its declared intent, TDD order and risks — and writes no source file. Step 3b re-invokes the same agent with the approved plan and runs the TDD cycle. The plan is written to disk unconditionally and opened in the editor, so it is reviewable on its own instead of scrolling past RED/GREEN output.

::: tip Optional enhancements
**Skills:** `coding-discipline` (internal), `verify` / `run` (built-in)
:::

---

## [Implementer Agent — Code First](/agents/implementer-coder-agent)

Generates production-ready code **first, then the tests the project calls for** — no RED → GREEN cycle. Its plan carries a `## Test Decision`: where the touched modules already have tests it must extend them, a bug fix gets a regression test that fails without the fix, and a project with no test suite gets no tests plus a stated way the change was verified. Skipping tests anywhere else needs a written reason visible at the plan gate, and it never adds a test framework. Follows the same two-gate, two-invocation workflow as the TDD Implementer (step 3a plan approval, step 3b implementation approval). Compatible with all platforms.

The Orchestrator chooses it, right before the plan, for a `simple_fix`, for a project with no test suite, and when the architecture reports `test_first: no`; Test Verifier runs whenever it wrote a test.

::: tip Optional enhancements
**Skills:** `coding-discipline` (internal), `verify` / `run` (built-in)
:::

---

## Implementer Team — Team Mode (Claude Code only, optional)

For complex multi-layer features, the Orchestrator can activate a coordinated team of specialists instead of the single Implementer Agent. It **offers** Team Mode when the TDD path was chosen, two or more of backend/frontend/db are touched, Agent Teams is enabled and the host is Claude Code — and shows a cost warning (~$0.242 vs ~$0.068) that you must confirm before proceeding.

**Why Claude Code only?** Team Mode uses Claude Code's **experimental Agent Teams feature** (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, requires v2.1.32+). Each teammate runs as a separate Claude Code session with its own context window; teammates communicate peer-to-peer via a shared mailbox and coordinate via a shared task list. Other tools (Cursor, VS Code, JetBrains, Codex CLI) have no equivalent inter-session coordination mechanism.

The [Implementer Lead](/agents/team/implementer-lead-agent) acts as coordinator (not a coder). It creates binding contracts (API, database, test, pattern) and spawns parallel teammates — Tests always, plus Backend, Frontend and Database only for the layers in scope:

### [Implementer Lead](/agents/team/implementer-lead-agent)

Team coordinator — applies the full TDD discipline across specialized teammates. Defines four binding contracts (API, database, test, pattern) before anyone starts. Then orchestrates three distinct phases:

- **RED** — spawns `teammate-tests-agent` first; tests are written against the contracts before any implementation exists. Presents the test plan to the user (HITL gate) before proceeding.
- **GREEN** — spawns `teammate-backend-agent`, `teammate-frontend-agent`, `teammate-database-agent` in parallel; their goal is to make the pre-existing tests pass.
- **REFACTOR** — coordinates quality improvements across all layers while keeping tests green.

Monitors contract compliance throughout, flags mismatches, and aggregates the final output. Does not write code itself.

::: tip Optional enhancements
**Skills:** `coding-discipline` (internal)
:::

### [Teammate Tests](/agents/team/teammate-tests-agent)

Test specialist — generates the full test suite following the RED phase of TDD (failing tests first). Covers happy paths, error cases, edge cases, and integration tests. Target: >80% coverage.

::: tip Optional enhancements
**Skills:** `coding-discipline` (internal), `verify` / `run` (built-in)  
**MCP:** Chrome DevTools MCP, Playwright MCP
:::

### [Teammate Backend](/agents/team/teammate-backend-agent)

Backend specialist — implements API routes and business logic exactly per the API contract defined by the Lead. Validates input, calls services, returns responses, and handles errors as specified.

::: tip Optional enhancements
**Skills:** `coding-discipline` (internal), `security-review` (built-in)
:::

### [Teammate Frontend](/agents/team/teammate-frontend-agent)

Frontend specialist — implements UI components and client code that calls the Backend APIs exactly per the API contract. Handles all response and error codes defined in the contract.

::: tip Optional enhancements
**Skills:** `coding-discipline` (internal), `verify` / `run` (built-in)  
**MCP:** Chrome DevTools MCP, Playwright MCP
:::

### [Teammate Database](/agents/team/teammate-database-agent)

Database specialist — creates schema migrations and rollback scripts exactly per the database contract. Adds indexes and constraints as specified.

::: tip Optional enhancements
**Skills:** `coding-discipline` (internal)  
Note: No generic database MCP available — all database MCPs are vendor-specific.
:::

---

## [Code Reviewer](/agents/code-reviewer-agent)

Checks code quality against standards, verifies pattern compliance, reviews architecture alignment, and suggests improvements. Runs in the review wave alongside Security Reviewer and Test Verifier; inside the wave it leaves test execution to Test Verifier. A defect it finds on lines the change did not introduce is marked `Pre-existing:`: it still reaches you at the gate, but never drives an automatic retry.

::: tip Optional enhancements
**Skills:** `code-review` (built-in), `security-review` (built-in), `coding-discipline` (internal, backs the Simplicity check)
:::

---

## [Security Reviewer](/agents/security-reviewer-agent)

Adversarial security review — posture is "how do I break this", not "looks okay". Optional; runs in the review wave, alongside Code Reviewer and Test Verifier, when the Orchestrator derives it at the implementation gate (or you add it there). Its findings never trigger an automatic retry: they reach the implementer only through your decision at the gate. Read-only agent (`tools: Read, Grep, Glob, AskUserQuestion`, `model: opus`).

Covers seven categories: authorization and IDOR (including writes through nested payloads where a PUT on a parent can mutate a child belonging to a different parent), authentication on sensitive endpoints, injection (SQL, command, template, NoSQL), secret handling, data over-exposure in responses, input validation at the server boundary, and dependency risks.

Also includes a mandatory **contract enforcement check**: reads `02-architecture.md` and verifies that ownership constraints defined by the Architect are actually present in the implementation code. Gaps are flagged regardless of direct exploitability.

Output is a single `04b-security-review.md`: frontmatter (status, finding counts) plus the full findings table — each ranked by exploitable severity, with a concrete attack scenario and remediation. Because this agent is read-only, the Orchestrator writes the file on its behalf.

::: tip Optional enhancements
**Skills:** `security-review` (built-in)
:::

---

## [Test Verifier](/agents/test-verifier-agent)

Verifies test quality, checks that coverage is >80%, validates assertion quality, and ensures edge cases are covered. Blocks progression if test quality is insufficient. Runs in the review wave and is the only reviewer there that executes the test suite. Reads the architecture's Behaviour Delta, when there is one, to check that the new user-visible behaviour on shipped flows is actually tested.

::: tip Optional enhancements
**Skills:** `verify` / `run` (built-in)  
**MCP:** Chrome DevTools MCP, Playwright MCP  
Note: `coverage-analysis` skipped — `testing-handbook-skills` installs 15 skills (AFL++, fuzzing stack, etc.), only 1 needed. Inline coverage check used instead.
:::

---

## [QA Plan Agent](/agents/qa-plan-agent)

Optional Phase 5b. Plans the verification the automated suite cannot give: manual and exploratory test cases, regression retest selection, test data and environment needs, and UAT sign-off criteria. Every row traces to an acceptance criterion, an uncovered line from Test Verifier, the bug triage's reproduction, or a `file:line` caller found in the code — it never invents scenarios from the feature request. It writes for two readers: the gate gets the evidence, the tester gets product language only, opening with a `## Core` block that names what the change fixes and the cases that prove it, so the plan leads with what matters instead of listing every automation residue at the same weight. Each manual case carries a `Setup` cell — the applications, configuration, concurrent sessions, machines and roles the case needs — which is exactly what an acceptance criterion cannot carry without becoming unreadable. It is also the only writer of `.kairos/_qa-regression.md`, the project-wide catalogue of manual cases: it appends the reusable ones it wrote, retires those this change automated or removed, and at the next feature selects the existing `QA-n` cases whose area the change touched — the manual half of regression testing, which grepping callers cannot find. A tester is never sent to the developer's tools: no dev tools, scripts or hand edits to the database, because a case that needs them is either staged by a developer, named in `Setup`, or written up as a risk. The plan reaches the tester through the issue tracker, after you approve it, so nobody has to go looking in `.kairos/`. Up to 3 checks and no epic, an extract of the plan is the comment; above that, or with an epic, the tester's part is a Markdown file in the repository (directory stored in `.kairos/.qa-dir`) and the comment points to it. With an epic, every issue of that epic writes its own section into one cumulative file and the comment goes on the epic. The `AC-n` list in the issue stays the developer's to satisfy, and this plan is the manual half beside it.

---

## [Release Planner](/agents/release-planner-agent)

Plans deployment steps, creates rollback procedures, identifies deployment risks, and generates a deployment checklist ready for production use.

::: tip Optional enhancements
**Skills:** `verify` / `run` (built-in)  
Note: No generic deploy MCP available — all deploy MCPs are vendor-specific (Vercel, Buildkite, etc.).
:::

---

## [Documentation Agent](/agents/documentation-agent)

Optional Phase 6b, runs after Release Planner. Writes feature-facing documentation in the **target project** — README updates, API reference entries, a CHANGELOG entry, migration notes for breaking changes — matching whatever doc conventions the project already has. The second agent in the framework, after the Phase 3 implementer, permitted to write real files outside `.kairos/`; scoped strictly to documentation, never source code. The Orchestrator also uses it for two verbatim writes, the project summary at the end of a run and the QA plan file: the Orchestrator runs the gate itself, and only an approved draft is handed over, so the agent checks the target is a documentation file and writes it.

Run by the Orchestrator it works in two calls, like the implementer: a draft that writes only `06b-documentation.md`, and, after you approve it at the Orchestrator's gate, a write that applies the approved text to the documentation files. Output is `06b-documentation.md`: a Docs Touched table plus the drafted content, and a Documentation Gaps table (same 5-column shape as every other Risks/Findings table) for anything it can't confidently write without inventing details.

---

## [Retrospective Agent](/agents/retrospective-agent)

Standalone, post-pipeline. Run any time after work on a feature stops — not necessarily after Release Planning; a `simple_fix` that skipped Phase 6 still has lessons worth capturing. Reads everything already on disk for that one feature (its phase artifacts and ledger) and distills 3–8 lessons, split Diataxis-style into **Why This Happened** (root cause) and **What To Do Differently** (actionable). Appends one dated entry to the project-root `.kairos/_lessons.md` — the only write in the framework that targets a path outside the current feature folder.

If the project gitignores `.kairos/` (the Orchestrator's Step 0c recommends it), `_lessons.md` would never reach git history — so after approval the agent offers to also append the same condensed entry to a durable in-project copy, discovered from the project's own docs (`README.md`/`CLAUDE.md`/`docs/`) or chosen by you. `.kairos/_lessons.md` remains the canonical store that agents read; the durable copy is append-only project documentation, mirroring the Orchestrator's Step 10d escape hatch for `_recap.md`.

::: tip Optional enhancements
**Skills:** `deep-research` (built-in)
:::

---

## [Improvement Advisor](/agents/improvement-advisor-agent)

Standalone and infrequent — run every few features, not every run. Reads the accumulated `.kairos/_lessons.md` across all past features and looks for friction confirmed in 3 or more of them. For each confirmed pattern, drafts a new `.kairos/decisions/ADR-*.md` (`Status: Proposed`) proposing a concrete framework change, and refreshes `_lessons.md`'s curated `Recurring Patterns` table (capped at 10 rows — the only section the Orchestrator injects into every subagent prompt).

Never edits `agents/*.md`, `.opencode/`, `.kimi-code/`, or `docs/` itself — every ADR is a proposal a human applies by hand, the same "never self-implement" principle the Orchestrator follows for source code, applied here to the framework's own definition files.

---

## [Dependency Audit](/agents/dependency-audit-agent)

Standalone and periodic — run it every few months, outside any feature. Surveys the whole project's dependency surface and accumulated debt: known CVEs (with a judgment on whether the vulnerable path is actually reachable from this project, which the tooling cannot tell you), how far behind each direct dependency is and what kind of gap it is, license conflicts, packages declared but never imported, the same library resolved at several versions, and the small number of code areas where debt has genuinely accumulated.

Output is a prioritized backlog at the project-root `.kairos/_tech-debt.md`, overwritten on each run as a current-state snapshot. Each row is a candidate for one pipeline run, which a human starts.

Applies nothing — no upgrade, no lockfile regeneration, no package removal. Its boundary with the Security Reviewer runs both ways: that agent's Dependency Risks check covers what a single change introduces or bumps, inside a feature's review; this one covers the whole project, on demand.

::: tip Optional enhancements
**Skills:** `deep-research` (built-in)
:::

---

> **Want to copy an agent?** Go to **[Agent Files](/agent-files)** — every agent is embedded as a ready-to-copy code block, kept in sync with the source automatically.

> **Want to customize an agent?** Edit the corresponding file in the `agents/` folder of the repository — each agent is a plain markdown file with instructions you can tailor to your team's patterns.
