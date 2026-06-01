# Phase 1.3 — Plugin Install Guide

> **Status:** Complete as of v3.2.1.
> This is the canonical install guide for KAIROS as a Claude Code plugin.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Claude Code | ≥ v2.1.154 (required for `defaultEnabled` support) |
| Git access | Public GitHub — no authentication needed |
| Plugin repo | `diego81b/kairos-agents-framework` |

---

## Install

All `/plugin` commands are **user-global** — they apply to the current machine, not to a single project. Install once and KAIROS is available in all projects on that machine.

```bash
# 1. Register the KAIROS marketplace (hosted in the same repo)
/plugin marketplace add diego81b/kairos-agents-framework

# 2. Install the plugin
/plugin install kairos@kairos-marketplace

# 3. Enable it (defaultEnabled: false — must be explicit)
/plugin enable kairos@kairos-marketplace

# 4. Verify
/plugin list
/plugin details kairos@kairos-marketplace
```

**Why step 3 is required:** `plugin.json` sets `defaultEnabled: false`. This prevents KAIROS agents from appearing in the typeahead for users who install without intending to use them. Explicit enable = explicit intent.

::: info No per-project plugin scoping
There is no built-in way to enable a plugin for one project and disable it for another via `/plugin` commands. The enable state is stored in `~/.claude/settings.json` and applies globally. If you need project isolation, the manual copy approach in the [Claude Code setup guide](/setup/claude-code) is the alternative — agents copied to `.claude/agents/` are project-scoped.
:::

---

## What Gets Installed

Claude Code downloads the repo to `~/.claude/plugins/cache/kairos-marketplace/kairos/<version>/`. Nothing executes at install time — it is a pure file copy.

Installed components:

| Component | Count | Access |
|-----------|-------|--------|
| Core pipeline agents | 11 | `kairos:<agent-name>` |
| Team Mode agents | 5 | `kairos:team:<agent-name>` |
| Contract checklist skill | 1 | `/kairos:contract-checklist` |

---

## Agent Namespacing

All KAIROS agents are scoped under the `kairos:` plugin namespace. Bare names (`pm-agent`, `architect-agent`) **will not resolve** — use the full scoped form.

### Core Pipeline Agents

| Agent | Scoped name |
|-------|-------------|
| Context Extractor | `kairos:context-extractor-agent` |
| Impact Assessment | `kairos:impact-assessment-agent` |
| Orchestrator | `kairos:orchestrator-agent` |
| PM Agent | `kairos:pm-agent` |
| Architect Agent | `kairos:architect-agent` |
| Implementer TDD | `kairos:implementer-tdd-agent` |
| Implementer Coder | `kairos:implementer-coder-agent` |
| Code Reviewer | `kairos:code-reviewer-agent` |
| Security Reviewer | `kairos:security-reviewer-agent` |
| Test Verifier | `kairos:test-verifier-agent` |
| Release Planner | `kairos:release-planner-agent` |

### Team Mode Agents

Requires Claude Code ≥ 2.1.32 and the Agent Teams flag enabled. Set it at whichever scope fits:

**Project-level** — committed to git, whole team gets it:
```json
// .claude/settings.json in your project root
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

**Global** — all projects on this machine:
```json
// ~/.claude/settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

**Shell session** — temporary, for testing:
```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

| Agent | Scoped name |
|-------|-------------|
| Implementer Lead | `kairos:team:implementer-lead-agent` |
| Teammate Tests | `kairos:team:teammate-tests-agent` |
| Teammate Backend | `kairos:team:teammate-backend-agent` |
| Teammate Frontend | `kairos:team:teammate-frontend-agent` |
| Teammate Database | `kairos:team:teammate-database-agent` |

---

## Starting a Pipeline Run

Once installed and enabled, the entry point is always the orchestrator:

```
@kairos:orchestrator-agent
```

The orchestrator handles all phase routing internally. You do not call other agents directly unless resuming a specific phase.

---

## Contract Checklist Skill

Available as a slash command:

```
/kairos:contract-checklist
```

Agent files reference the checklist by file path (via Read) and do not use the slash-command form. The slash command is for direct human use.

---

## Managing the Plugin

```bash
/plugin marketplace list      # All connected marketplaces
/plugin marketplace update    # Pull latest from all marketplaces
/plugin disable kairos@kairos-marketplace
/plugin uninstall kairos@kairos-marketplace
```

---

## Updating

```bash
/plugin marketplace update
/plugin install kairos@kairos-marketplace   # Installs latest version
```

Plugin versions follow the repo's git tags. The `version` field in `plugin.json` maps to the semver tag on GitHub.

---

## Phase 1.4 — Mandatory Routing Test

Before declaring distribution production-ready, two live smoke tests must pass:

1. **Full single-agent pipeline:** `kairos:orchestrator-agent` → pm → architect → implementer-tdd → reviewer → test-verifier — all routing via `kairos:` prefix, no failures.
2. **Full Team Mode run:** orchestrator → `kairos:team:implementer-lead-agent` → all 4 teammates — all spawn type names via `kairos:team:` prefix, no failures.

A successful install that never triggers agent-to-agent routing proves nothing. Both test runs must reach completion.

---

> **Next step:** Phase 1.4 — live routing test on an installed plugin instance.
