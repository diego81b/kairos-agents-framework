# Distribution Roadmap

> **Goal:** make KAIROS installable and shareable. **Phase 1** packages it as a native Claude Code
> plugin (faithful repackaging of what exists). **Phase 2** exposes it as an MCP server (a genuine
> re-architecture, not a reformat). Phase 1 first; Phase 2 builds on the understanding gained.

---

## Guiding Principles

1. **Verify the format from the source — do not invent it.** Plugin manifests and MCP SDK details
   are recent and evolving. Use the in-environment skills and the official docs as the source of truth.
   If a format detail is uncertain, surface it as a question — never fabricate a manifest field, file
   path, or CLI command.
2. **Preserve what already works.** KAIROS's value is its agents, the HITL gates, fresh-context-per-phase,
   collapse detection, the JSON audit trail, and `active_agents` selection. Packaging must not weaken these.
3. **"Where does it live to actually work?" is a first-class question, not an afterthought.** Every phase
   must end with a concrete, verified answer to: where do the files go, and what (if anything) must run,
   for this to work for me and for my team.
4. **Discovery before building.** Each phase starts by establishing the real structure, presents findings
   for approval, and only then builds.

---

## Phase 0 — Discovery ✅

- [x] **Plugin structure:** manifest is `.claude-plugin/plugin.json` (only `name` required); agents/,
      skills/, commands/ at plugin root; auto-discovered, no manifest required.
- [x] **Where a plugin lives:** git repo + marketplace manifest (`.claude-plugin/marketplace.json`).
      Install via `/plugin marketplace add owner/repo` then `/plugin install kairos@marketplace-name`.
      No build step — purely file-based.
- [x] **MCP setup:** Tier 1 SDKs: TypeScript, Python, C#, Go. Transports: stdio (local subprocess)
      or Streamable HTTP (remote, replaces deprecated SSE). Local: `claude mcp add --transport stdio`.
      Remote: `claude mcp add --transport http`.
- [x] **Where an MCP server lives:** local = npm/pip/binary on each user's machine, no hosting.
      Remote = always-on hosted process (Railway, Render, Cloudflare, custom VPS).

**Output:** [`docs/distribution/00-discovery.md`](/distribution/00-discovery) — verified structures and
"where it lives" answers.

### Phase 0 Review Decisions

Three decisions made during review, applied to Phase 1:

**Decision 1 — `.claude/CLAUDE.md` excluded from plugin.**
Contains contributor discipline (versioning rules, commit convention) — not relevant to plugin users.
Plugin ships agents and the checklist skill only.

**Decision 2 — `defaultEnabled: false`.**
KAIROS ships 14 core agents (+ 5 Team Mode specialists). Auto-enabling all on install causes "wrong agent fires" collisions in the
user's main context. Plugin is opt-in: install, then `/plugin enable kairos@...` when the pipeline is needed.

**Decision 3 — Agent namespacing is the primary risk, not a side note.**
Skills are namespaced (`plugin-name:skill-name`). Whether agents follow the same pattern is
undocumented. KAIROS has 9 @-notation calls in `orchestrator-agent.md` and 4 Agent Teams spawn type
names in `implementer-lead-agent.md` — all break under namespacing if bare names stop resolving.
Must verify empirically before Phase 1.2.

---

## Phase 1 — Claude Code Plugin

Faithful repackaging. KAIROS agents stay as agents; the shared `contract-checklist` becomes the
plugin's first real skill.

### 1.1 — Map KAIROS onto plugin structure ✅

- [x] Inventory: 11 core agents, 5 team agents, `contract-checklist` shared reference, `.claude/CLAUDE.md`
      (contributor-only, excluded), `00–06` JSON convention (preserved via agent instructions).
- [x] Mapped all components to plugin slots. Two path references need updating (architect + implementer-lead
      → checklist path changes when moved to `skills/`). No slot has no home.
- [x] `contract-checklist` → `skills/contract-checklist/SKILL.md` (slash-command: `/kairos:contract-checklist`).
      No other components become commands — orchestrator is the entry point, not a slash-command.

**Output:** [`docs/distribution/01-plugin-mapping.md`](/distribution/01-plugin-mapping) — full component
inventory, agent-to-agent invocation list (13 call points), namespacing blocker documented.

### 1.2 — Build the plugin

**Hard blocker: verify agent namespacing empirically before starting.**
Install a test plugin with two agents; confirm whether `@agent-b` or `@plugin-name:agent-b` resolves.
Document the result. Then:

