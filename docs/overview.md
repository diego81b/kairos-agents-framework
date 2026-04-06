# Overview

**"The Right Moment for Development"**

By Comm.it - Intelligent multi-agent SDLC orchestration

---

KAIROS is an intelligent framework that orchestrates 7 specialized AI agents to accelerate software development.

**Key Numbers:**
- 40-50% faster development
- 80-90% quality output
- 70-180x ROI per feature
- $5-8 in API costs per feature
- 75-80% time saved per developer

---

## How It Works: Subagents

KAIROS is built on the **subagent** model — not a team of agents that chat with each other, but specialized Claude instances each with their own isolated context.

| Subagents ✅ | Agent Teams ❌ |
|---|---|
| Isolated, fresh context per task | Cross-session coordination |
| Specialized prompt per role | Agents communicating each other |
| Defined as `.md` files in `agents/` | Not needed for KAIROS |
| Claude knows when to use them | — |

Each subagent:
1. Receives **only** what the orchestrator passes it (fresh context)
2. Works in **isolation** — no access to the parent conversation
3. Returns **only the final result** — intermediate thinking stays local
4. Keeps token usage low and costs down

---

## Context Isolation Benefit

Without subagents, all intermediate analysis accumulates in the main conversation:

```
WITHOUT SUBAGENTS:
PM analysis  →  10KB stays in main context
Arch design  →   8KB stays in main context
             ──────────────────────────────
             18KB+ bloating every token call

WITH SUBAGENTS:
PM analysis  → stays inside pm-agent context  → only summary returned
Arch design  → stays inside architect context → only summary returned
             ──────────────────────────────────────────
             Main context stays clean and cheap
```

---

## Implicit Delegation

You never need to invoke an agent by name. Just describe what you want:

```
YOU:        "Add Stripe payment processing"

KAIROS:     Matches description → calls orchestrator
ORCHESTR:   Calls pm-agent     → gets requirements JSON
ORCHESTR:   Calls architect    → gets design JSON
ORCHESTR:   Calls implementer  → gets code + tests
ORCHESTR:   Calls code-reviewer → gets quality report
ORCHESTR:   Calls test-verifier → validates coverage
ORCHESTR:   Calls release-planner → deployment plan
ORCHESTR:   Presents everything to you
```

Claude reads each agent's `description:` field and routes automatically.

---

## File Structure

```
agents/
├── orchestrator.md        ← Main coordinator (claude-opus-4-6)
├── pm-agent.md            ← Requirement analysis
├── architect-agent.md     ← System design
├── implementer-agent.md   ← Code + TDD
├── code-reviewer.md       ← Quality check
├── test-verifier.md       ← Test quality
└── release-planner.md     ← Deployment plan
```

Each `.md` file is a self-contained subagent definition with YAML frontmatter and a markdown prompt. Copy the folder into `.claude/agents/`, `.cursor/agents/`, or `.github/agents/` depending on your tool.

---

Ready to get started? See [Setup by Tool](./setup) to configure KAIROS with your preferred IDE, or dive into [The 7 Agents](./agents) to understand what each one does.
