# Phase 1.1 — KAIROS → Plugin Mapping

> **Status:** Complete. Phase 1.2 build complete as of v3.2.0.
> Namespacing blocker resolved: Case B confirmed (plugin agents ARE namespaced). All @-calls and spawn type names updated.

---

## Decisions Applied (from Phase 0 review)

| # | Decision | Applied |
|---|----------|---------|
| 1 | `.claude/CLAUDE.md` excluded — contributor-only | Excluded from plugin |
| 2 | `defaultEnabled: false` | Set in `plugin.json` |
| 3 | Agent namespacing is the primary risk — verify before build | Flagged as gating blocker below |
| — | `contract-checklist` → `skills/contract-checklist/SKILL.md` | Mapped; two path refs need updating |
| — | Self-hosted marketplace manifest in same repo | Mapped below |

---

## Component Inventory → Plugin Slots

### Core Pipeline Agents (11 files)

| KAIROS source | Plugin slot | Notes |
|---------------|-------------|-------|
| `agents/context-extractor-agent.md` | `agents/context-extractor-agent.md` | No changes needed |
| `agents/impact-assessment-agent.md` | `agents/impact-assessment-agent.md` | No changes needed |
| `agents/orchestrator-agent.md` | `agents/orchestrator-agent.md` | **Contains all @-notation calls** — see Namespacing below |
| `agents/pm-agent.md` | `agents/pm-agent.md` | No changes needed |
| `agents/architect-agent.md` | `agents/architect-agent.md` | **1 path ref to checklist** — update required |
| `agents/implementer-tdd-agent.md` | `agents/implementer-tdd-agent.md` | No changes needed |
| `agents/implementer-coder-agent.md` | `agents/implementer-coder-agent.md` | No changes needed |
| `agents/code-reviewer-agent.md` | `agents/code-reviewer-agent.md` | No changes needed |
| `agents/security-reviewer-agent.md` | `agents/security-reviewer-agent.md` | No changes needed |
| `agents/test-verifier-agent.md` | `agents/test-verifier-agent.md` | No changes needed |
| `agents/release-planner-agent.md` | `agents/release-planner-agent.md` | No changes needed |

### Team Mode Agents (5 files)

| KAIROS source | Plugin slot | Notes |
|---------------|-------------|-------|
| `agents/team/implementer-lead-agent.md` | `agents/team/implementer-lead-agent.md` | **4 spawn type names + 1 path ref to checklist** — see below |
| `agents/team/teammate-tests-agent.md` | `agents/team/teammate-tests-agent.md` | No changes needed |
| `agents/team/teammate-backend-agent.md` | `agents/team/teammate-backend-agent.md` | No changes needed |
| `agents/team/teammate-frontend-agent.md` | `agents/team/teammate-frontend-agent.md` | No changes needed |
| `agents/team/teammate-database-agent.md` | `agents/team/teammate-database-agent.md` | No changes needed |

### Shared Reference → Skill

| KAIROS source | Plugin slot | Notes |
|---------------|-------------|-------|
| `agents/shared/contract-checklist.md` | `skills/contract-checklist/SKILL.md` | Path moves; 2 refs in agent files need updating |

### Excluded

| KAIROS source | Reason |
|---------------|--------|
| `.claude/CLAUDE.md` | Contributor-only (versioning rules, commit convention). Not for plugin users. |

### New (plugin infrastructure)

| New file | Purpose |
|----------|---------|
| `.claude-plugin/plugin.json` | Plugin manifest |
| `.claude-plugin/marketplace.json` | Self-hosted marketplace manifest (same repo) |

---

## Plugin Manifest (`plugin.json`)

```json
{
  "name": "kairos",
  "displayName": "KAIROS Framework",
  "version": "3.1.2",
  "description": "Intelligent multi-agent SDLC pipeline with human-gated phases",
  "author": { "name": "Diego Baldeschi", "email": "diego.baldeschi@comm-it.it" },
  "homepage": "https://kairos-docs.vercel.app",
  "repository": "https://github.com/diego81b/kairos-agents-framework",
  "license": "AGPL-3.0",
  "keywords": ["kairos", "sdlc", "agents", "pipeline", "tdd"],
  "defaultEnabled": false
}
```

---

## Marketplace Manifest (`.claude-plugin/marketplace.json`)

```json
{
  "name": "kairos-marketplace",
  "owner": { "name": "Diego Baldeschi", "email": "diego.baldeschi@comm-it.it" },
  "plugins": [
    {
      "name": "kairos",
      "description": "KAIROS multi-agent SDLC pipeline",
      "source": { "source": "github", "repo": "diego81b/kairos-agents-framework" }
    }
  ]
}
```

---

## Required File Edits (path references, not behavior changes)