- [x] Create `.claude-plugin/plugin.json` (`name: kairos`, `defaultEnabled: false`).
- [x] Create `.claude-plugin/marketplace.json` (self-hosted, same repo).
- [x] Create `skills/contract-checklist/SKILL.md` (move content from `agents/shared/contract-checklist.md`).
- [x] Update `agents/architect-agent.md:63` and `agents/team/implementer-lead-agent.md:93` — checklist path.
- [x] Agents ARE namespaced (Case B confirmed empirically): updated 9 @-notation calls in `orchestrator-agent.md` and 4 spawn type names in `implementer-lead-agent.md` (`kairos:` prefix for core agents, `kairos:team:` for team subfolder agents).
- [x] Remove `agents/shared/contract-checklist.md` (replaced by skill).

### 1.3 — Where it lives

- [ ] State exactly where the plugin is published: the git repository and the marketplace manifest
      that points to it.
- [ ] Write `docs/distribution/02-plugin-install.md` — the literal steps the team runs to get KAIROS.
- [ ] Confirm: nothing needs to "run". Distribution = push to git + the install steps above.

### 1.4 — Test before declaring done

- [ ] Install the plugin fresh (as a teammate would), then run KAIROS on one small real feature end-to-end.
- [ ] Verify the HITL gates, `active_agents` selection, and the `.kairos/` audit trail still behave
      exactly as before packaging.
- [ ] **Mandatory routing test:** full pipeline run (orchestrator → pm → architect → implementer-tdd →
      reviewer → test-verifier) AND full Team Mode run (orchestrator → implementer-lead → 4 teammates).
      Both must complete without agent-resolution failures. A green install that never tested
      agent-to-agent routing proves nothing.

**Phase 1 complete only when a fresh install runs a real feature correctly and `02-plugin-install.md`
documents the exact install path.**

---

## Phase 2 — MCP Server

::: warning This is not "KAIROS over a different transport"
MCP exposes *tools* (stateless function calls), while KAIROS is built on isolated subagents, HITL
approval gates, and fresh-context-per-phase. Those do **not** map onto MCP tools directly. Phase 2
starts with a design decision, not with code.
:::

### 2.1 — The translation decision

- [ ] Decide what, concretely, becomes an MCP tool. Options to evaluate:
  - Expose each phase as a tool that returns its structured output (the model orchestrates between calls)
  - Expose a single "run pipeline" tool that drives the phases server-side
  - Expose only the read-only analysis pieces as tools, leaving orchestration to the client
- [ ] Be explicit about what is lost or must be re-implemented vs the plugin: HITL gates, fresh-context
      isolation, collapse-detection discipline.
- [ ] **Output:** `docs/distribution/02-mcp-design.md`. Stop for approval — this decision determines
      everything downstream.

### 2.2 — Choose the hosting model

- [ ] **Local (stdio):** server runs on each user's machine; distributed as an installable package
      (npm/pip) or a local command. No hosting, no URL. Simpler; per-user setup.
- [ ] **Remote (HTTP/SSE):** server runs as a hosted process reachable by URL. Requires real hosting
      (Railway / Render / Cloudflare / VPS), a deployment pipeline, and operational concerns.
- [ ] Recommend one based on actual need (team-internal vs broad/multi-client) and justify it.

### 2.3 — Build

- [ ] Implement the chosen tool surface using the SDK/language from the skill.
- [ ] Reuse KAIROS's contracts/checklist as the server's domain logic where it maps cleanly.

### 2.4 — Where it lives

- [ ] If **local:** document in `docs/distribution/03-mcp-setup.md` the exact package to install and
      the literal config block a user adds to connect Claude Code to the local server.
- [ ] If **remote:** document the deployment target, how to deploy, the resulting URL, secrets/env
      management, and the literal client config that points at the URL.

### 2.5 — Test before declaring done

- [ ] Connect a fresh client to the server and exercise the exposed tools on one real case.
- [ ] Verify behavior matches the design note, and that the stated limitations (e.g. no HITL) are
      what actually happens.

---

## Sequencing

1. **Phase 0** — discovery, present findings, stop.
2. **Phase 1** — plugin: map → build → publish to git → document install → test fresh install. Stop.
3. **Phase 2** — MCP: design decision (stop) → hosting decision → build → document where it lives → test.

CHANGELOG entry + version bump accompany each phase's changes, per the repo's versioning rules.
Do not batch them to the end.

---

## Where Things Live

| Artifact | Lives where | Must something run? | How the team gets it |
|---|---|---|---|
| Claude Code plugin | git repo + marketplace manifest | No | add marketplace → install plugin |
| MCP server (local) | installable package on each machine | Yes — locally, per user | install package → add local config block |
| MCP server (remote) | hosted process at a URL | Yes — always-on hosted | add client config pointing at the URL |
