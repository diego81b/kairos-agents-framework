# What is KAIROS?

> **"The Right Moment for Development"**  
> Intelligent multi-agent SDLC orchestration

---

KAIROS is a framework that wires specialized AI agents into a single, human-controlled pipeline. You describe what you want to build; KAIROS breaks it into phases — requirements, design, code, review, tests, deployment — and produces production-ready output at every step.

The human never loses control: every phase ends at a checkpoint where you approve, redirect, or skip before anything moves forward.

---

## The Problem It Solves

A single AI conversation accumulates context fast. Feed it a feature request and by the time it writes code, it's also carrying the requirements analysis, the architecture discussion, every revision you made — thousands of tokens that inflate every subsequent call and blur focus.

KAIROS solves this with **subagents**: isolated AI agent instances, each with a focused role and a fresh context window.

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

## The Core Pipeline

| # | Agent | Role | Output |
| --- | --- | --- | --- |
| pre | **Context Extractor** | Full-repo scan → stack, patterns, conventions | `00-context.json` |
| pre | **Impact Assessment** | Issue-scoped grounding → effort, domains, agent recommendations | `00b-impact.json` |
| 0 | **Orchestrator** | Coordinates the pipeline, manages HITL | Routes & aggregates |
| 1 | **PM Agent** | Requirements, constraints, acceptance criteria | `01-requirements.json` |
| 2 | **Architect Agent** | 3 design options → recommended choice, API contracts, DB schema | `02-architecture.json` + `.md` |
| 3 | **Implementer Agent** | Implementation plan → TDD cycle (tests first, then code) — **default for all features** | Code + `03-implementation.json` |
| 4 | **Code Reviewer** | Standards, security, performance, contract compliance | `04-review.json` + `.md` |
| 4b | **Security Reviewer** _(optional)_ | Adversarial security pass — IDOR, auth, injection, secrets, data exposure | `04b-security-review.json` + `.md` |
| 5 | **Test Verifier** | Coverage adequacy (>80%), edge cases, assertion quality | `05-test-verification.json` + `.md` |
| 6 | **Release Planner** | Deployment steps, rollback strategy, monitoring thresholds | `06-deployment-plan.json` + `.md` |

All output files are saved to `.kairos/<feature-folder>/` — one subfolder per feature, named from the issue reference (e.g. `PROJ-42_add-stripe-payments`). Phases 2 and 4–6 split into a lean `.json` contract and a `.md` human-readable report (data model, issues, findings, runbook) — see the [Workflow](/workflow) page for why.

### Team Mode — optional extension (Claude Code only)

For complex multi-layer features, you can explicitly request **Team Mode**. The Orchestrator replaces the single Implementer Agent with a coordinated team:

| Agent | Role |
| --- | --- |
| **Implementer Lead** | Creates binding contracts, spawns and monitors 4 parallel teammates |
| **Teammate Tests** | Generates full test suite (RED phase first) |
| **Teammate Backend** | Implements APIs per contract |
| **Teammate Frontend** | Implements UI per contract |
| **Teammate Database** | Creates schema and migrations per contract |

Team Mode is ~3.5× more expensive (~$0.242 vs ~$0.068 per feature) and available only in Claude Code. The technical reason: Team Mode requires one agent to spawn other agents programmatically at runtime — Claude Code supports this via the `agent` tool; Cursor, VS Code, JetBrains and other tools do not. The Orchestrator shows a cost warning and requires explicit confirmation before activating it.

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

1. pm-agent                  — Requirements analysis
2. architect-agent           — System design
3. implementer-tdd-agent     — TDD code generation (default — use when project has a test suite)
   3b. implementer-coder-agent — Code-only, no TDD (use when project has NO test suite)
4. code-reviewer             — Quality assurance
   4b. security-reviewer-agent — Adversarial security review (optional — recommended for auth, payments, write endpoints)
5. test-verifier             — Test quality & coverage
6. release-planner           — Deployment planning
```

If the issue already contains a `## KAIROS Pipeline` checklist block (placed there by you or a team template), the orchestrator reads it automatically and just asks you to confirm.

Pre-built presets for common task types — Feature, Bug Fix, Hotfix, Refactor, Docs — are available in [Pipeline Templates](./setup/templates).

---

## What You Get

A typical KAIROS feature run produces:

- ✅ Production-ready code following your project's patterns
- ✅ Comprehensive test suite with coverage >80% _(when using `implementer-tdd-agent`)_
- ✅ Architecture decision record with sound API contracts _(via pre-contract checklist gate)_
- ✅ Code review report (security, performance, standards)
- ✅ Adversarial security report with exploitable findings and attack scenarios _(when using `security-reviewer-agent`)_
- ✅ Deployment plan with rollback procedure
- ✅ Full issue tracker comment trail (Jira / GitLab / Bitbucket)

> When using `implementer-coder-agent` (no-TDD path), test files and coverage reports are not produced.

**Typical time savings per feature:**

| Metric | Value |
|--------|-------|
| Developer time saved | 75–80% |
| Feature delivery speed | 40–50% faster |

---

## How Files Are Organized

```
agents/
├── orchestrator-agent.md        ← Coordinator
├── context-extractor-agent.md   ← Pre-pipeline: full-repo context
├── impact-assessment-agent.md   ← Pre-pipeline: issue-scoped grounding + agent recommendations
├── pm-agent.md                  ← Requirements
├── architect-agent.md           ← System design
├── implementer-tdd-agent.md     ← TDD code generation (default)
├── implementer-coder-agent.md   ← Code-only, no TDD (projects without test suite)
├── code-reviewer-agent.md       ← Quality review
├── security-reviewer-agent.md   ← Adversarial security review (optional, read-only)
├── test-verifier-agent.md       ← Test quality
├── release-planner-agent.md     ← Deployment planning
├── shared/
│   └── contract-checklist.md    ← Shared reference: 9 questions to resolve before any contract
└── team/                        ← Team Mode specialists
    ├── implementer-lead-agent.md
    ├── teammate-tests-agent.md
    ├── teammate-backend-agent.md
    ├── teammate-frontend-agent.md
    └── teammate-database-agent.md
```

Each file is a self-contained subagent definition — YAML frontmatter for tool and model configuration, markdown body for the agent prompt. Copy the `agents/` folder into the right directory for your tool and you're ready.

---

Ready to start? → [Set up KAIROS with your IDE](./setup/)  
Want the full picture? → [Workflow walkthrough](./workflow) · [All Agents](./agents)
