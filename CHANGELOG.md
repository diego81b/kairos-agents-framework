# Changelog

All notable changes to KAIROS Framework are documented in this file.

---

## v3.2.1 — June 1, 2026

### Added

- **`docs/distribution/02-plugin-install.md`** — Phase 1.3 install guide: prerequisites, install commands, agent namespace reference table, contract checklist skill access, and Phase 1.4 routing test requirements.
- **`docs/.vitepress/config.js`** — Phase 1.3 install guide added to Distribution sidebar; dead link for Contract Checklist fixed (`agents/shared/contract-checklist` → `skills/contract-checklist/SKILL`).

---

## v3.2.0 — June 1, 2026

### Added

- **`.claude-plugin/plugin.json`** — plugin manifest enabling KAIROS as an installable Claude Code plugin (`name: kairos`, `defaultEnabled: false`, `version: 3.2.0`).
- **`.claude-plugin/marketplace.json`** — self-hosted marketplace manifest pointing to the GitHub repo for distribution.
- **`skills/contract-checklist/SKILL.md`** — contract checklist migrated from `agents/shared/` into a Claude Code skill; accessible as `/kairos:contract-checklist`.

### Changed

- **`agents/orchestrator-agent.md`** — all 9 agent invocation calls updated to use `kairos:` namespace prefix (e.g. `@pm-agent` → `@kairos:pm-agent`, implementer-lead → `@kairos:team:implementer-lead-agent`); required for plugin-installed agent routing.
- **`agents/team/implementer-lead-agent.md`** — all 4 teammate spawn type names updated to `kairos:team:` prefix (e.g. `teammate-tests-agent` → `kairos:team:teammate-tests-agent`); checklist path updated to new `skills/` location.
- **`agents/architect-agent.md`** — checklist path updated from `agents/shared/contract-checklist.md` to `skills/contract-checklist/SKILL.md`.

### Removed

- **`agents/shared/contract-checklist.md`** — replaced by `skills/contract-checklist/SKILL.md`.

---

## v3.1.3 — June 1, 2026

### Added

- **`docs/distribution/01-plugin-mapping.md`** — Phase 1.1 mapping: full KAIROS component inventory mapped to plugin slots, three Phase 0 review decisions applied, complete agent-to-agent invocation list (9 @-notation calls in orchestrator, 4 Agent Teams spawn type names in implementer-lead), namespacing blocker documented with verification method and required test scope.
- **`docs/.vitepress/config.js`** — Phase 1.1 mapping page added to Distribution sidebar.

### Changed

- **`docs/distribution-roadmap.md`** — Phase 0 checkboxes marked complete with verified answers; Phase 0 review decisions (CLAUDE.md exclusion, defaultEnabled: false, namespacing as primary risk) documented as a dedicated section; Phase 1.1 marked complete with output link; Phase 1.2 updated with namespacing hard blocker and mandatory routing test requirement for Phase 1.4.

---

## v3.1.2 — June 1, 2026

### Added

