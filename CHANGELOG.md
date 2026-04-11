# Changelog

All notable changes to KAIROS Framework are documented in this file.

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
