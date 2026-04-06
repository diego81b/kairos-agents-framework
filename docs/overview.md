# What is KAIROS?

> **"The Right Moment for Development"**  
> Intelligent multi-agent SDLC orchestration — by [Comm.it](https://comm.it)

---

KAIROS is a framework that wires 7 specialized AI agents into a single, human-controlled pipeline. You describe what you want to build; KAIROS breaks it into phases — requirements, design, code, review, tests, deployment — and produces production-ready output at every step.

The human never loses control: every phase ends at a checkpoint where you approve, redirect, or skip before anything moves forward.

---

## The Problem It Solves

A single AI conversation accumulates context fast. Feed it a feature request and by the time it writes code, it's also carrying the requirements analysis, the architecture discussion, every revision you made — thousands of tokens that inflate every subsequent call and blur focus.

KAIROS solves this with **subagents**: isolated Claude instances, each with a focused role and a fresh context window.

```
WITHOUT SUBAGENTS:
  PM analysis  → stays in main context  (+10 KB)
  Arch design  → stays in main context  (+8 KB)
  Code draft   → stays in main context  (+20 KB)
                 ─────────────────────────────
                 38 KB+ bloating every token call

WITH SUBAGENTS:
  PM analysis  → pm-agent context      → only JSON summary returned
  Arch design  → architect context     → only JSON summary returned
  Code draft   → implementer context   → only files + coverage returned
                 ─────────────────────────────
                 Main context stays small and cheap
```

Each subagent:
- Receives **only** what the orchestrator passes it
- Works in **isolation** — no access to the parent conversation
- Returns **only the final artifact** — intermediate reasoning stays local

---

## The 7-Agent Pipeline

| # | Agent | Role | Output |
|---|-------|------|--------|
| 0 | **Orchestrator** | Coordinates the pipeline, manages HITL | Routes & aggregates |
| 1 | **PM Agent** | Requirements, constraints, acceptance criteria | `01-requirements.json` |
| 2 | **Architect Agent** | 3 design options → recommended choice, API contracts, DB schema | `02-architecture.json` |
| 3 | **Implementer Agent** | Implementation plan → TDD cycle (tests first, then code) | Code + `03-implementation.json` |
| 4 | **Code Reviewer** | Standards, security, performance, contract compliance | `04-review.json` |
| 5 | **Test Verifier** | Coverage adequacy (>80%), edge cases, assertion quality | `05-test-verification.json` |
| 6 | **Release Planner** | Deployment steps, rollback strategy, monitoring thresholds | `06-deployment-plan.json` |

All output files are saved to `.kairos/<feature-folder>/` — one subfolder per feature, named from the issue reference (e.g. `PROJ-42_add-stripe-payments`).

---

## Human-in-the-Loop (HITL)

KAIROS is **not** fully automated. Every active agent presents its output and waits for your decision before the pipeline moves forward.

```
Agent completes its phase
         ↓
Presents artifact to user
         ↓
  ✅ Approve     → pass artifact to next active agent
  ✏️  Changes    → agent revises based on your feedback
  ⏭️  Skip next → approve this, jump past the next agent
  ⛔ Stop        → abort and keep everything so far
```

This gives you:
- **Zero surprises** — you review every decision before code is written
- **Course correction at any point** — steer direction without restarting
- **Full audit trail** — every artifact is saved locally and optionally posted as a comment to the issue (Jira, GitLab, Bitbucket)

---

## Selective Pipeline

Not every task needs all six agents. When you start a KAIROS run, the orchestrator asks you to choose which agents should run — no automatic inference, no hidden defaults.

```
📋 Which agents should run for this task?
Reply with numbers (e.g. "1 3 4") or paste a KAIROS template block:

1. pm-agent          — Requirements analysis
2. architect-agent   — System design
3. implementer-agent — TDD code generation
4. code-reviewer     — Quality assurance
5. test-verifier     — Test quality & coverage
6. release-planner   — Deployment planning
```

If the issue already contains a `## KAIROS Pipeline` checklist block (placed there by you or a team template), the orchestrator reads it automatically and just asks you to confirm.

Pre-built presets for common task types — Feature, Bug Fix, Hotfix, Refactor, Docs — are available in [Pipeline Templates](./setup/templates).

---

## What You Get

A typical KAIROS feature run produces:

- ✅ Production-ready code following your project's patterns
- ✅ Comprehensive test suite with coverage >80%
- ✅ Architecture decision record
- ✅ Code review report (security, performance, standards)
- ✅ Deployment plan with rollback procedure
- ✅ Full issue tracker comment trail (Jira / GitLab / Bitbucket)

**Typical time savings per feature:**

| Metric | Value |
|--------|-------|
| Developer time saved | 75–80% |
| Feature delivery speed | 40–50% faster |

---

## How Files Are Organized

```
agents/
├── orchestrator.md        ← Coordinator (claude-opus-4-6)
├── pm-agent.md            ← Requirements (claude-sonnet-4-6)
├── architect-agent.md     ← System design (claude-sonnet-4-6)
├── implementer-agent.md   ← TDD code generation (claude-opus-4-6)
├── code-reviewer.md       ← Quality review (claude-sonnet-4-6)
├── test-verifier.md       ← Test quality (claude-sonnet-4-6)
└── release-planner.md     ← Deployment planning (claude-sonnet-4-6)
```

Each file is a self-contained subagent definition — YAML frontmatter for tool and model configuration, markdown body for the agent prompt. Copy the `agents/` folder into the right directory for your tool and you're ready.

---

Ready to start? → [Set up KAIROS with your IDE](./setup/)  
Want the full picture? → [Workflow walkthrough](./workflow) · [The 7 Agents](./agents)
