# Development Workflow

KAIROS is a **Human-in-the-Loop (HITL)** pipeline. Every phase produces a concrete artifact that the user validates before the next phase begins, except three gates that continue on their own when nothing needs a decision (see [Gates that continue on their own](#gates-that-continue-on-their-own)). The AI does the work; the human controls the gate.

::: warning Gates only work if the orchestrator is your primary agent
Every gate below is an interactive `AskUserQuestion` prompt — **but only when the orchestrator runs as the session's primary agent** (`claude --agent orchestrator-agent`, started at launch). Typing `@orchestrator-agent` or "use the orchestrator" inside an already-open chat dispatches it as a subagent instead, which unconditionally loses `AskUserQuestion` — every gate below silently degrades to a text menu, and the orchestrator dies if the parent session ends mid-pipeline. See [Claude Code setup](/setup/claude-code#step-3-start-a-kairos-session) for the full explanation.
:::

**The pipeline, phase by phase:**

| Phase | Agent | Produces | Gate |
|---|---|---|---|
| 0 | Orchestrator + Impact Assessment (+ optional Context Extractor) | `00b-impact.md` + derived pipeline | Start gate |
| 1 | PM Agent | `01-requirements.md` | ✅ / ✏️ / ⏭️ / ⛔ |
| 2 | Architect Agent | `02-architecture.md` | ✅ / ✏️ / ⏭️ / ⛔ |
| 3 | Implementer (test-first, code-first, or Team Mode) | Code + `03-implementation.md` | Plan gate, then ✅ / ✏️ / ⏭️ / ⛔ |
| 4 | Code Reviewer (review wave) | `04-review.md` | one combined review gate ✅ / ✏️ / ⏭️ / ⛔ |
| 4b | Security Reviewer *(optional, review wave)* | `04b-security-review.md` | same gate |
| 5 | Test Verifier (review wave) | `05-test-verification.md` | same gate |
| 5b | QA Plan Agent *(optional)* | `05b-qa-plan.md` | ✅ / ✏️ / ⏭️ / ⛔ |
| 6 | Release Planner | `06-deployment-plan.md` | ✅ / ✏️ / ⛔ |
| 6b | Documentation Agent *(optional)* | `06b-documentation.md`, then the documentation files | ✅ / ✏️ / ⛔ |

Phases 4, 4b and 5 run together as one **review wave**: the active reviewers read the same code, in parallel where the host allows it, and you answer one gate for all three (see [Review Wave](#review-wave-phases-4-4b-and-5)).

Phase 3 routes to one of three paths, chosen from the design's facts right before the plan: the TDD Implementer (plan gate, then RED → GREEN → REFACTOR), the code-first Implementer (plan gate, then code and the tests the project calls for), or Team Mode (Claude Code only, offered with its cost when the TDD path spans two or more layers) where an Implementer Lead defines binding contracts and spawns Tests / Backend / Frontend / Database teammates in parallel before aggregating their output.

Each HITL checkpoint is an interactive prompt (Claude Code's `AskUserQuestion` tool), not a text menu to reply to. Before it, if the phase's output has a Risks/Issues/Findings table with any row left undispositioned, the **Risk Disposition Loop** walks through those rows first — one at a time (or up to 4 per prompt), with **Accept / Mitigate now / Escalate / Defer** — instead of forcing an approve-or-reject on the whole table at once. Only once every row has a disposition does the whole-artifact gate below appear; it marks one option as recommended based on the phase's own status (an unresolved Escalate biases it toward Request changes), and always leaves a free-text option for detailed feedback:
- ✅ **Approve** — continue to the next active agent
- ✏️ **Request changes** — agent revises and re-presents
- ⏭️ **Skip next** — approve this output, jump past the next active agent
- ⛔ **Stop** — abort the pipeline

Only derived (or explicitly added) agents run. Order is never changed.

### Gates that continue on their own

A gate with nothing to decide costs a round trip, and in real runs most of them resolved as a bare **Approve**. Three gates therefore continue without asking, under one rule: the Orchestrator runs every check it would run at the gate, and asks you only when one of them turns something up.

| Gate | Continues when |
|---|---|
| Bug triage | the bug reproduced, its root cause was found, the triage does not call it `not-a-defect`, and the issue is not an older checklist template (the Start Gate comes next and shows the whole pipeline) |
| Requirements (Phase 1) | effort is `simple_fix` or `medium`, and the analysis left no open question, no scope change and no blocking constraint, and the Risk Disposition Loop had nothing to ask you |
| Implementation (Phase 3, last wave) | effort is `simple_fix` or `medium`, and the Risk Disposition Loop had nothing to ask you, no constraint was added, the tests pass, the artifact is valid, no file falls outside the plan and a reviewer is active next. The review wave is the check that follows |

When one continues, the Orchestrator prints one line naming what runs next and the rows it accepted for you (`low`, and `medium` in a `simple_fix`), and logs it in `_tracking.md`. A `significant_rework` run keeps every gate after the triage (the effort is not known yet at the triage gate, and the Start Gate follows it). Reply `every gate` at the start gate, or set `phase_gates: every_gate` in `ledger/run.md`, to be asked at all of them.

These always ask. The architecture, because it holds decisions. The implementation plan, because it is the last gate before source files change. The combined review gate (and a recheck that turns up a `medium` row, as before), because that is where you changed decisions in real runs (a `low` row promoted to **Mitigate now**), which no signal can predict. The QA plan, release plan and documentation draft, because they post to the tracker or write outside `.kairos/`. Continuing saves the minutes you spend answering, not the time the agents take or the days a gate sits unanswered.

### Artifact Format — Markdown + Frontmatter

Every phase writes a single Markdown file: a small YAML frontmatter header carrying only what the orchestrator branches on — a verdict, the tallies its status rules threshold, a loop signal where a loop exists — followed by the report body (data model tables, issues lists, findings, runbooks — what the human actually reads at the gate). Every body opens with the same five-line `## Summary` block — **What / Decision / Needs your attention / Open / Next** — so a gate is readable in seconds without scrolling the whole artifact. `Open` carries the `ledger/open-questions.md` IDs of the questions that phase left unanswered, which is what keeps an open point from being buried in a paragraph nobody rereads; the Orchestrator prints that block verbatim at the checkpoint rather than writing its own version of it, adds two counts of its own (rows dispositioned, and questions still open across *every* phase — a cross-check against what this one artifact claims), names the artifact path, and opens the full file only if you ask — the detail underneath is the next agent's prompt input, and putting all of it in front of you every phase is what turns a gate into a document review. Nothing in this pipeline parses these files with real code — every consumer is either the next agent reading it as prompt text or a human at a gate — so a full schema or a long issues list is plain Markdown, not JSON: unreadable as nested JSON, but a table that scans in seconds. Any Risks/Issues/Findings table carries a `Disposition` column, left empty by the agent and filled in by the Risk Disposition Loop above.

---

## Phase 0: Prep & Pipeline Derivation

**Pre-pipeline (optional, standalone — you launch it yourself):**
- Run `context-extractor-agent` first to produce `00-context.md` (full-repo scan — stack, patterns, conventions). Launch it as the session's **primary agent**, the same way you launch the Orchestrator — see your host's [setup page](/setup/). Naming it with `@` inside an already-open chat dispatches it as a subagent, and a subagent has no `AskUserQuestion`: its confirmation gate degrades to the text-menu fallback.

**Pipeline start:**
- Developer provides a natural-language feature request (with optional issue reference)
- Orchestrator loads `00-context.md`, `00b-impact.md`, and `00c-bug-triage.md` if present. A triage on disk is attached to every later subagent prompt
- **Bug-Input Check**: if the input reads as a bug report — a symptom against an expectation, a stack trace, reproduction steps, "this used to work" — and no `00c-bug-triage.md` exists, the Orchestrator offers to run `bug-triage-agent` first. On accept it dispatches it with `mode: orchestrated`: the agent reproduces, finds the root cause, writes `00c-bug-triage.md`, and returns without a gate of its own, which the Orchestrator then presents as it would any phase artifact
- **Impact Grounding**: unless `00b-impact.md` already exists or the issue carries a checklist template, the Orchestrator dispatches `impact-assessment-agent` with `mode: orchestrated`. It reads the issue and the code it touches and reports facts, never agent names: size and effort, domains touched, whether the project has a test suite, whether a contract changes, whether the issue asks for code at all. The Orchestrator writes `00b-impact.md` and resolves its Risks table row by row
- **Derivation**: the Orchestrator applies one rule table to those facts (see [Pipeline Templates](/setup/templates#how-the-pipeline-is-derived)). At this point it decides `pm-agent`, `architect-agent`, whether an implementer runs and `code-reviewer-agent`. The implementer itself is chosen right before the plan; the review agents at the implementation gate; QA plan, release planning and documentation at the review gate. A triage's `recommended_entry` can raise the impact assessment's effort, because it comes from a reproduction, but never lowers it: a `quick-fix` against a `medium` or larger measurement keeps that measurement and the start gate says so
- **Manual QA setting** (once per project): the first run asks whether a person verifies features by hand in this project, and stores the answer in `.kairos/.manual-qa`. It is the one input to the QA plan rule that no code can supply
- **QA directory setting** (once per project, only when a QA plan needs a file): asked before the QA plan runs when the issue belongs to an epic (the plan has to read the epic's existing file), and at the QA gate otherwise, when the plan turned out to need one. The answer is stored in `.kairos/.qa-dir`. The Orchestrator proposes `docs/qa-plans/` and accepts any other path inside the project; the file is never written before you have approved the plan
- **Model settings** (optional, Claude Code): a `.kairos/.models` file, written by `/kairos:setup`, holds one `<agent>: <alias>` line per agent. The Orchestrator reads it before each dispatch and passes the alias as the call's model, which outranks the agent's own `model:`; without the file every agent runs on its shipped model. It covers only the agents the Orchestrator dispatches, see [Customizing models](/setup/claude-code#customizing-models)
- **Start gate**: the Orchestrator shows the derived pipeline, the rule behind each agent, the size, the effort and auto-fix budget, the model lines from `.kairos/.models` when there are any, and, when it ran this time, the impact assessment's `## Summary`. One question: start, re-run the impact assessment with your feedback, or stop. A free-text reply is a correction (`effort medium`, `skip release-planner`, `add security-reviewer`, `only analysis`, `every wave`, `every gate`), applied and stored in `ledger/run.md` as an override. **Effort is stamped into every subagent's invocation prompt**, so each agent enters Lean, Trimmed, or Full mode from a value you saw. `simple_fix` also sets the auto-fix budget to 1, widens the Risk Disposition Loop's auto-accept threshold to `medium`, and merges the plan and implementation into one step; `medium` sets the budget to 1; `significant_rework` asks for it
- The issue is read first, before the folder is named, and the Orchestrator says what it found (`## KAIROS Pipeline found: override block (...)`, no section, or a warning when the issue could not be read). A `## KAIROS Pipeline` section is a decision you already made, so the run **starts without asking**: the Orchestrator prints the pipeline it is about to run and goes on. It still asks when something is not a decision you have seen (the issue could not be read, an unresolved escalation, an unknown fact that gates an agent, the architect skipped against its rule, an empty pipeline). An override block (`Size:`, `Effort:`, `Epic:`, `Areas:`, `Auto-fix:`, `Skip:`, `Add:`) is applied on top of the derivation. An older checklist wins over it: the checked agents run and the impact assessment is not started; say `derive` in your prompt to ignore it
- **Areas**: before the facts are gathered, one question, `All areas` (the default) or `Choose areas`, limits the run to some of the four areas: analysis, development, review, delivery. An `Areas:` line in the issue answers it. Inside the chosen areas the rules still derive each agent, and the start gate shows the areas that are not selected as one line. Run the same issue again later and the Orchestrator offers the remaining areas (see [Areas](/setup/templates#areas))
- **One issue, one folder.** A folder is found by the issue reference, not by the slug (a reworded prompt for the same issue lands in the same folder), and a second folder is never offered for an issue, because it would split the ledger into two copies that drift apart. A large issue built slice by slice is one run per slice in that folder: on a finished run choose **Start a new run**, and the Orchestrator archives the finished run's reports under `runs/run-<k>/` (with a snapshot of its tracking file and settings), keeps the ledger and the triage, rebuilds the impact assessment for the new slice and tells every agent where the earlier runs are. The tracking file stays one file, with a `new run` line in its log. A folder with only a context, impact or triage file is reused, not resumed. A run left `in_progress` or `stopped` resumes **without questions** and says where it restarts; the one thing it never skips is a gate the earlier session had open, which is shown again
- If the invocation prompt already dictates an agent list, the Orchestrator shows it at the start gate as a proposal and applies it only if you say so
- The Orchestrator saves the run's settings to `ledger/run.md` and creates `_tracking.md`, the one file it keeps open in your editor for the rest of the run (see [Tracking File](#tracking-file))
- **Size label** (only when the run started from an issue and you confirmed the start gate): the Orchestrator sets a `size:<XS|S|M|L|XL>` label on the issue, replacing an earlier `size:` label, so the tracker can group an epic's issues by size. Skipped without a message where there is no tracker CLI or no labels. See [Pipeline Templates](/setup/templates#size)
- **Issue write-back** (only when the run started from an issue and you corrected something at the start gate): the Orchestrator offers to save the correction to the issue as an override block, never touching the rest of the description. On Jira, or with no tracker CLI, it prints a paste-ready block instead. See [Pipeline Templates](/setup/templates#saving-corrections-to-the-issue)

_Input: free-text feature request + optional issue reference + optional `00-context.md`_
_Output: `00b-impact.md`, the agents decided so far, `feature_folder` path_

::: tip Derived, then corrected
No menu: each agent runs because a rule fired on a fact, and the gate before it says which. Correct any decision at that gate; the correction holds for the rest of the run. Use [Pipeline Templates](/setup/templates) to store corrections in your issue tracker.
:::

::: tip Quick fix keeps the tests the project has
`simple_fix` routes to `implementer-coder-agent`, which is code-first: it writes the fix, then extends the tests of the modules it touched when the project has them, and `test-verifier-agent` runs whenever it wrote a test. Skipping tests needs a written reason in the plan.
:::

---

## Phase 1: Requirements Analysis (PM Agent)

- Break down the feature into scope, constraints, and risks
- Identify edge cases and integration points
- Define acceptance criteria — trigger and observable outcome, verifiable by the developer in their own environment; the setup a heavier check needs is Phase 5b's, and the criterion still keeps its `AC-n`

_Input: feature description + project context_
_Output: a single Markdown file — frontmatter (status, counts) + body (scope, constraints, risks, success criteria) — see "Artifact Format" above_
_Saved to: `.kairos/<feature_folder>/01-requirements.md`_

::: info HITL checkpoint
User reviews requirements, constraints and risks before any design work begins. Presented via `AskUserQuestion`, not a printed menu.

`✅ Approve` · `✏️ Request changes` · `⏭️ Skip next` · `⛔ Stop`
:::

---

## Phase 2: System Design (Architect Agent)

- Propose 3 design options, recommend one
- Design database schema and API contracts
- Define error handling and integration patterns
- **Behaviour Delta** — only when the change alters what a user of an already-shipped flow can observe (`N/A` otherwise): for each affected flow, what the user sees before and after, including on any new rejection or limit, and every new limit recorded as a constraint with its unit named ("400 lock keys per request, about 200 rows at 2 keys per row"). Test Verifier and QA Plan read it as input. It exists because the late findings in real runs were all of this kind: a rejection the operator never saw, a cap answered in rows but enforced in keys

_Input: `01-requirements.md`_
_Output: a single Markdown file — frontmatter (selected option, table/error-code counts) + design doc body (full data model, API contracts, tech choices) — see "Artifact Format" above_
_Saved to: `.kairos/<feature_folder>/02-architecture.md`_

::: info HITL checkpoint
User reviews the selected design option and API contracts (in `02-architecture.md`) before any code is written. Presented via `AskUserQuestion`, not a printed menu.

`✅ Approve` · `✏️ Request changes` · `⏭️ Skip next` · `⛔ Stop`
:::

---

## Phase 3: Implementation

Right before the plan, the Orchestrator chooses the implementer from facts and prints the rule that chose it: no test suite or `simple_fix` → the code-first `implementer-coder-agent`; otherwise the architecture's `test_first` fact (`yes` → `implementer-tdd-agent`, `no` → the coder), and without an architecture a project with a test suite gets TDD. On the TDD path, Team Mode is offered when two or more of backend/frontend/db are touched, Agent Teams is enabled and the host is Claude Code.

### Default: Implementer Agent

Works everywhere (Claude Code, API, local models). Recommended for all features.

This phase has **two HITL checkpoints** — a plan gate before any file is written, and a code gate after TDD is complete. Each checkpoint ends one Orchestrator invocation of the implementer and starts the next: the plan gate is not a pause inside a single run, it is the boundary between step 3a and step 3b.

**Step 3a — Implementation Plan (no files written yet)**
- Analyse existing codebase patterns via `grep`
- Output structured plan: files to create/modify, full test case list, TDD order, dependencies, risks
- Write the plan to `.kairos/<feature_folder>/03-implementation-plan.md` and stop — no source file is touched

**Step 3b — TDD Cycle (after plan approval)**
- Same implementer, re-invoked with the approved plan; PHASE 0 is skipped, not repeated
- Write tests FIRST (RED phase)
- Implement code to pass tests (GREEN phase)
- Refactor and verify coverage >80%

_Input: `02-architecture.md` + project profile_
_Output: implementation plan → (approval) → code files + test files + coverage report_
_Saved to: `.kairos/<feature_folder>/03-implementation-plan.md`, then project paths + `.kairos/<feature_folder>/03-implementation.md`_

::: tip One artifact per feature, not per pass
The implementer is re-invoked on the same implementation for three different reasons: a planned wave from a multi-wave plan, a review loop iteration driven by code-reviewer or test-verifier findings, and a fix pass or manual re-run after you answered a gate. All three append to the **same** `03-implementation.md`: a `## Pass Log` records why each pass ran, and `## Files Written` is the union across all of them, each row naming the pass that last touched it. Loop iterations are additionally archived as `03-implementation-iter{N}.md`, but those are a per-iteration trail — the base file stays the cumulative record.

This matters because three readers treat that table as everything the feature shipped: `code-reviewer-agent` picks what to review from it, `release-planner-agent`'s Scope Coverage Check traces each in-scope item to it, and `_tracking.md` publishes it as Files Changed. A per-pass table made all three under-report with no error anywhere.
:::

::: info HITL checkpoint — Plan gate
User reviews the implementation plan (files, test cases, approach) **before any code is written**. Reject at zero cost.

The plan is a first-class artifact like every other phase output: written to disk unconditionally, opened in the editor (the one gate that still opens its artifact automatically, because it is the last one before source files change), and gated by the Orchestrator — never buried in the implementer's own transcript. Its `Risks` table goes through the same row-by-row Risk Disposition Loop as any other phase. Presented via `AskUserQuestion`, not a printed menu.

`✅ Approve plan` · `✏️ Revise plan` · `⏭️ Skip next` · `⛔ Stop`
:::

::: tip Waves continue on their own unless something needs you
A large plan is split into waves, and each wave ends with `status: partial`. The Orchestrator still checks every wave the way it checks a gate: the artifact contract, the ledger, and the files the wave touched against the plan's file lists. It stops and asks you only when one of those checks turns something up: a new risk rated `medium` or above, a new constraint, a failing test, a file outside the plan, an Escalate, or a malformed artifact. Otherwise it writes one line to `_tracking.md`'s log and starts the next wave. Setting `wave_gates: every_wave` in `ledger/run.md`, or saying so at the start gate, restores a gate after every wave. The last wave's gate follows the rule in [Gates that continue on their own](#gates-that-continue-on-their-own).
:::

::: info HITL checkpoint — Code gate
User reviews generated code and test coverage before the review phase. Presented via `AskUserQuestion`, not a printed menu.

`✅ Approve` · `✏️ Request changes` · `⏭️ Skip next` · `⛔ Stop`
:::

### Team Mode: Implementer Lead + 4 Teammates (Claude Code only, optional)

Offered only when its rule holds (TDD path, two or more of backend/frontend/db touched, Agent Teams enabled, Claude Code). The Orchestrator shows a cost warning (~$0.068 single vs ~$0.242 team) and waits for confirmation before proceeding.

**How it works — TDD across a team:**

The Lead applies the same RED → GREEN → REFACTOR discipline as the single agent, and splits across the same two Orchestrator invocations (3a plan, 3b execution), but distributes the work across specialists:

1. **Step 3a — Lead** analyzes Architect output, scopes the layers in play, and defines four binding contracts (API, database, test, pattern) before any teammate starts. It writes `03-contracts.md` and `03-implementation-plan.md`, then stops. No teammate is spawned yet.
2. **HITL — Plan gate** — Orchestrator-owned, same gate as the single agent. The plan carries the layer scoping and the Test Contract's full test-case list, so approving it approves the test plan too.
3. **Step 3b — RED phase** — Lead is re-invoked, reads the approved contracts back from `03-contracts.md`, and spawns `teammate-tests-agent` first. Tests are written against the contracts before any implementation exists. All tests fail — this is correct and expected.
4. **GREEN phase** — Lead spawns `teammate-backend-agent`, `teammate-frontend-agent`, `teammate-database-agent` in parallel. Their goal is to make the pre-existing tests pass.
5. **REFACTOR phase** — Lead coordinates quality improvements across all layers while keeping tests green.
6. **Lead** monitors contract compliance throughout, flags mismatches, and aggregates the final output.

The Lead's own mid-run Test Plan Gate (between RED and GREEN) still exists, but only on a standalone run. Under the Orchestrator it is skipped: a spawned subagent cannot reach the human, so that gate could never actually be answered, and the 3a plan gate covers the same ground before any cost is incurred. Test quality itself is re-checked in Phase 5.

_Input: `02-architecture.md` + project profile_
_Output: contracts + implementation plan → (approval) → all layer files + contract compliance report + coverage report_
_Saved to: `.kairos/<feature_folder>/03-contracts.md` + `03-implementation-plan.md`, then project paths + `.kairos/<feature_folder>/03-implementation.md`_

::: warning Team Mode — Claude Code only (experimental)
Team Mode requires **Claude Code's experimental Agent Teams feature**. Enable it by setting `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `.claude/settings.json`. Requires Claude Code v2.1.32+.

Unlike the single Implementer Agent (which uses the `agent` tool for direct subagent spawning), Agent Teams run each teammate as a **separate Claude Code session** with its own context window. Teammates communicate peer-to-peer via a shared mailbox and coordinate via a shared task list — not just reporting back to the lead.

| Tool | Agent Teams support | Team Mode |
| --- | --- | --- |
| **Claude Code v2.1.32+** | Experimental Agent Teams — separate sessions, peer messaging | ✅ |
| **Cursor** | No inter-session coordination | ❌ |
| **VS Code Copilot** | No inter-session coordination | ❌ |
| **JetBrains / Codex CLI / others** | No inter-session coordination | ❌ |

Use the single Implementer Agent in all non-Claude Code environments.
:::

::: tip When is Team Mode worth it?
Team Mode eliminates frontend/backend contract mismatches through binding contracts. It's worth the extra cost only for critical systems where perfect layer alignment cannot be verified manually. For the vast majority of features, the single agent is sufficient.
:::

---

## Review Wave (Phases 4, 4b and 5)

Code review, security review and test verification all read the same finished code, and none of them writes source. So once the code gate is approved, the Orchestrator starts every active reviewer at once, in parallel where the host supports it, one after another where it does not. Each still writes its own report (`04-review.md`, `04b-security-review.md`, `05-test-verification.md`); what changes is how you answer them.

- **One gate for the wave.** You see the three `## Summary` blocks together, the Risk Disposition Loop walks the rows of all three tables, and one decision closes the wave.
- **One fix pass.** Every row you mark **Mitigate now**, across all three reports, plus any change you ask for, goes to the implementer as a single pass, followed by one recheck scoped to that fix. The recheck runs only the reviewers the fix calls for: Code Reviewer when it touched non-test code, Test Verifier when it touched tests or fixed a test-verification finding, Security Reviewer when it fixed a security finding or touched a file that review cited. Each skip is logged in `_tracking.md`, and a clean recheck continues without a gate. Older versions ran a fix pass and a recheck after each review phase.
- **One loop.** If you gave the run an auto-fix budget, the Orchestrator retries on its own while code review or test verification reports a `critical`/`high` issue or an acceptance-criteria gap, then runs every reviewer one last time before the gate. Security findings never trigger an automatic retry; they wait for you. See [Agentic Loop](/agentic-loop).
- **Who runs the tests.** Inside a wave only Test Verifier executes the test suite; Code Reviewer keeps its static checks and lint, so the two never build into the same output at the same moment. Findings both reviewers raise on the same line are merged by the Orchestrator.

- **Who writes the ledger.** Inside a wave none of the three reviewers writes `constraints.md`, `decisions.md` or `open-questions.md`. Each ends its own report with a `## Ledger Update` block, and the Orchestrator applies the three blocks one after another once all have returned, allocating the new ids itself and keeping a row `🔴 open` when two reviewers disagree about it. Two agents that read the same row and write it back in the same minute would otherwise overwrite each other. Parallelism costs nothing here: the slow work (reading code, running tests) stays parallel, and the write is a few seconds. Outside a wave a reviewer updates the ledger itself.

`qa-plan-agent` (5b) is not part of the wave. It runs after the wave's gate, on settled code, and can still lead to one more fix pass of its own, with the same recheck rule. QA plan, release planner and documentation do not run as a wave of their own either: the QA gate can end in a fix pass that changes the code the other two read, the release planner's final accounting has to see every row the others add, and documentation reads the deployment plan for its migration notes.

---

## Phase 4: Code Review (Code Reviewer)

- Check standards, naming, file structure
- Verify security (no hardcoded secrets, input validation, auth checks)
- Verify architecture and API contract compliance
- Check performance (N+1 queries, memory leaks)

_Input: generated code + test files_
_Output: a single Markdown file — frontmatter (status, pass/fail checks, issue counts) + report body (full issues table with impact, file:line, description, fix, disposition)_
_Saved to: `.kairos/<feature_folder>/04-review.md`_

::: info HITL checkpoint
Answered at the combined review gate, together with 4b and 5. `NEEDS_FIXES` issues you mark **Mitigate now** join the wave's single fix pass. Presented via `AskUserQuestion`, not a printed menu.

`✅ Approve` · `✏️ Request changes` · `⏭️ Skip next` · `⛔ Stop`
:::

::: tip Effort modes — Lean, Trimmed, Full
Every phase agent reads `effort` in the same priority order: the orchestrator's invocation prompt first (a human confirmed it at the Effort Check), then `00b-impact.md`, then its own inference as a last resort.

**Lean Mode** (`simple_fix`) — here, Architecture Compliance and Performance collapse to a one-line N/A unless the diff actually adds an endpoint/schema/integration point or touches a loop/query/hot path; the dependency-changelog check only runs when a dependency version actually changed. Correctness, Security, Simplicity, and Standards always run in full — those are what actually catch bugs on a small diff.

**Trimmed Mode** (`medium`) — the Full process, minus the sections nothing downstream reads: Performance collapses to a one-line check unless the diff touches a loop, query, or documented hot path. Every other check runs in full.

**Full Mode** (`significant_rework`, or an unknown effort) — unchanged.
:::

---

## Phase 4b: Security Review — optional (Security Reviewer)

Adversarial pass — the agent asks "how do I break this" rather than checking compliance boxes. Only runs when explicitly selected. Read-only agent (`model: opus`).

- **Authorization and IDOR** — including nested payload mutations (a PUT on parent A that can silently modify a child belonging to parent B)
- **Authentication** on sensitive endpoints
- **Injection** — SQL, command, template, NoSQL
- **Secret handling** — hardcoded creds, secrets in logs or responses
- **Data over-exposure** — full model serialization, unfiltered list endpoints
- **Input validation** at the server boundary
- **Dependency risks** — known CVEs, deprecated crypto
- **Contract enforcement** — verifies that ownership constraints from `02-architecture.md` are actually present in code; gaps are flagged regardless of direct exploitability

_Input: implementation code + `02-architecture.md`_
_Output: a single Markdown file — frontmatter (status, finding counts) + report body (each finding's attack scenario, evidence, fix, and disposition; contract enforcement table)_
_Saved to: `.kairos/<feature_folder>/04b-security-review.md`_ (written by the Orchestrator — the agent itself is read-only)

::: info HITL checkpoint
Answered at the combined review gate. Findings you mark **Mitigate now** join the wave's single fix pass; none of them is ever retried automatically. Presented via `AskUserQuestion`, not a printed menu.

`✅ Approve` · `✏️ Request fixes` · `⏭️ Skip next` · `⛔ Stop`
:::

::: tip When to add the Security Reviewer
Select `security-reviewer-agent` whenever the feature touches: authentication or authorization, user-owned data, payment flows, or any write endpoint. KAIROS's own flagship example (PCI-DSS Stripe payments) is a clear case.
:::

---

## Phase 5: Test Verification (Test Verifier)

- Verify test comprehensiveness (edge cases, error scenarios)
- Check coverage adequacy (>80% required)
- Assess assertion quality

_Input: test code + coverage report_
_Output: a single Markdown file — frontmatter (status, execution/coverage summary) + report body (uncovered lines, AC mapping, issues table)_
_Saved to: `.kairos/<feature_folder>/05-test-verification.md`_

::: info HITL checkpoint
Answered at the combined review gate. Gaps and issues you mark **Mitigate now** join the wave's single fix pass. Presented via `AskUserQuestion`, not a printed menu.

`✅ Approve` · `✏️ Request changes` · `⏭️ Skip next` · `⛔ Stop`
:::

::: tip Skips re-running tests on a clean first pass
`implementer-tdd-agent` already executes the test suite twice (RED and GREEN) and reports coverage in `03-implementation.md`. On the first test-verifier invocation for a feature — no prior `05-test-verification.md`, and GREEN shows a clean pass — Test Verifier reuses those results instead of re-running the suite. The static audit (comprehensiveness, assertion strength, determinism, hygiene, mocking, TDD reality check) always runs in full regardless; only the redundant command re-run is skipped. Any loop re-check, recheck after a fix pass, or standalone invocation always re-executes.
:::

---

## Phase 5b: QA Plan (QA Plan Agent) — optional

- Name the core: what the change fixes (the bug triage's root cause, or the requirement's outcome) and the one to three behaviours that mean it failed, so those cases come first
- Build the coverage complement: what Test Verifier reported as uncovered, plus every `AC-n` with a gap, keeping only what a person can actually reach through the product
- Write manual and exploratory test cases a person can execute without reading the code, each with the `Setup` it needs — applications, configuration, concurrent sessions, machines, roles — in product language: screens, actions, visible outcomes, no class names, files, database objects or pipeline IDs
- Never send the tester to the developer's tools: no browser dev tools, no scripts, no hand edits to the database, no hand-built requests. A case starts from a state the product can reach. When the only way to stage a precondition is technical, a developer prepares it and the case says so in its `Setup`; when no case can be written without it, the plan carries a risk row instead of a step for the tester
- List the behaviour changes a tester will see and must not file as bugs
- Answer any `VERIFICATION` constraint declared upstream — which case covers it, or a `high` risk row when none does; `N/A` when none was declared, which is the normal case
- Select regression retests by grepping real callers of every changed symbol
- List test data and environment needs, each with the line of code that demands it
- Select the existing `QA-n` cases from the project-wide catalogue whose area this change touched, each with the changed file that puts it there
- Append this run's reusable manual cases to `.kairos/_qa-regression.md`, retire the ones this change automated or removed
- State UAT sign-off per `AC-n`, and carry pm-agent's Outcome Criterion through verbatim
- Decide where the tester reads the plan. Up to 3 checks (manual cases, regression retests and existing cases to re-run, counted together) and no epic: an extract goes into the issue comment, as before. More than 3, or an epic: the tester's part is written as a Markdown file, `_qa-file.md`, and the comment carries a short pointer to it

_Input: `05-test-verification.md` (optional), `01-requirements.md`, `03-implementation.md`, `00c-bug-triage.md` (optional)_
_Output: a single Markdown file — frontmatter (status, coverage basis, case counts, regression-risk tallies) + the plan body_
_Saved to: `.kairos/<feature_folder>/05b-qa-plan.md`, plus `_qa-comment.md` (the text posted to the tracker) and, when the plan goes to a file, `_qa-file.md`_

::: info HITL checkpoint
User reviews the plan before it goes to whoever will execute it. `NEEDS_ATTENTION` is not a loop trigger — nothing re-invokes an implementer from here; it means a regression risk or an unverifiable acceptance criterion needs a human decision first.

`✅ Approve` · `✏️ Request changes` · `⏭️ Skip next` · `⛔ Stop`
:::

::: tip Runs after the loop, and reaches the tester through the issue
Phase 5b runs only once the review loop has exited and the review gate has resolved — a QA plan written mid-loop describes code that is about to change again. It is also the one artifact whose reader sits outside the pipeline, so once you approve it the plan is delivered to the issue tracker when an issue reference was given. No `jira`/`glab` on the machine is fine: the Orchestrator prints a paste-ready comment instead of failing the phase. Nothing is posted or written to the repository before you approve the plan at its gate. That comment is the acceptance/QA split in practice: the issue's `AC-n` list stays developer-verifiable, and the setup a check really needs — two applications, a specific configuration, two sessions on two machines — travels with the plan instead of bloating the criteria. What the tester gets is an extract, not the report: core, cases, setup, expected behaviour changes, retests, test data and the manual part of the sign-off, without the Summary, Coverage Complement and code evidence the gate reads and a tester cannot act on. Empty sections are left out.

**Small plans stay in the comment; larger ones become a file.** With up to 3 checks and no epic, the extract is the comment. Above that it is written to the repository as a Markdown file in the QA directory (`.kairos/.qa-dir`, asked once per project), and the comment shrinks to the framing line, the core and a pointer to the file. The file is written by `documentation-agent` on the Orchestrator's instruction, after you approve, and it lands in your working tree so it travels with the merge request; until that merge the link points at a file that is not on the default branch yet. Standalone, `qa-plan-agent` has no Orchestrator to hand the write to: it leaves `_qa-file.md` in the feature folder and prints the path to copy it to.

**An epic gets one cumulative plan.** When the issue belongs to an epic (an `Epic:` line, or the tracker's own parent link), every issue of that epic writes into the same file, `<qa-dir>/<epic>.md`. Each run rewrites only its own `## <issue>` section and its own row in the `## Issues` table at the top, which lists every issue with its size; the other issues' sections are never touched. The comment goes on the epic, not on the child issue. Read across the epic's issues, that table is also the catalogue by size: the `size:` labels group them in the tracker, the table groups them in the plan.
:::

---

## Phase 6: Deployment Planning (Release Planner)

- Define deployment steps (pre-checks → staging → canary 10% → full rollout)
- Create rollback strategy with estimated time
- Define monitoring metrics and alert thresholds

_Input: verified code + architecture + identified risks_
_Output: a single Markdown file — frontmatter (rollback/monitoring summary) + runbook body (deployment steps, risk mitigation table, rollback checklist, monitoring)_
_Saved to: `.kairos/<feature_folder>/06-deployment-plan.md`_

::: info HITL checkpoint
User approves the deployment runbook (`06-deployment-plan.md`). This is the final checkpoint of the numbered pipeline — approval closes this KAIROS run (Phases 1–6, or 1–6b if `documentation-agent` was also selected). It does not preclude running `retrospective-agent` afterward — a separate, standalone, non-orchestrated follow-up invoked directly by the user whenever they consider the feature done. Presented via `AskUserQuestion`, not a printed menu.

`✅ Approve` · `✏️ Request changes` · `⛔ Stop`
:::

---

## Phase 6b: Documentation (Documentation Agent) — optional

- Read the project's existing documentation first (README, CHANGELOG format, docs directory) and match it
- List the user-facing surfaces the change altered, from the architecture's contracts and what the implementer actually shipped
- Draft the README, API reference, CHANGELOG entry and migration notes those surfaces need, as the exact text to be written; flag what it cannot write without inventing (a missing example, an undocumented error code) as a documentation gap
- Once you approve the draft, write it into the project's documentation files

_Input: `02-architecture.md`, `03-implementation.md`, `06-deployment-plan.md` (optional), the project's existing docs_
_Output: `06b-documentation.md`, then the documentation files it lists_
_Saved to: `.kairos/<feature_folder>/06b-documentation.md`, then README, CHANGELOG and `docs/**` in the project_

::: info HITL checkpoint
The Orchestrator runs this phase in two calls, like Phase 3, because the agent that writes real files outside `.kairos/` is a subagent and cannot ask you anything. The first call only drafts: `documentation-agent` writes `06b-documentation.md` and touches nothing else. The gate on it is the Orchestrator's. The second call runs only after you approve: the Orchestrator calls the agent again to write the files listed in `## Docs Touched`, exactly as the draft shows them, and the agent appends a `## Docs Written` table to the report. A file whose anchor text changed since the draft is left alone and reported, and nothing outside `.kairos/` is written before your approval. Resuming a run that stopped between the gate and the write shows the gate again.

`✅ Approve` · `✏️ Request changes` · `⛔ Stop`
:::

---

## Shared Ledger — Cross-Phase Project Memory

Each KAIROS run maintains three living files under `.kairos/<feature_folder>/ledger/` that accumulate shared state across all phases, plus two files the Orchestrator alone keeps there:

| File | Purpose | Seeded by | Updated by |
|------|---------|-----------|-----------|
| `constraints.md` | All constraints with per-phase accounting | PM Agent (or Context Extractor if run first) | Every agent |
| `decisions.md` | Architectural and implementation decisions log | Architect Agent | Any agent; the `Supersedes` cell only by the Orchestrator |
| `open-questions.md` | Cross-phase questions with answers, and deferred risks | Any agent or human (via HITL gate) | Any agent |
| `run.md` | The run's settings: effort, active agents, auto-fix budget, wave gates, phase gates, and the agents dispatched but not yet returned (`in_flight`) | Orchestrator, before Phase 1 | Orchestrator |
| `loops.md` | Auto-fix state while a retry is running, and the history of retries that did not converge | Orchestrator | Orchestrator; the checker adds its convergence signal |

`run.md` is what lets a pipeline resume in a later session with the same settings: the resumed run restores the effort, skips the agents that were never selected, and keeps the auto-fix budgets the human chose. `loops.md` keeps retry bookkeeping out of `open-questions.md`, so that file holds only what a person has to read.

`run.md` also records which agents were dispatched and have not returned. A report on disk never proves an agent finished: every agent writes its report before its ledger update and before it hands control back, so the file exists while the agent is still working. The Orchestrator therefore treats an agent as complete only when its call returns, and opens no gate and starts no other agent until then. If a session ends first (a closed laptop, a stopped run), the next session finds the agent still marked in flight and re-invokes it, whatever report it left behind. The implementers, `implementer-lead-agent` and `documentation-agent` define a recovery mode; any other agent is re-run from the start with its first prompt and replaces its own report. A recovering implementer reads `git status`, the approved plan and the earlier `03-implementation.md`, keeps the files that already match the plan, writes the ones that are missing and re-runs the tests before it reports.

Before v8.5.0 a third file, `audit-log.md`, kept one line per gate. That log now lives in `_tracking.md` (below); an existing `audit-log.md` is read, never written.

Feature folders written before v8.4.0 keep working. A folder with no `run.md` falls back to the effort stored in the audit log's header and asks once for anything else; loop sections found in `open-questions.md` are moved into `loops.md` the first time the Orchestrator touches them; a `decisions.md` table without a `Supersedes` column gains it on its next write.

### How the ledger works

**Forced accounting model** — at the end of every phase, each agent must update the Status column of every existing constraint row before adding new ones. An unaddressed constraint stays `🔴 open` and is visible to every downstream agent.

| Status | Meaning |
|--------|---------|
| `🔴 open` | Not yet addressed by any agent |
| `✓ resolved` | Constraint is satisfied — note how |
| `⚠ deferred` | Acknowledged but deferred (tracked in risk) |
| `♻ modified` | Constraint was changed — note new version |
| `❌ dropped` | Explicitly removed — note justification |

`open-questions.md` uses `🔴 open`, `✓ answered`, and `⚠ deferred`. A risk the human chose to **Defer** at a gate is written `⚠ deferred`, not `🔴 open`: nobody will answer it, so it is left out of the open-question count every gate shows, and the release plan lists it as a risk knowingly taken. A deferred row written by an older version, still `🔴 open` but marked `deferred risk`, is counted the same way.

An **Escalate** writes two rows that point at each other: the `BLOCKING` constraint names its question (`BLOCKING — see Q7`), and the question names the constraint. The two full re-walks (architect and release planner) close the constraint from the question's answer, so answering the question is enough.

When a phase contradicts an earlier decision and the human **Accepts** that conflict at the gate, the Orchestrator records the change in `decisions.md`'s `Supersedes` column. Later conflict scans skip the replaced decision instead of flagging it again. No phase agent writes that column: the agent being checked cannot switch off the check on itself.

### Why this matters

Without the ledger, information can be silently dropped between phases: a SOC2 compliance constraint captured by the PM but not echoed into `02-architecture.md` is invisible to the Implementer and Reviewer. The ledger eliminates this by making all cross-phase constraints and decisions explicit and persistent.

**Constraint & Decision Conflict Scan** — after every phase's own ledger update, the Orchestrator re-reads `constraints.md` and `decisions.md` and checks this phase's actual output against every row an *earlier* phase already resolved or recorded. A row's own Status cell only records what the acting agent *claims* happened — it never cross-checks itself against constraints or decisions from more than one phase back — so this is the only place that drift gets caught. A genuine contradiction becomes a `high`-impact row in the phase's own Risks/Issues table, resolved through the same HITL gate as everything else there.

At pipeline end, the Orchestrator counts `🔴 open` items in `open-questions.md` and warns if any remain unresolved before shipping.

> **Team Mode**: only `implementer-lead-agent` reads and writes the ledger. Teammates receive constraints through their binding contracts, not by direct ledger access.

---

## Tracking File

The ledger is written for the agents. `.kairos/<feature_folder>/_tracking.md` is written for you: the Orchestrator creates it before Phase 1, opens it in your editor once, and rewrites it after every event, so the same tab stays current for the whole run. No agent writes it and no agent reads it: every value in it comes from the ledger and the phase reports, and nothing the pipeline does, a resume included, depends on its content. That is also why the rename from `_recap.md` breaks nothing.

| Section | Rewritten or appended | What it tells you |
|---|---|---|
| `## Status` | rewritten every event | current phase, next step, what blocks the run, the questions and constraints still `🔴 open` |
| `## Issue Alignment` | rewritten every event | every `AC-n` as `pending`, `covered`, `manual`, `later` (it belongs to a slice this run does not build), `gap`, `changed` or `dropped`, and every scope change made along the way |
| `## Log` | appended, never rewritten | one line per event: each gate and your answer, each wave or gate continued automatically, each fix pass, loop exit, resume and stop |
| `## Phases` | one section replaced per gate | a few lines per phase, taken from that report's `## Summary` |

Every section that restates ledger rows (the status block and, once the run has finished, Open Questions, Open Constraints and Accepted Risks) is rewritten from one read of the ledger, so the file cannot disagree with itself: a question you answer or a constraint that resolves after the run has ended updates all of them, and is logged as an `after run` line.

A scope change is listed when a decision in `ledger/decisions.md` opens with `Scope:`. PM Agent, Architect Agent and the Orchestrator write that prefix when a decision widens or narrows what the issue asked, so the alignment section never has to guess.

Gates no longer open each report in the editor. The gate prints the report's path; reply `open` (or `apri`) and the Orchestrator opens it and shows the same gate again. The implementation plan is the one exception and still opens automatically.

At the end of the run the Orchestrator finalizes the file: Files Changed, the risks you chose to ship with, and the constraints still open. In Claude Code the model and token table is in a file of its own, `_usage.md` (see [Usage](#usage-model-and-tokens-per-agent)). It then offers to delete the phase reports it now summarizes; the ledger and `_tracking.md` are never deleted. Last, it offers a sanitized copy of the summary inside the project (`docs/kairos-summaries/<feature_folder>.md`), because `.kairos/` may be gitignored. That copy has its own gate, and the Orchestrator owns it: it writes the draft to `.kairos/<feature_folder>/_project-summary.md`, prints the path (reply `open` to read it) and asks Approve, Request changes or Stop. Only after Approve does it hand the draft to `documentation-agent`, which checks that the target is a documentation file and writes it. Nothing reaches `docs/` before you approve. Folders from before v8.5.0 have a `_recap.md` written only at the end: a finished one is left as it is, and a resumed one gets a `_tracking.md` on first touch, with the old audit-log lines copied into its log.

---

## Issue Tracker Integration

KAIROS supports **Jira**, **GitLab Issues**, and **Bitbucket Issues**. Provide an issue reference at the start of your request — each agent will post its validated output as a comment, building the full pipeline trace in the ticket history.

| Tracker | Reference format | Example |
|---------|-----------------|--------|
| Jira | `PROJ-42` | `"Add Stripe payments — PROJ-42"` |
| GitLab | `#42` | `"Add Stripe payments — issue #42"` |
| Bitbucket | `#42` | `"Add Stripe payments — issue #42"` |

```bash
# Jira (jira-cli):
jira issue comment add PROJ-42 "## PM Analysis\n\n..."
jira issue comment add PROJ-42 "## Architecture Design\n\n..."

# GitLab (glab):
glab issue note 42 --message "## PM Analysis\n\n..."

# Bitbucket (REST API):
curl -X POST "https://api.bitbucket.org/2.0/repositories/{workspace}/{repo}/issues/42/comments" \
  -u "${BITBUCKET_USER}:${BITBUCKET_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"content":{"raw":"## PM Analysis\n\n..."}}"
```

---

## Error Handling

If any agent reports issues during its phase, the Orchestrator:

1. Flags the problem to the user
2. Asks whether to retry, skip, or abort the step
3. Provides recommendations based on severity
4. Continues to the next step when appropriate

---

## Final Output

After all phases complete, the Orchestrator finalizes `_tracking.md` (see [Tracking File](#tracking-file)) and presents a consolidated summary:

```
ANALYSIS (from PM Agent):
  - Scope, Constraints, Risks, Success Criteria

ARCHITECTURE (from Architect Agent):
  - Design Option Selected, Technology Choices
  - Integration Points, Database Changes, API Contracts

IMPLEMENTATION (from Implementer Agent):
  - Code Files Generated, Test Files Generated
  - Coverage Report, TDD Verification

QUALITY (from Code Reviewer):
  - Standards Compliance, Security Check
  - Performance Analysis, Issues Found (if any)

SECURITY (from Security Reviewer):
  - Findings ranked by exploitable severity
  - Attack scenarios
  - Contract enforcement status (ownership constraints verified)
  - IDOR / ownership gaps

TEST QUALITY (from Test Verifier):
  - Coverage Status, Test Quality Assessment
  - Missing Coverage (if any)

DEPLOYMENT (from Release Planner):
  - Deployment Steps, Risk Mitigation
  - Rollback Strategy, Monitoring Plan
```

::: tip Every KAIROS run produces
- Production-ready code
- Comprehensive test suite (>80% coverage)
- Quality assurance report
- Deployment plan with rollback procedure
:::

---

## Usage: model and tokens per agent

In Claude Code the Orchestrator keeps `.kairos/<feature_folder>/_usage.md` current: after every agent that returns it has `scripts/usage.mjs` rewrite the file, so a run stopped halfway still has its table, and nothing is added to the agents' own reports. `/kairos:usage` prints the same report on demand. It has one row per agent call and a total; for every agent the Orchestrator dispatched, the model that actually answered and the input, output, cache-write and cache-read tokens, with a flag on any agent whose model differs from `.kairos/.models` or its own `model:` line.

The figures are measured by `scripts/usage.mjs` from the subagent transcripts Claude Code writes under `~/.claude/projects/`, not reported by an agent about itself (a model asked its own name can be wrong). Each response is counted once, and the four token kinds stay apart because they are billed differently. Claude Code does not document the transcript format, so the script is best effort: when it finds nothing it understands, it says so and `_usage.md` is not written. `/kairos:usage --feature <folder>` reports every session of a feature; with no argument it reports the latest session, primary agent included. It needs Node 18 or later. OpenCode and Kimi Code have no such transcripts and print nothing.
