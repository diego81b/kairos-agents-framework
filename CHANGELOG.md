# Changelog

All notable changes to KAIROS Framework are documented in this file.

---

## v6.2.0 — July 30, 2026

### Added

- **`.kimi-code/agents/`** — new, hand-maintained mirror of the 11 core KAIROS agent files (`agents/`, not `agents/team/`), translated to Kimi Code's frontmatter schema. This mirror is far closer to the canonical format than the OpenCode one: `name:`, `description:`, and the `tools:` CSV copy over unchanged (Kimi Code accepts Claude-Code-style frontmatter natively and shares the same tool names, `AskUserQuestion` included); the only translation is `model: opus` → `model_preference: primary` and `model: sonnet` → `model_preference: secondary` — symbolic preferences that resolve to the user's configured Kimi models (`default_model` / `[secondary_model]` in `config.toml`), so the pack contains no Claude/Anthropic model ids at all. Every body is byte-for-byte identical to its `agents/` source — only frontmatter changed. The 5 Team Mode files (`agents/team/`) are deliberately excluded, same rationale as the OpenCode mirror: their coordination logic is Claude-Code-specific, and a frontmatter-only port would ship a non-functional agent.
- **`docs/setup/kimi-code.md`** — new setup guide for [Kimi Code](https://www.kimi.com/code/docs/en/): copying the shipped `.kimi-code/agents/` pack into a project (or user-level `~/.kimi-code/agents/`), the frontmatter mapping table with a worked `pm-agent.md` example, optional Kimi model configuration for the primary/secondary split (`default_model` + `[secondary_model]`, experimental `KIMI_CODE_EXPERIMENTAL_SECONDARY_MODEL=1` flag, `/secondary_model` TUI command), `AGENTS.md` project-context setup, session startup via `kimi --agent orchestrator-agent`, HITL via Kimi Code's **native `AskUserQuestion`** (gates take the same primary branch as Claude Code — no text-menu fallback, unlike OpenCode), copying `skills/contract-checklist/` into `.kimi-code/skills/`, a note on `${VAR}` template rendering (unknown variables stay verbatim, so the Bitbucket curl examples are safe), a feature-comparison table, and troubleshooting. Verified against the official Kimi Code docs (`kimi-code-cli/customization/agents.html`, `kimi-code-cli/configuration/config-files.html`).
- **`docs/.vitepress/config.js`, `docs/setup/index.md`, `docs/index.md`, `docs/roadmap.md`** — wired Kimi Code into the Setup nav/sidebar, the tool-comparison table (✅ native HITL via `AskUserQuestion`), and the "works with" / multi-tool-support enumerations alongside the other supported tools.
- **`AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md`** — documented the `.kimi-code/agents/` mirror and the mandatory rule that any change to an `agents/*.md` file must update its `.kimi-code/agents/` counterpart in the same commit, alongside the existing OpenCode mirror rule and with the same Team Mode exclusion.
- **`docs/setup/opencode.md`** — new "Customize models without forking the pack" section: per-agent model overrides via `opencode.json`'s `agent.<name>.model` (with a full 11-agent, two-tier example using `{env:...}` substitution), so users can point each KAIROS tier at any provider OpenCode gateways to without editing the shipped `.opencode/agents/*.md` files.
- **`docs/setup/claude-code.md`** — new "Customizing models" section documenting the three available override paths (edit `model:` frontmatter, the global `CLAUDE_CODE_SUBAGENT_MODEL` env override, project-scope shadow copies over plugin agents) and noting that no plugin-install-time configuration mechanism exists.
- **`docs/setup/kimi-code.md`** — model configuration section extended with `[secondary_model]` patch fields (`default_effort`, `max_output_size`) and the `KIMI_SECONDARY_MODEL` / `KIMI_SECONDARY_EFFORT` env overrides.

---

## v6.1.0 — July 30, 2026

### Added

- **`.opencode/agents/`** — new, hand-maintained mirror of the 11 core KAIROS agent files (`agents/`, not `agents/team/`), translated to OpenCode's frontmatter schema: `tools:` CSV → granular `permission:` object (`edit`/`bash` set per agent's actual write/exec access), `model: alias` → provider-prefixed model id, new `mode: primary|subagent` field (`orchestrator-agent` is the only `primary`), `name:` dropped (no equivalent). Every body is byte-for-byte identical to its `agents/` source — only frontmatter changed. The 5 Team Mode files (`agents/team/`) are deliberately excluded: their bodies depend on Claude Code's Agent Teams feature throughout (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`, spawning via Claude Code's `agent` tool, an unconditional `AskUserQuestion` call in `implementer-lead-agent.md`'s Test Plan Gate with no fallback) — a frontmatter-only port would ship a non-functional agent. No conversion script ships in this repo; the mirror is maintained by hand on purpose (see `.claude/CLAUDE.md`'s new "OpenCode Mirror Sync" rule and root `CLAUDE.md`'s "OpenCode Mirror" section).
- **`docs/setup/opencode.md`** — new setup guide for [OpenCode](https://opencode.ai): copying the shipped `.opencode/agents/` pack into a project, the frontmatter mapping table (for re-deriving the mirror by hand after an agent edit), a worked `pm-agent.md` example, `AGENTS.md` project-context setup, HITL via the existing text-menu fallback (OpenCode has no `AskUserQuestion`), a feature-comparison table, troubleshooting, and an explicit note on why Team Mode has no mirror. Verified against the current official OpenCode docs (`opencode.ai/docs/agents/`, `/docs/permissions/`, `/docs/tools/`, `/docs/rules/`), not the unofficial `open-code.ai` mirror.
- **`docs/.vitepress/config.js`, `docs/setup/index.md`, `docs/index.md`, `docs/roadmap.md`** — wired OpenCode into the Setup nav/sidebar, the tool-comparison table, and the "works with" / multi-tool-support enumerations alongside the other supported tools.
- **11 gated agent files** (`architect-agent.md`, `code-reviewer-agent.md`, `context-extractor-agent.md`, `impact-assessment-agent.md`, `implementer-coder-agent.md`, `implementer-tdd-agent.md`, `orchestrator-agent.md`, `pm-agent.md`, `release-planner-agent.md`, `security-reviewer-agent.md`, `test-verifier-agent.md`) — added "OpenCode" to the `AskUserQuestion`-unavailable fallback's example-host parenthetical, for consistency with the other non-Claude-Code hosts already listed. Cosmetic only — the fallback behavior was already host-agnostic. (`agents/team/implementer-lead-agent.md` has no equivalent host-listing text to edit, and its `AskUserQuestion` calls are intentionally left as-is — see above.)
- **`CLAUDE.md`, `.claude/CLAUDE.md`** — documented the `.opencode/agents/` mirror, the mandatory rule that any change to an `agents/*.md` file must update its `.opencode/agents/` counterpart in the same commit, and the explicit Team Mode exclusion.

---

## v6.0.1 — July 29, 2026

### Fixed

- **`agents/orchestrator-agent.md`** — added Hard Constraint 5: the orchestrator must never run headless (inside a backgrounded/detached task, a scripted multi-agent workflow, or a scheduled/cron run). HITL gates assume a live human either answers `AskUserQuestion` or reads/replies to the text-menu fallback (Constraint 3) — a fully non-interactive invocation has neither, so a gate would hang forever or get silently bypassed by the driving automation. Constraint 3's existing fallback wording was narrowed to make clear it covers a different case (a live human in a non-Claude-Code chat IDE), not headless execution.

---

## v6.0.0 — July 23, 2026

### Added

- **`agents/implementer-tdd-agent.md`, `agents/test-verifier-agent.md`** — the Phase 0 Test Cases table gained a declared `Intent` column (one line: the specific behavior the test locks in, not a restatement of its name), and `test-verifier-agent`'s Assertion Strength check gained an intent-consistency sub-check that flags a test whose actual assertion is narrower than (`medium`) or unrelated to (`high`) its declared intent. Missing intent data is skipped and noted once, never fabricated or flagged as its own issue. Operationalizes the PROOF methodology's "ogni test con intent dichiarato" requirement, closing a gap confirmed by direct comparison against `internal/PROOF_Constitution_v2.md` — the prior format had no place to declare *why* a test exists, only its name and category.
- **`agents/pm-agent.md`** — the Success Criteria step and output section now guide EARS-style phrasing (`When <trigger>, the <system> shall <response>`) wherever a criterion genuinely has a trigger and a response, instead of free-form prose only. Criteria that aren't trigger/response pairs stay plain prose — the template is guidance, not a mandatory mold — and Lean Mode (`simple_fix`) doesn't manufacture EARS-shaped criteria where none would otherwise exist. Tightens the same artifact `test-verifier-agent` already maps tests against (`AC-1`, `AC-2`, ...) and aligns with the Spec-Driven-Delivery positioning `internal/PROOF_v2_Proposta_Unificata.md` §5 stakes out (EARS is the notation Kiro/Spec-Kit converge on).
- **`agents/architect-agent.md`** — the existing Pre-Contract Resolution step (§5) now derives an explicit `promptable: yes|no` frontmatter signal: `yes` when every applicable contract question is resolved (or `N/A`) and no blocking ledger item remains; `no` otherwise, with a new `## Promptable Gaps` table naming exactly what's missing. Operationalizes PROOF's "Promptable" signature (an issue executable by an agent without further questions) at the point in the pipeline where enough is actually known to judge it — piggybacks on work Pre-Contract Resolution was already doing, rather than adding a new pass.
- **`agents/orchestrator-agent.md`** — the Architect Gate's default recommendation now reads `promptable: no` as a blocking signal (alongside `NEEDS_FIXES`/`VULNERABILITIES_FOUND`/`blocked`), flipping the default from Approve to Request changes and forwarding the Promptable Gaps table as re-run feedback. The final Present step gained an optional `RUN METRICS` block that surfaces the Phase 3/4 Loop Actuators' existing convergence data (first-pass vs. N-iterations-to-converge, thrash/exhausted outcomes) and the ledger's open-question count — explicitly labeled as this-run-only, not a substitute for PROOF's cross-run Velocity/Rework Ratio/Gate Pass Rate metrics, which need aggregation KAIROS's per-feature-folder model doesn't have.

This release is the outcome of a full PROOF↔KAIROS fit panorama (every PROOF Constitution/Proposta concept checked against actual agent behavior, not assumed) — see the session's plan artifact for the complete mapping, including what was already matched, what's confirmed out of KAIROS's reach (team cadence, role/capacity limits, the cross-run metrics dashboard), and what was deliberately skipped (a literal Gate 1/3 two-signature split would need a real second human reviewer or would be theater — neither is a KAIROS agent-file change).

---

## v5.4.0 — July 23, 2026

### Added

- **`agents/orchestrator-agent.md`, `agents/impact-assessment-agent.md`, `agents/team/implementer-lead-agent.md`** — the Risk/Contract-Mismatch Disposition Loops gained an on-demand explain trigger: if a human replies "explain"/"why"/"perché"/"spiega" instead of picking Accept/Mitigate/Escalate/Defer for a row, the loop now writes 2-4 plain-language sentences grounded in that row's actual file/code/design content — what could concretely go wrong, why it matters, what someone with no prior context on the row needs to know — then re-asks the same row instead of advancing or misfiling the reply as fix feedback. Every row stays terse by default; the depth is generated only when asked for, so review output doesn't grow for rows nobody needs explained. Closes the readability gap where dense one-line Risk/Issue/Finding rows (tuned for fast disposition) gave a junior dev no path to the reasoning behind a row before deciding.
- **`agents/pm-agent.md`, `agents/architect-agent.md`, `agents/code-reviewer-agent.md`, `agents/test-verifier-agent.md`, `agents/release-planner-agent.md`, `agents/impact-assessment-agent.md`, `agents/team/implementer-lead-agent.md`** — every Risks/Issues/Findings/Contract-Drift table gained the "see below" overflow pattern (previously only on `security-reviewer-agent.md`'s Findings table): when a row's reasoning doesn't fit one line, keep a one-line Description with a pointer and add a short prose paragraph under the table, instead of losing the reasoning to table-cell truncation. The explain trigger above reads from this same prose when present.

### Changed

- **`agents/architect-agent.md`** — the `## API Contracts` section's Request/Response examples changed from raw `json` code blocks to Markdown tables (Field | Type | Required | Constraints for requests; Status | Body for responses), matching the table style `## Data Model` already used in the same document. The two sections previously used two different conventions for structurally identical information.
- **`agents/team/implementer-lead-agent.md`** — the 4 Team Mode contracts (TEST, API, DATABASE, PATTERN), previously defined as raw JSON blocks pasted into teammate spawn prompts, are now Markdown: TEST as grouped bullet lists, API as per-endpoint request/response tables, DATABASE as one table per entity (matching architect's Data Model style) plus a compact Indexes line, PATTERN as nested bullets. Spawn-prompt wording updated from "paste CONTRACT JSON here" to "paste CONTRACT section here". No behavior change — these contracts are read as prompt text by other agents, never machine-parsed, so the format carries no compatibility burden (same rationale as the v5.0.0 artifact-format migration, applied here to in-body content that migration didn't reach). The `.claude/settings.json` example in the same file is unchanged — that one is a real config file, not KAIROS's own artifact format.

---

## v5.3.0 — July 18, 2026

### Added

- **`agents/implementer-tdd-agent.md` and `agents/implementer-coder-agent.md`** — gained Lean Mode, scaled to task effort: when `00b-impact.md` classifies the task as `effort: simple_fix` (or the agent's own standalone judgment agrees — ≤2 files, no new endpoint/schema/auth surface, no new dependency), the Phase 0 plan drops to Approach + file list (plus test names in the TDD agent), the Risks table and Waves section are omitted unless something genuinely surfaces, TDD test generation narrows to HAPPY PATH + ERROR CASES only, and the mandatory 2b Ledger Update becomes additive-only instead of a full re-walk of every row. Closes the gap where a 1-file fix paid the same fixed process cost as a multi-file feature — both implementers previously ran the same unconditional heavyweight process regardless of size, even though `impact-assessment-agent` already computes the effort classification needed to branch on. The Phase 0 HITL gate itself is unchanged — Lean Mode trims plan content, not the approval step.
- **`agents/pm-agent.md`, `agents/architect-agent.md`, `agents/test-verifier-agent.md`, `agents/code-reviewer-agent.md`, `agents/security-reviewer-agent.md`, `agents/context-extractor-agent.md`** — gained the same effort-scaled Lean Mode pattern, tuned per agent: pm-agent and architect-agent skip constraint/design categories that plainly don't apply and drop the Risks table when empty; architect-agent's "Propose 3 Design Options" collapses to one recommended approach with no real design fork; test-verifier-agent's Lean Mode specifically mirrors implementer-tdd-agent's narrowed test categories (boundary/edge coverage isn't required for tests that were never supposed to exist under Lean Mode, avoiding the same category of mismatch fixed below for code-reviewer/coder-agent) while leaving its assertion-strength/determinism/hygiene/mocking checks untouched since those already scale with actual test count; security-reviewer-agent's 7 adversarial checks are deliberately **not** trimmed by effort (it only runs when already judged sensitive) — only its ledger-update verbosity scales; context-extractor-agent (which runs before any effort classification exists) judges scope itself from the issue draft. Every agent's mandatory full-ledger-rewalk becomes additive-only in Lean Mode, matching the implementer pattern above.
- **`agents/team/implementer-lead-agent.md`** — gained Layer Scoping (new Step 1b): only spawns teammates for backend/frontend/database layers the architecture spec actually touches, instead of unconditionally spawning all three plus tests for every feature. A frontend-only UI change no longer spawns `teammate-database-agent`/`teammate-backend-agent` against empty contracts. Added stall handling to the three previously-unbounded N-of-N waits (RED-phase test wait, GREEN-phase parallel wait, REFACTOR re-verify wait): two silent progress checks trigger a direct message to the teammate, a third with no response surfaces the stall to the human instead of blocking indefinitely. Added a 2-repeat cap on the contract-mismatch correction loop before escalating to the human, mirroring the orchestrator's own monotonic-progress check.

### Fixed

- **`agents/code-reviewer-agent.md`** — the mandatory "Coverage >80%?" Testing check had no branch on which implementer produced the code, so every review of `implementer-coder-agent` output (which by design returns "no test files, no coverage report") failed this check by construction. The Testing check now first reads whether `03-implementation.md`'s frontmatter carries `tdd_verification`/`coverage_summary` fields; if absent (no-TDD path), it's marked `N/A — no-TDD path` and never counts toward `NEEDS_FIXES`.
- **`agents/orchestrator-agent.md`** — the Phase 3/4 Loop Actuators' `max_retries` came from unvalidated user input ("recommended max: 3" was a hint, never enforced), so a value like `auto 500` defeated the iteration cap; `N` is now clamped to a hard ceiling of 5. Both actuators also deleted their `## Loop State` unconditionally on exit, including after `thrash`/`exhausted` outcomes — with no memory of a failed loop, a human clicking "Request changes" at the HITL gate could silently re-arm a fresh full-budget auto-loop with no signal that this exact loop already failed to converge earlier in the same pipeline run. Thrash/exhausted exits now also write a persistent `## Loop History` entry (separate from `## Loop State`, survives its cleanup); re-arming when one exists now requires an explicit human choice instead of looping silently. The generic Error Handling fallback (used by non-actuated retries) now flags the 3rd consecutive no-progress retry instead of allowing indefinite silent retries with no monotonic-progress signal at all.

---

## v5.2.0 — July 18, 2026

### Added

- **`agents/implementer-coder-agent.md`** — gained Iteration Mode, mirroring `implementer-tdd-agent.md`: detected automatically from `## Loop State` in `ledger/open-questions.md`, skips the Phase 0 plan gate, scopes work to `loop_state.cumulative_issues`, and emits a `## Changes This Iteration` section plus an `iteration_mode` frontmatter field. Closes the gap where this agent had no way to do a targeted fix pass — a full re-run would re-plan from scratch every time.

### Fixed

- **`agents/orchestrator-agent.md` — Phase 3 and Phase 4 Loop Actuators** — both auto-retry loops hardcoded a re-invocation of `implementer-tdd-agent`, regardless of which implementer variant actually ran Phase 3. If the user had picked `implementer-coder-agent` (explicitly for a project with no test suite) or Team Mode's `implementer-lead-agent` (after confirming its 3.5× cost gate) and enabled `auto` loop policy, a `NEEDS_FIXES` verdict would silently re-invoke `implementer-tdd-agent` instead — abandoning the chosen implementation strategy mid-pipeline with no warning. Both actuators now re-invoke whichever of `implementer-tdd-agent` / `implementer-coder-agent` was selected in Step 3's routing decision (both now support Iteration Mode). Step 0e's Loop Policy prompt is gated the same way: Team Mode forces `loop_policy` to `manual` for both phases with an explanation shown to the user, since `implementer-lead-agent` has no Iteration Mode yet — a full re-run there would re-spawn the whole team from scratch rather than apply a targeted fix. Building that (re-spawning only the teammates needed for a fix, with contracts pinned) is a larger design task, deferred as a follow-up rather than built this pass.
- **`agents/team/implementer-lead-agent.md`** — Step 1 "Analyze Architect Output" still showed a JSON example for the architect's output, stale since v5.0.0 moved `02-architecture.md` to Markdown+frontmatter (Step 2b's Contract Consistency Check already read it correctly — Step 1's example didn't). Updated to point at the actual Markdown sections (`## API Contracts`, `## Data Model`, `## Integration Points`, `## Error Codes & Handling`).

---

## v5.1.0 — July 18, 2026

### Added

- **`agents/architect-agent.md`** — gained a `## Risks` table (universal 5-column shape, `risk_counts`/`open_dispositions` frontmatter fields), closing the one gap in v5.0.0's Risk Disposition Loop rollout: architecture-level trade-offs (single points of failure, vendor lock-in, migration risk) now resolve row-by-row at the gate like every other phase's risks, instead of living only as prose in "Selected Option".
- **`agents/orchestrator-agent.md` HITL section — Constraint-Conflict Scan (step 1b)** — after each phase's own Ledger Update and before the Risk Disposition Loop, the orchestrator now reads `ledger/constraints.md` against the phase's actual output and checks whether it contradicts a constraint an *earlier* phase already marked resolved — a semantic read, not a status-symbol diff, since a constraint's Status cell records only what the acting agent claims, and no agent currently cross-checks its own output against constraints older than the immediately preceding phase. A genuine conflict is appended as a `high`-impact row to the phase's own Risks/Issues/Findings/Contract-Drift table (creating a minimal one under `## Flagged Conflicts` if the phase has none), feeding straight into the existing Risk Disposition Loop with no separate menu.

---

## v5.0.0 — July 18, 2026

### Changed

- **BREAKING: every pipeline artifact is now a single Markdown file with a YAML frontmatter header, replacing every `.json` contract and `.json`+`.md` pair.** Nothing in this repo parses these files programmatically — every consumer is either another agent reading the file as prompt text or a human at a HITL gate — so JSON bought nothing and actively hurt legibility (a real `01-requirements.json` came back with 8 risk objects full of paragraph-length prose, unreadable as raw JSON — the finding that started this change). Filenames: `00-context.json` → `00-context.md`, `00b-impact.json` → `00b-impact.md`, `01-requirements.json` → `01-requirements.md`, `02-architecture.json` + `02-architecture.md` → single `02-architecture.md`, `03-implementation.json` → `03-implementation.md` (the implementer's Phase 0 plan now saves separately to `03-implementation-plan.md`, restoring the separation the old `03-implementation-plan.json` had — a shared filename would make a wave-2+ resume read wave 1's final summary instead of the original plan), `04-review.json` + `.md` → single `04-review.md`, `04b-security-review.json` + `.md` → single `04b-security-review.md`, `05-test-verification.json` + `.md` → single `05-test-verification.md`, `06-deployment-plan.json` + `.md` → single `06-deployment-plan.md`. Frontmatter carries only what the orchestrator branches on (`status`, count fields, `next_agent`); everything else is a Markdown body. Affects all 11 agent files, `agents/orchestrator-agent.md`, and every page under `docs/` plus `CLAUDE.md` that named these files.
- **Every Risks/Issues/Findings table now carries a universal 5-column shape** — `ID | Description | Impact | Mitigation/Fix | Disposition` — normalizing formats that previously varied per agent: pm-agent's `{risk, impact, mitigation}`, impact-assessment's `{risk, implication}` (no impact rating), implementer's flat risk strings (no impact or mitigation), code-reviewer's `Severity|Category|File:Line|Description` (no fix column), security-reviewer's per-finding H3 blocks, release-planner's `Risk|Detection|Response` (no severity).

### Added

- **Risk Disposition Loop** (`agents/orchestrator-agent.md` HITL section) — when a phase's output has a Risks/Issues/Findings table with undispositioned rows, the human now resolves each one — **Accept / Mitigate now / Escalate / Defer** — before the whole-artifact Approve/Request changes/Skip next/Stop gate, instead of approving or rejecting every item as a single bundle. **Mitigate now** and **Escalate** write directly to `ledger/constraints.md` / `ledger/open-questions.md`, sourced from the human's per-row choice rather than the agent silently authoring the disposition itself. An unresolved **Escalate** biases the following gate's recommended default to Request changes without blocking Approve. `agents/impact-assessment-agent.md` and `agents/team/implementer-lead-agent.md` carry a local copy of the same mechanic, since both agents' gates never route through the orchestrator's HITL section.

---

## v4.2.0 — July 17, 2026

### Added

- **`agents/architect-agent.md`, `agents/code-reviewer-agent.md`, `agents/security-reviewer-agent.md`, `agents/test-verifier-agent.md`, `agents/release-planner-agent.md`** — each now writes two files instead of one: a lean JSON contract (status, counts, short refs) and a Markdown report (full data model, issues table, security findings, or deployment runbook). Fixes reports like a full data-model dump landing as one giant, unreadable nested-JSON file at the architecture gate — the same content renders as scannable Markdown tables in the new companion `.md` file. Downstream consumers (`implementer-tdd-agent.md`, `implementer-coder-agent.md`, `security-reviewer-agent.md`, `code-reviewer-agent.md`, `team/implementer-lead-agent.md`) and the orchestrator's file-open/issue-tracker-comment steps were updated to read/post the `.md` instead of the raw JSON.
- **`agents/orchestrator-agent.md`** — HITL gates and the Step 0b feature-folder collision check now use `AskUserQuestion` only where it's actually available (Claude Code), and fall back to the pre-4.1.0 printed text-menu everywhere else. All 10 phase-agent gates and the orchestrator's canonical HITL section gained the same fallback.

### Fixed

- **All 12 gated agent files** — the v4.1.0 gate rewrite made `AskUserQuestion` mandatory unconditionally, which silently broke HITL enforcement on Cursor, JetBrains/Copilot, and Codex CLI (none of which have that tool — see `docs/setup/cursor.md` and `docs/setup/jetbrains.md`, which document HITL there as printed-menu-only). Restored the text-menu fallback for every gate.
- **`CLAUDE.md`, `docs/workflow.md`, `docs/overview.md`, `docs/agents.md`, `docs/setup/*.md`** — pipeline tables, file-tree examples, and HITL checkpoint descriptions updated to reflect the new `.json` + `.md` output pairs and the `AskUserQuestion`-or-fallback gate mechanism; a stale security-reviewer output filename in `CLAUDE.md`'s pipeline table (`04b-security.json` → `04b-security-review.json`) corrected to match what every agent file actually uses.
- **`agents/team/implementer-lead-agent.md`** — Step 2b's Contract Consistency Check still pointed the API/database contract verification at `02-architecture.json` alone; the data it compares against (API contracts, full schema) moved to `02-architecture.md`.
- **`agents/test-verifier-agent.md`** — acceptance-criteria mapping pointed at `02-architecture.json`, a field architect-agent never produces (in either the `.json` or the new `.md`). Repointed to `success_criteria[]` in `01-requirements.json` (pm-agent), the field that actually holds them; since that list has no IDs, test-verifier now numbers them `AC-1`, `AC-2`, ... in list order.

---

## v4.1.0 — July 17, 2026

### Added

- **`agents/*.md`, `agents/team/implementer-lead-agent.md`** — all 12 pipeline agents (plus the orchestrator) now gate on the `AskUserQuestion` tool instead of printing a text menu and waiting for a typed reply. Each gate marks a `(Recommended)` option derived from the agent's own status field (`NEEDS_FIXES`, `VULNERABILITIES_FOUND`, `blocked`, critical/high issues), and free-text answers are folded into change-request feedback or a ledger note. Fixes the inconsistent, improvised gate presentation reported across agents.
- **`agents/orchestrator-agent.md`** — feature-folder collision check in Step 0b: if `.kairos/<feature_folder>/` already exists, asks the user (Resume existing / Create new folder / Stop) instead of silently overwriting prior phase outputs on repeat runs.

### Fixed

- **`agents/orchestrator-agent.md`** — two `Step 0b` sections existed with duplicate numbering; the ledger-init step referenced `feature_folder` before the derive-folder step that defines it. Merged and reordered into a single `0a`–`0f` sequence (derive folder → init ledger → read issue → select agents → announce pipeline).
- **`agents/orchestrator-agent.md`** — Step 0c ("Read Issue Body") referred to itself ("go to Step 0c") instead of the next step; corrected to point at Step 0e.
- **`agents/pm-agent.md`, `agents/architect-agent.md`, `agents/implementer-tdd-agent.md`, `agents/implementer-coder-agent.md`, `agents/code-reviewer-agent.md`, `agents/security-reviewer-agent.md`, `agents/test-verifier-agent.md`, `agents/release-planner-agent.md`, `agents/context-extractor-agent.md`, `agents/impact-assessment-agent.md`** — each agent's own standalone gate ("Present for Validation") had drifted from the orchestrator's canonical HITL option set (3 options and a literal "show the JSON" instruction vs. the orchestrator's 5). Standardized and marked as standalone-only — the orchestrator owns gate presentation whenever it's driving the pipeline.

---

## v4.0.0 — June 28, 2026

### Added

- **`agents/orchestrator-agent.md`** — agentic loop actuator: optional auto-retry loops for Phase 3 (Implementer ↔ Test Verifier) and Phase 4 (Code Reviewer ↔ Implementer). Consent gate with cost estimate shown at agent selection. Loop state stored in the ledger (`## Loop State` section of `open-questions.md`), not in agent prompts.
- **`agents/orchestrator-agent.md`** — Guard 3: mandatory single-pass test-verifier invocation after any Phase 4 loop run, to detect regressions introduced by code-review-driven fixes before the Phase 4 HITL gate.
- **`agents/implementer-tdd-agent.md`** — Iteration Mode: detected automatically from ledger when `## Loop State` with `status: in_progress` exists. In this mode the Phase 0 plan gate is skipped and focus is scoped to `cumulative_issues` only.
- **`agents/test-verifier-agent.md`** — `convergence_signal` field added to JSON output and written to `## Loop State` in ledger (when present). Provides `issues_critical_high`, `issues_total`, `coverage_delta`, and `iteration` for orchestrator loop decisions.
- **`agents/code-reviewer-agent.md`** — same `convergence_signal` output field and ledger write for Phase 4 loop convergence tracking.
- **`docs/agentic-loop.md`** — new documentation page covering loop mechanics, termination guarantees, HITL preservation, ledger state store, Guard 3, cost estimates, and backward compatibility.

### Changed

- **Pipeline paradigm** — KAIROS shifts from purely linear HITL to optional intra-phase agentic loops. Default remains `manual` (backward compatible with v3.x). Loops are opt-in per pipeline run.
- **`docs/.vitepress/config.js`** — added "Agentic Loop" entry to sidebar under Development.

---

## v3.4.0 — June 26, 2026

### Added

- **`agents/*.md`, `agents/team/implementer-lead-agent.md`** — shared ledger system across all 12 pipeline agents. Each agent now reads `.kairos/<feature_folder>/ledger/` at phase start and updates it at phase end with mandatory accounting: every existing constraint row must be marked resolved / deferred / open / modified / dropped before adding new ones.
- **`agents/orchestrator-agent.md`** — ledger lifecycle management: creates `ledger/` directory on pipeline init, offers optional human annotation at each HITL gate, and warns about unresolved open-questions at pipeline end.
- **`agents/pm-agent.md`** — primary ledger seeder: populates `ledger/constraints.md` and `ledger/open-questions.md` from requirement analysis.
- **`agents/architect-agent.md`** — seeds `ledger/decisions.md`, performs the first full accounting pass over all PM constraints.
- **`agents/context-extractor-agent.md`** — optional early ledger seeder: creates `ledger/constraints.md` with codebase-derived constraints (naming rules, no-touch zones, compatibility requirements) before the main pipeline starts.

### Changed

- **Pipeline structure** — `.kairos/<feature_folder>/` now includes a `ledger/` subdirectory containing three living files: `constraints.md` (table of constraints with per-phase status), `decisions.md` (table of architectural and implementation decisions), `open-questions.md` (table of cross-phase questions with answers). Phase JSON files (01–06) are unchanged.
- **Forced accounting model** — each agent must update the Status column of every existing constraint row before adding new ones. Unaddressed constraints remain `🔴 open` and are visible to all downstream agents. This eliminates silent information loss between phases (the "telephone game" problem).
- **Team Mode** — only `implementer-lead-agent` reads and writes the ledger; teammates work via binding contracts and never touch `ledger/` directly.

---

## v3.3.0 — June 6, 2026

### Added

- **`agents/*.md`, `agents/team/*.md`** — optional-enhancement sections across all 15 agents; each agent declares which skills and MCP tools enhance it, with inline conditional instructions (`> If skill X is available, invoke it; else apply inline checklist`). KAIROS remains fully functional without any external install — all enhancements are additive only.
- **`docs/skills-mcp.md`** — new VitePress page documenting the full skills/MCP ecosystem: MCP table, skills table, Trail of Bits plugin breakdown, copy-paste install commands, full agent × enhancement map, and gap section (database MCP, deploy MCP, LSP).
- **`docs/.vitepress/config.js`** — Skills & MCP Enhancements page added to sidebar under Core Agents.
- **`docs/agents.md`** — per-agent VitePress tip callouts listing declared skills and MCP tools with install commands.
- **`README.md`** — Optional Enhancements section with recommended installs and link to the new docs page.

### Changed

- **Trail of Bits plugin scope** — 11 plugins declared as optional enhancements in agent files (`differential-review`, `insecure-defaults`, `supply-chain-risk-auditor`, `static-analysis`, `variant-analysis`, `sharp-edges`, `property-based-testing`, `mutation-testing`, `fp-check`, `ask-questions-if-underspecified`, `audit-context-building`). `testing-handbook-skills` and `trailmark` excluded: those plugins bundle 15 and 10 skills respectively; only 1 skill from each was needed, so inline fallback instructions are used instead.
- **MCP wiring** — Chrome DevTools MCP and Playwright MCP declared in `test-verifier-agent`, `teammate-tests-agent`, `teammate-frontend-agent`.
- **karpathy-guidelines** — declared in all implementer and teammate agents.

---

## v3.2.3 — June 2, 2026

### Added

- **`docs/distribution/02-plugin-install.md`** — Phase 1.3 canonical install guide: prerequisites, install commands (`kairos@kairos-agents-framework`), full agent namespace reference tables (core and Team Mode), contract checklist skill access, global-scope clarification for `/plugin` commands, per-project isolation note, and Phase 1.4 routing test requirements.
- **`docs/.vitepress/config.js`** — Phase 1.3 install guide added to Distribution sidebar.

### Changed

- **`.claude-plugin/marketplace.json`** — marketplace `name` set to `kairos-agents-framework`; install commands use `kairos@kairos-agents-framework`.
- **`docs/setup/claude-code.md`** — "Enable Agent Teams" section expanded: all three scopes for `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` documented (project-level `.claude/settings.json`, global `~/.claude/settings.json`, shell session export).
- **`docs/distribution/01-plugin-mapping.md`** — marketplace manifest example updated to match renamed `name` field.

### Fixed

- **`docs/.vitepress/config.js`** — dead sidebar link for Contract Checklist (`agents/shared/contract-checklist` → `skills/contract-checklist/SKILL`).
- **`docs/agent-files.md`** — dead link for Contract Checklist (`agents/shared/contract-checklist.md` → `skills/contract-checklist/SKILL.md`).

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