### 1. `agents/architect-agent.md:63`

Current:
```markdown
work through [`agents/shared/contract-checklist.md`](shared/contract-checklist.md)
```

Required (checklist moves to `skills/`):
```markdown
work through [`contract-checklist`](../skills/contract-checklist/SKILL.md)
```

### 2. `agents/team/implementer-lead-agent.md:93`

Current:
```markdown
work through [`agents/shared/contract-checklist.md`](../shared/contract-checklist.md)
```

Required:
```markdown
work through [`contract-checklist`](../../skills/contract-checklist/SKILL.md)
```

These are path-only updates. Agent behavior (read the checklist, resolve all items) is unchanged.

---

## Agent-to-Agent Invocation Inventory

### @-notation calls (orchestrator-agent.md)

These are the actual routing dispatches — the lines that will break if agents are namespaced.

| Line | Call | Called agent |
|------|------|-------------|
| 178 | `Call @pm-agent` | pm-agent |
| 179 | `Call @architect-agent` | architect-agent |
| 184 | `call @implementer-tdd-agent directly` | implementer-tdd-agent |
| 185 | `call @implementer-coder-agent directly` | implementer-coder-agent |
| 186–203 | `proceed with implementer-lead-agent` (implied @-call after user confirmation) | implementer-lead-agent |
| 204 | `Call @code-reviewer-agent` | code-reviewer-agent |
| 205 | `Call @security-reviewer-agent` | security-reviewer-agent |
| 206 | `Call @test-verifier-agent` | test-verifier-agent |
| 207 | `Call @release-planner-agent` | release-planner-agent |

**Total: 9 @-notation invocations** in `agents/orchestrator-agent.md`.

### Agent Teams spawn calls (implementer-lead-agent.md)

These use "agent type" names — the string passed to the Agent Teams API. Same namespacing risk.

| Lines | Call | Agent type name |
|-------|------|----------------|
| 264, 269, 293 | `using the teammate-tests-agent agent type` | `teammate-tests-agent` |
| 331 | `using teammate-backend-agent type` | `teammate-backend-agent` |
| 348 | `using teammate-frontend-agent type` | `teammate-frontend-agent` |
| 363 | `using teammate-database-agent type` | `teammate-database-agent` |

**Total: 4 spawn-type names** in `agents/team/implementer-lead-agent.md`.

### Textual references (non-invocations)

All other agent-name mentions (Available Subagents lists, menu options, recommendation matrices,
pipeline display labels) are text the model reads — they are documentation, not routing code.
If namespacing changes, these need updating for correctness but cannot cause routing failures.

---

## Namespacing Blocker

**Status: RESOLVED — Case B confirmed (v3.2.0).**

Verified empirically: the Claude Code Agent tool rejects bare agent names for plugin agents.
`cavecrew-investigator` (bare) → "Agent type not found"; `caveman:cavecrew-investigator` (scoped) → resolves.
Official docs confirm: plugin agents appear under scoped names in the typeahead (`plugin-name:agent-name`),
and agents in a plugin subfolder include the subfolder path: `plugin:folder:agent-name`.

**Applied in v3.2.0:**
- 9 @-notation calls in `orchestrator-agent.md` updated to `kairos:` prefix.
- `implementer-lead-agent.md` in `agents/team/` → team agents use `kairos:team:` prefix.
- 4 spawn type names updated: `kairos:team:teammate-tests-agent`, etc.

**Phase 1.4 still mandatory:** verify routing works in a live plugin install.

**Phase 1.4 must test** (regardless of which case applies):
- Full single-agent pipeline: orchestrator → pm → architect → implementer-tdd → reviewer → test-verifier
- Full Team Mode run: orchestrator → implementer-lead → teammate-tests → (backend + frontend + database)
- Both must reach completion without routing failures. A green install that skips agent-to-agent routing proves nothing.

---

## Slash-Command for Contract Checklist

Skill-access format: `/kairos:contract-checklist`

Update any user-facing documentation (install guide, README) to reference this form.
Agent files reference the checklist by file path (via Read) — they do not use the slash-command form.

---

## Phase 1.2 Build — Complete (v3.2.0)

All items resolved and shipped:

1. ✅ Agent namespacing verified: Case B — `kairos:` prefix required.
2. ✅ `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` created.
3. ✅ `skills/contract-checklist/SKILL.md` created; `agents/shared/contract-checklist.md` removed.
4. ✅ Path refs updated: `architect-agent.md:63`, `implementer-lead-agent.md:93`.
5. ✅ 9 @-notation calls in `orchestrator-agent.md` updated; 4 spawn type names in `implementer-lead-agent.md` updated.

---

> **Next step:** Phase 1.3 — document where the plugin lives and write the install guide.