- **`docs/distribution/00-discovery.md`** — Phase 0 Discovery findings: verified Claude Code plugin anatomy (manifest fields, folder layout, marketplace distribution, install steps), MCP server SDK options (TypeScript/Python/C#/Go tier 1), transport choices (stdio vs Streamable HTTP), user config blocks for both local and remote servers, and a "where does it live" summary table. Five open questions for Phase 1 captured at end of document.
- **`docs/.vitepress/config.js`** — new "Distribution" sidebar section linking to the roadmap and Phase 0 discovery page.

---

## v3.1.1 — June 1, 2026

### Added

- **`docs/distribution-roadmap.md`** — distribution roadmap (Plugin → MCP Server) published to the docs site; covers Phase 0 (discovery), Phase 1 (Claude Code plugin), and Phase 2 (MCP server re-architecture) with guiding principles and a "where things live" reference table.

---

## v3.1.0 — June 1, 2026

### Added

- **`agents/security-reviewer-agent.md`** — new adversarial security reviewer (read-only: `tools: Read, Grep, Glob`, `model: opus`). Posture is "how do I break this" rather than checklist compliance. Covers 7 categories: authorization/IDOR (including writes through nested payloads where a PUT on a parent can mutate a child belonging to a different parent), authentication on sensitive endpoints, injection (SQL/command/template/NoSQL), secret handling, data over-exposure in responses, input validation at server boundary, and dependency risks. Output is `04b-security-review.json` ranked by exploitable severity, each finding with a concrete attack scenario. Includes a mandatory `contract_enforcement` block that verifies ownership constraints defined in `02-architecture.json` are actually present in the implementation code. Because this agent is read-only, the orchestrator handles writing the output file and opening it in the editor.
- **`agents/impact-assessment-agent.md`** — new standalone grounding agent (read-only: `tools: Read, Grep, Glob`, `model: opus`). User-triggered before the orchestrator, same pattern as `context-extractor-agent` (Hard Constraint #4 preserved — the orchestrator never invokes it). Reads the issue and only the code it directly touches — not a full-repo rescan. Consumes `00-context.json` if already present. Outputs `00b-impact.json` with: effort estimate (`simple_fix / medium / significant_rework`) with file-level reasoning, domains touched (`backend / frontend / db / auth / integrations`), existing reusable assets with real file paths, gaps, risks visible from current code, open questions, and a `recommended_agents` block with per-agent justification. The recommendation is advisory only — it is displayed to the user as a `💡 Impact Assessment` block above the Step 0d selection menu; nothing is pre-selected. Because this agent is read-only, the orchestrator (or user) handles writing and opening the file.
- **`agents/shared/contract-checklist.md`** — new shared reference encoding the critical questions every API or database contract must resolve before finalization: entity lifecycle, payload shape for master-detail (nested aggregate vs separate endpoints), ownership and IDOR risk (including nested updates that mutate a child belonging to a different parent), idempotency and retry behavior, delete behavior (soft/hard, cascade), aggregate update diff (how the payload signals existing vs new vs deleted children), pagination/filter/sort, versioning, and error response shape. Referenced by both `architect-agent` and `implementer-lead-agent`.

### Changed

- **`agents/orchestrator-agent.md`** — `security-reviewer-agent` and `impact-assessment-agent` added to Available Subagents; Case A and Case B selection menus include `security-reviewer` as option `4b`; Phase Execution adds Phase `4b` (Security Review) between Review and Test Verification, with the orchestrator persisting `04b-security-review.json`; Step 0a now checks for `00b-impact.json` alongside `00-context.json`; Hard Constraint #4 extended to cover `impact-assessment-agent`; Step 0d displays a `💡 Impact Assessment` advisory block when `00b-impact.json` is present — advisory only, no auto-selection; HITL file map, Pipeline Outputs tree, and Output To User block updated.
- **`agents/architect-agent.md`** — new Step 5 "Pre-Contract Resolution" inserted before Detailed Design: before emitting `api_contracts`, the Architect must work through `agents/shared/contract-checklist.md` and resolve every applicable item, preventing silent drift from reaching the Implementer.
- **`agents/team/implementer-lead-agent.md`** — Step 2 (Create Binding Contracts) now opens with a mandatory checklist gate referencing `agents/shared/contract-checklist.md`; new Step 2b "Contract Consistency Check" verifies the 4 Lead contracts are faithful to the Architect's `api_contracts` and `database_changes` before any teammate is spawned — mismatches surface as a HITL gate rather than silently diverging.

---

## v3.0.1 — May 7, 2026

### Changed

- **`agents/test-verifier-agent.md`** — rewritten to match the depth of `code-reviewer-agent`. The agent now executes the project's test+coverage command (Jest, Vitest, pytest, Go) instead of inferring results from code, and audits seven distinct dimensions: comprehensiveness, coverage (line + branch + function), assertion strength, determinism / flakiness, hygiene (`.only` / `.skip` / empty bodies), mocking discipline, and TDD reality (cross-checks `red_phase_verified` from `03-implementation.json`). Output schema now includes `status: READY|NEEDS_FIXES`, an `execution` block, an `ac_mapping` array against architecture acceptance criteria, and an `issues[]` list with `severity`, `category`, `file`, `line`, `description`, and `fix` — directly consumable by `implementer-tdd-agent` on the "Request fixes" HITL path.

---

## v3.0.0 — May 7, 2026

### Added

- **`agents/implementer-coder-agent.md` — new code-only implementer** — lightweight alternative to `implementer-tdd-agent` for projects without a test suite or when tests are explicitly out of scope. Follows the same two-gate HITL workflow (plan approval → implementation approval) but skips all TDD phases, test-file generation, RED/GREEN cycles, and coverage measurement. Frontmatter description: _"Code-only implementer — use ONLY when the project has no test suite or tests are explicitly out of scope. For projects with a test suite, use implementer-tdd-agent instead."_
- **`orchestrator-agent` — `implementer-coder-agent` routing** — the orchestrator presents `implementer-coder-agent` as option 3b (code-only, no TDD) in both Case A and Case B selection menus, with `implementer-lead-agent` promoted to 3c. Implementation Phase routing block handles all three paths.
- **`docs/agents.md`** — new Implementer Agent — Code Only section with a note directing users back to `implementer-tdd-agent` when a test suite exists.
- **`docs/agent-files.md`** — `implementer-coder-agent` added to the quick-jump table and as a copy-block embed section.
- **`docs/setup/templates.md`** — `implementer-coder-agent` added to blank template block and agent role reference table (row 3b).

### Changed

- **Agent files renamed for clarity** — `agents/implementer-agent.md` → `agents/implementer-tdd-agent.md`; `agents/coder-agent.md` → `agents/implementer-coder-agent.md`. The `implementer-` prefix is now consistent across all three single-agent implementers. All docs, orchestrator references, VitePress sidebar, and template blocks updated accordingly.
- **Naming and purpose clarified across all docs** — every reference to `implementer-agent` was audited and the TDD nature made explicit; every reference to `coder-agent` was labelled "code-only / no TDD". Affected files:
  - `docs/index.md` — agent count updated (8 → 9); feature tiles revised to distinguish TDD vs code-only output
  - `docs/overview.md` — selection menu, file tree, and "What You Get" list all updated
  - `docs/setup/index.md` — file tree updated
  - `docs/setup/claude-code.md` — file tree, implementer-choice tip, troubleshooting, pipeline diagram, model table
  - `docs/setup/cursor.md` — file tree, model table
  - `docs/setup/vscode.md` — file tree, model table

---

## v2.1.2 — April 11, 2026

### Changed

- **`orchestrator-agent` — orchestrator collapse prevention** — addresses a failure mode where the orchestrator bypassed subagent delegation and the HITL gates, writing code directly.
  - **"Your Role" strengthened**: explicit statement that the orchestrator does NOT write source code, test files, architecture documents, or any project file. "You are a coordinator, not an implementer."
  - **New `## Hard Constraints` section** with 4 absolute prohibitions:
    1. Never write source code (with a file-extension list as a trigger check).
    2. Never self-implement — specific collapse phrases ("I'll proceed with implementation", "proceeding with implementation") identified as failure signals requiring immediate redirection to the correct subagent.
    3. Never skip a HITL gate — silence or ambiguity from the user = do nothing and wait.
    4. Never auto-invoke `context-extractor-agent` from inside a pipeline run.
  - **HITL section — "STOP" language added**: step 3 now reads "STOP. Do not read files, do not prepare the next prompt, do not take any action." to prevent the orchestrator from queuing work while waiting for approval.
  - **New `### Collapse Detection` rule**: before writing any response, the orchestrator self-checks whether it is about to produce implementation output; if so, it emits a visible warning (`⚠️ Orchestrator self-check`) and delegates immediately.
  - **Step 0a clarified**: the prohibition on invoking `context-extractor-agent` is now a standalone bolded statement — "You have no authority to trigger it."
  - **Important Notes**: added "If you are unsure which subagent to call, call none and ask the user — never guess and proceed."

---

## v2.1.1 — April 11, 2026

### Added

- **Open in Editor after each phase** — all 7 writing agents now run `code ".kairos/$feature_folder/<phase>.json"` immediately after saving the output file, so the JSON is opened in the editor for inspection before the user approves — mirroring the plan-mode diff-preview pattern. Affected agents: `context-extractor-agent`, `pm-agent`, `architect-agent`, `implementer-agent`, `code-reviewer-agent`, `test-verifier-agent`, `release-planner-agent`.
- **Orchestrator HITL updated** — the HITL loop now includes an explicit "open in editor" step (step 2) with the full phase-to-filename mapping (`01-requirements.json` → … → `06-deployment-plan.json`), acting as fallback if the sub-agent cannot run the command itself.

### Changed

- **Agent frontmatter — `bash` and `write` tools added** where previously missing, required by the new `code` open command:
  - `pm-agent`: `[read, write]` → `[read, write, bash]`
  - `architect-agent`: `[read, write]` → `[read, write, bash, grep]`
  - `code-reviewer-agent`: `[read, grep]` → `[read, write, bash, grep]`
  - `test-verifier-agent`: `[read]` → `[read, write, bash, grep]`
  - `release-planner-agent`: `[read]` → `[read, write, bash]`
  - `context-extractor-agent`: `[read, grep]` → `[read, write, bash, grep]`
  - Platform-specific config blocks in each agent updated to match.
- **`Open in Editor` path syntax** — uses `$feature_folder` (shell variable) instead of `<feature_folder>` (ambiguous placeholder that conflicts with the bash redirection operator `<`). Each step is annotated with "Run from the project root, substituting the actual `feature_folder` value received from the orchestrator".

---

## v2.1.0 — April 11, 2026

### Changed

- **Team Mode now uses Claude Code's experimental Agent Teams feature** (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) instead of the previous `agent`-tool subagent mechanism. Requires Claude Code v2.1.32+.
  - Each teammate now runs as a **separate Claude Code session** with its own context window, rather than as a nested subagent reporting back to the caller.
  - Teammates communicate **peer-to-peer** via a shared mailbox. The Lead can message specific teammates directly or broadcast to all.
  - Work is coordinated via a **shared task list** with dependency management and automatic unblocking.
  - Compliance feedback is sent via teammate messaging (`message [teammate-name]: [feedback]`) instead of re-spawning.
  - Team cleanup is now explicit: the Lead shuts down teammates gracefully, then runs `"Clean up the team"`.
- **`agents/team/implementer-lead-agent.md`** — removed `agent` from `tools:` (now `tools: [read, write]`); updated all spawn instructions, compliance monitoring, and REFACTOR phase to use Agent Teams API; added cleanup step and experimental-flag requirement note.
- **[Claude Code Setup](/setup/claude-code)** — Team Mode section rewritten: replaces `agent`-tool verification with Agent Teams setup (`settings.json` env var, version check); updates cost warning, comparison table, and activation flow.
- **[Workflow](/workflow)** — Team Mode warning block updated: replaces `agent`-tool description with Agent Teams feature explanation and updated compatibility table.
- **[Agents](/agents)** — "Why Claude Code only?" paragraph updated to describe Agent Teams instead of the `agent` tool.
- **Orchestrator cost warning** — now mentions `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` requirement and marks Team Mode as experimental.

### Notes

- The TDD methodology (RED → HITL → GREEN → REFACTOR), binding contracts, and HITL gate are unchanged.
- The four teammate agent files (`teammate-tests-agent.md`, `teammate-backend-agent.md`, `teammate-frontend-agent.md`, `teammate-database-agent.md`) updated: `"Signal Team Lead"` replaced with explicit `message [lead]: "..."` syntax; task completion step added (`mark task as completed on shared task list`); `teammate-tests-agent` GREEN phase now messages the Lead directly instead of passive monitoring. `tools: [write]` unchanged — Agent Teams coordination tools (SendMessage, task management) are always available regardless of the `tools` filter.
- Agent Teams is experimental and disabled by default. Single Agent mode is unaffected.

---

## v2.0.9 — April 11, 2026

### Changed

- **[Team Mode Files](/agent-files-team)** — removed the *Contributor rule* warning block; it only applies to contributors editing source files and was out of context on the copy page.

---

## v2.0.8 — April 11, 2026

### Changed

- **[Agent Files](/agent-files)** — now contains only the 8 Core Agents. Team Mode entries removed; a note links to the new dedicated page.
- **[Team Mode Files](/agent-files-team)** — new standalone page for the 5 Team Mode agent files, with its own quick-jump table, Claude Code info callout, and mandatory changelog warning. Fully separate from the Core Agents page.
- Sidebar and nav updated: **Team Files (copy)** links to `/agent-files-team`; top-nav `Agents` dropdown gains a **Team Mode Files (copy)** entry.
- **Team Mode (optional)** sidebar section expanded by default (`collapsed: false`) — visually distinct from Core Agents.

---

## v2.0.7 — April 11, 2026

### Added

- **[Agent Files](/agent-files)** — new page that embeds the full raw content of every agent file (13 agents) as ready-to-copy code blocks. Content is auto-synced from source files at build time via VitePress code-snippet imports — no manual drift possible.
- **Changelog contribution rule** — every modification to any agent file must produce an entry in `CHANGELOG.md`. Rule enforced via warning admonitions on the Agent Files page and the Agents overview page.
- Navigation updated: `Agents` top-nav entry is now a dropdown; sidebar adds **Agent Files (copy)** as a collapsible parent per agent and **Team Files (copy)** for the Team Mode section.

### Changed

- `agents/teammates/` folder renamed to `agents/team/`.
- `agents/implementer-lead.md` moved into `agents/team/` — it is Team Mode specific.
- All agent files renamed to include the `-agent` suffix consistently: `orchestrator-agent.md`, `context-extractor-agent.md`, `code-reviewer-agent.md`, `test-verifier-agent.md`, `release-planner-agent.md`, `implementer-lead-agent.md`, `teammate-*-agent.md`. Files already named correctly (`pm-agent`, `architect-agent`, `implementer-agent`) are unchanged.
- All `name:` frontmatter fields updated to match new file names.
- All `@agent-call` references inside agent files updated.
- All path and link references updated across docs and setup guides.

---

## v2.0.6 — April 9, 2026

### Added

- Version number shown dynamically in the nav bar and footer, read from `package.json` — updating the version in one place propagates everywhere automatically

---

## v2.0.5 — April 9, 2026

### Changed

- **[Claude Code Setup](/setup/claude-code)** — added complete Team Mode setup instructions:
  - Copy command and directory tree now include `implementer-lead.md` and `teammates/`
  - New section explaining why Team Mode requires Claude Code (agent spawning comparison table vs Cursor, VS Code, etc.)
  - Step-by-step activation flow with the Orchestrator cost warning
  - Visual diagram of the RED → HITL → GREEN (parallel) → REFACTOR spawn sequence
  - `agent` tool verification for `implementer-lead.md`
  - Full pipeline diagram updated to show both implementation paths

---

## v2.0.4 — April 9, 2026

### Changed

- **Implementer Lead** — restructured to apply real TDD methodology across the team:
  - **RED phase** — `teammate-tests` is spawned first; the full test suite is written against the binding contracts before any implementation exists
  - **HITL test-plan gate** — user reviews and approves the test plan before backend/frontend/database are spawned
  - **GREEN phase** — `teammate-backend`, `teammate-frontend`, `teammate-database` spawn in parallel with the explicit goal of making the pre-existing tests pass
  - **REFACTOR phase** — quality improvements coordinated across all layers, tests must remain green
- [Workflow](/workflow) and [Agents](/agents) documentation updated to reflect the three-phase TDD flow

---

## v2.0.3 — April 9, 2026

### Changed

- **Team Mode documentation** — all references to “Claude Code only” now explain the technical reason: Claude Code’s `agent` tool allows an agent to spawn other agents programmatically at runtime; Cursor, VS Code, JetBrains, and Codex CLI only support user-triggered agent calls and cannot support Team Mode
  - [Workflow](/workflow) — new tool compatibility table inside the Team Mode warning block
  - [Agents](/agents) — explanation added to the Team Mode section intro
  - [Overview](/overview) — inline mention in the Team Mode paragraph
- **Overview** — removed Claude-specific language from provider-agnostic sections: `"isolated Claude instances"` → `"isolated AI agent instances"`; model names removed from the file tree

---

## v2.0.2 — April 9, 2026

### Added

- **Pipeline diagram** in [Workflow](/workflow) — Mermaid flowchart showing all 6 phases with the Phase 3 biforcation between Single Agent and Team Mode, HITL gates on every transition
- Mermaid rendering support (`vitepress-plugin-mermaid`)

### Fixed

- **Implementer Agent** — restored full agent definition: Phase 0 implementation plan (files, test cases, TDD order, risks) with its own HITL gate before any file is written; TDD phases 1–6 (generate tests → RED → implement → GREEN → refactor → coverage); model `claude-opus-4-6`; platform-specific configuration for Claude Code, Cursor, and VS Code

### Removed

- `implementer-coordinator` — removed from the framework; it was not part of the active pipeline

---

## v2.0.1 — April 9, 2026

### Added

**Implementer Team Pattern** (Claude Code only, optional)

A new optional execution mode for complex multi-layer features. When explicitly requested, the Orchestrator activates a coordinated team of 5 specialized agents instead of the single Implementer Agent:

| Agent | Role |
|---|---|
| [Implementer Lead](/agents/team/implementer-lead-agent) | Team coordinator — creates binding contracts, spawns and monitors teammates |
| [Teammate Tests](/agents/team/teammate-tests-agent) | Test specialist — generates full test suite (RED phase first) |
| [Teammate Backend](/agents/team/teammate-backend-agent) | Backend specialist — implements APIs per contract |
| [Teammate Frontend](/agents/team/teammate-frontend-agent) | Frontend specialist — implements UI per contract |
| [Teammate Database](/agents/team/teammate-database-agent) | Database specialist — creates schema and migrations per contract |

Also added:

- **Team Mode routing** in the Orchestrator Phase 3 — shows explicit cost warning before activating Team Mode

### Changed

- **Orchestrator** — Phase 3 now routes to `implementer-agent` (default) or `implementer-lead` (Team Mode, explicit request only)
- **Implementer Agent** — clarified as the default for all features, simple and complex alike

### Cost Transparency

| Mode | Cost/feature | When to use |
|---|---|---|
| Single Agent (default) | ~$0.068 | All features — works everywhere |
| Team Mode | ~$0.242 (3.5×) | Critical systems, only on explicit request |

Team Mode is **Claude Code only**. The single Implementer Agent works everywhere.

---

## v2.0.0 — April 8, 2026

### Added

- **7-agent orchestration pipeline** — Orchestrator, PM Agent, Architect Agent, Implementer Agent, Code Reviewer, Test Verifier, Release Planner
- **Context Extractor** — standalone pre-pipeline agent producing `00-context.json` for downstream agents
- **Human-in-the-Loop (HITL) gates** — explicit user approval after every pipeline phase
- **Selective pipeline** — activate only the agents you need per run
- **Issue tracker integration** — Jira, GitLab Issues, Bitbucket Issues
- **Multi-tool support** — Claude Code, Cursor, VS Code, JetBrains AI Assistant, OpenAI Codex CLI
- **Feature folder isolation** — each run writes to `.kairos/<feature_folder>/` for a complete audit trail
- **VitePress documentation site** with full agent reference and tool-specific setup guides
- **Deployment configs** for Vercel, Netlify, GitHub Pages

### Notes

- Initial public release
- Licensed under AGPL-3.0


### Changed

- `docs/agent-files-team.md` — removed redundant *Contributor rule* warning block (applies only to contributors editing source files; out of context on the Team Mode copy page).

---

## [v2.0.8] — 2026-04-11

### Changed

- `docs/agent-files.md` — Core Agents only (8 agents). Team Mode entries removed from quick-jump table; note added linking to the new team page.
- `docs/agent-files-team.md` — new standalone page for the 5 Team Mode agent files, with its own quick-jump table, Claude Code info callout, and mandatory changelog warning.
- Sidebar: **Team Files (copy)** and its children now link to `/agent-files-team` — a fully separate page from Core Agents.
- Top-nav `Agents` dropdown: added **Team Mode Files (copy)** entry pointing to `/agent-files-team`.
- `Team Mode (optional)` sidebar section: changed from `collapsed: true` to `collapsed: false` so it renders as a visible section header, clearly separated from Core Agents.

---

## [v2.0.7] — 2026-04-11

### Added

- `docs/agent-files.md` — new **Agent Files** page: embeds the full raw content of every agent file as copy-ready code blocks using VitePress code-snippet imports. Auto-synced from source files at build time.
- Contributor rule: every modification to any agent file must produce an entry in `CHANGELOG.md`.
- Sidebar restructured: **Agent Files (copy)** collapsible parent per agent, **Team Files (copy)** collapsible parent in Team Mode section.

### Changed

- `agents/teammates/` renamed to `agents/team/`.
- `agents/implementer-lead.md` moved into `agents/team/` — Team Mode specific.
- All agent files renamed with consistent `-agent` suffix: `orchestrator-agent.md`, `context-extractor-agent.md`, `code-reviewer-agent.md`, `test-verifier-agent.md`, `release-planner-agent.md`, `implementer-lead-agent.md`, `teammate-*-agent.md`. Already-correct names (`pm-agent`, `architect-agent`, `implementer-agent`) unchanged.
- All `name:` frontmatter fields, `@agent-call` references, and path/link references updated across all files.

---

## [v2.0.6] — 2026-04-09

### Added

- Version number displayed dynamically in nav bar (`v2.0.6` dropdown) and footer, read from `package.json` — updating the version in one place propagates everywhere automatically

---

## [v2.0.5] — 2026-04-09

### Changed

- `docs/setup/claude-code.md` — added Team Mode setup section:
  - Step 1 now includes `implementer-lead.md` and `teammates/` in the copy command and directory tree
  - New "Team Mode — additional setup" section: why Claude Code only (tool comparison table), how to activate, the RED/GREEN/REFACTOR spawn sequence with HITL test-plan gate, `agent` tool verification
  - Full pipeline diagram updated to show both implementation paths

---

## [v2.0.4] — 2026-04-09

### Changed

- `agents/implementer-lead.md` — restructured to apply real TDD methodology: RED phase (teammate-tests spawned first, all tests written before any implementation), HITL test-plan gate before GREEN phase, GREEN phase (backend + frontend + database spawned in parallel to make tests pass), REFACTOR phase. Added `agent` tool to frontmatter.
- `docs/workflow.md` — Team Mode description updated to reflect the three-phase TDD flow with the additional HITL gate between RED and GREEN
- `docs/agents.md` — Implementer Lead description updated to reflect RED/GREEN/REFACTOR coordination

---

## [v2.0.3] — 2026-04-09

### Changed

- `docs/workflow.md` — Team Mode warning block now includes a tool compatibility table explaining *why* Claude Code is required (agent-to-agent spawning via `agent` tool) vs Cursor, VS Code, JetBrains, Codex CLI (user-triggered only)
- `docs/agents.md` — Team Mode section now explains the technical reason for the Claude Code requirement
- `docs/overview.md` — Team Mode paragraph now mentions the technical distinction inline
- `docs/overview.md` — removed Claude-specific language from "The Problem It Solves" (`"isolated Claude instances"` → `"isolated AI agent instances"`) and from the file tree (removed model name comments)

---

## [v2.0.2] — 2026-04-09

### Added

- **Mermaid diagram** in `docs/workflow.md` — interactive flowchart showing the full pipeline with Phase 3 biforcation (Single Agent vs Team Mode)
- `mermaid` and `vitepress-plugin-mermaid` installed and configured in `docs/.vitepress/config.js`

### Fixed

- `agents/implementer-agent.md` — restored full content lost in v2.0.1: Phase 0 (implementation plan + HITL plan gate), TDD phases 1–6, model `claude-opus-4-6`, platform configurations (Claude Code / Cursor / VS Code), `.kairos/` output, issue tracker comments

### Removed

- `agents/implementer-coordinator.md` — removed; not referenced by the orchestrator and not part of the active pipeline

---

## [v2.0.1] — 2026-04-09

### Added

- **Implementer Team Pattern** (Claude Code only, optional)
  - `agents/implementer-lead.md` — Team coordinator (not a coder; creates binding contracts and spawns teammates)
  - `agents/teammates/teammate-tests.md` — Test specialist (RED phase first)
  - `agents/teammates/teammate-backend.md` — Backend specialist
  - `agents/teammates/teammate-frontend.md` — Frontend specialist
  - `agents/teammates/teammate-database.md` — Database specialist
- Team Mode routing in Orchestrator Phase 3 with explicit cost warning before activation
- Internal documentation guides:
  - `internal/COST-REALITY-CHECK.md` — Honest cost analysis (single agent vs team)
  - `internal/TEAM-MODE-PROVIDER-SPECIFICS.md` — Provider compatibility matrix
  - `internal/ROUTING-LOGIC-AGNOSTIC.md` — Why routing is agent decision logic, not code
  - `internal/IMPLEMENTER-TEAM-PATTERN.md` — Team pattern design rationale

### Changed

- `agents/orchestrator.md` — Phase 3 now routes to `implementer-agent` (default) or `implementer-lead` (Team Mode, only on explicit user request with cost warning)
- `agents/implementer-agent.md` — Clarified as default for **all** features, simple and complex alike
- Documentation updated to reflect the full 13-agent ecosystem (8 core + 5 team specialists)

### Notes

- Team Mode is Claude Code only; `implementer-agent` works everywhere (Claude Code, API, Local)
- Default remains single `implementer-agent` at ~$0.068/feature
- Team Mode costs ~$0.242/feature (3.5×) — only activated on explicit user request after confirming the cost warning

---

## [v2.0.0] — 2026-04-08

### Added

- 7-agent orchestration pipeline: Orchestrator, PM Agent, Architect Agent, Implementer Agent, Code Reviewer, Test Verifier, Release Planner
- Context Extractor — standalone pre-pipeline agent that produces `00-context.json`
- Human-in-the-Loop (HITL) gates after every pipeline phase
- Selective pipeline — users choose which agents to activate per run
- Issue tracker integration: Jira, GitLab Issues, Bitbucket Issues
- VitePress documentation site with full agent reference and setup guides
- Deployment configurations for Vercel, Netlify, GitHub Pages
- Pipeline Templates in setup guides
- Multi-tool support: Claude Code, Cursor, VS Code, JetBrains AI Assistant, OpenAI Codex CLI
- Feature folder isolation under `.kairos/<feature_folder>/` for audit trail

### Notes

- Initial public release
- Licensed under AGPL-3.0
