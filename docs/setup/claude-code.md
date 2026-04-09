# Claude Code Setup

Claude Code is the **recommended tool** for KAIROS. It is the only tool with native subagent support: each agent runs in an isolated context with its own model, tools list, and memory — exactly as KAIROS is designed.

## Prerequisites

- [Claude Code](https://claude.ai/code) installed (CLI or desktop)
- A project you want to develop with KAIROS
- Git (optional, for issue tracker integration — Jira, GitLab, Bitbucket)

## Step 1 — Copy agents to `.claude/agents/`

Claude Code discovers subagents from the `.claude/agents/` directory inside your project.

```bash
# From your project root
mkdir -p .claude/agents/teammates
cp path/to/kairos/agents/*.md .claude/agents/
cp path/to/kairos/agents/teammates/*.md .claude/agents/teammates/
```

Your project structure should look like:

```
your-project/
├── .claude/
│   └── agents/
│       ├── orchestrator.md
│       ├── context-extractor.md
│       ├── pm-agent.md
│       ├── architect-agent.md
│       ├── implementer-agent.md       ← default, works everywhere
│       ├── implementer-lead.md        ← Team Mode coordinator
│       ├── code-reviewer.md
│       ├── test-verifier.md
│       ├── release-planner.md
│       └── teammates/                 ← Team Mode specialists
│           ├── teammate-tests.md
│           ├── teammate-backend.md
│           ├── teammate-frontend.md
│           └── teammate-database.md
├── src/
└── ...
```

::: tip Keep agents in sync
If you maintain KAIROS as a submodule or copy, remember to re-copy after updates. The source of truth is always `agents/` in the KAIROS repository.
:::

::: info Team Mode agents are optional
The `implementer-lead.md` and `teammates/` folder are only needed if you plan to use Team Mode. For most projects, `implementer-agent.md` alone is sufficient.
:::

## Step 2 — Understand how subagents are loaded

When Claude Code starts, it reads every `.md` file in `.claude/agents/` and parses the YAML frontmatter:

```yaml
---
name: PM Agent
description: Collects and structures requirements. Use at the START of a new feature.
tools:
  - read_file
  - write_file
model: claude-sonnet-4-6
---
```

The `description` field is critical: the **orchestrator** reads all descriptions and decides automatically which subagent to delegate to, without you needing to say `@pm-agent`.

## Step 3 — Start a KAIROS session

Open Claude Code in your project directory and type:

```
Help me add [your feature] using the KAIROS framework
```

The orchestrator agent picks this up, reads the task, and begins delegating to the appropriate subagent starting with the PM Agent.

## Step 4 — The HITL loop in practice

After each phase you will see output like:

```
## PM Agent — Requirements Output

{
  "feature": "...",
  "user_stories": [...],
  "acceptance_criteria": [...],
  ...
}

✅ Approve and continue to Architecture
✏️  Request changes (describe what to fix)
⛔  Stop here
```

**You must choose before the orchestrator proceeds.** This is the HITL checkpoint — it prevents downstream agents from working on bad requirements.

Validated output is saved automatically to `.kairos/01-requirements.json`.

## Step 5 — Check `.kairos/` outputs

After each approved phase, a JSON file is written:

```
.kairos/
├── 01-requirements.json     ← after PM Agent approval
├── 02-architecture.json     ← after Architect approval
├── 03-implementation.json   ← after Implementer approval
├── 04-review.json           ← after Code Reviewer approval
├── 05-test-verification.json ← after Test Verifier approval
└── 06-deployment-plan.json  ← after Release Planner approval
```

These files are the audit trail of the session. You can commit them to git to track what was decided and why.

## Optional — Issue tracker integration

KAIROS supports **Jira**, **GitLab Issues**, and **Bitbucket Issues**. Add the issue reference at the start of your prompt:

```
# Jira
Help me implement PROJ-42 using the KAIROS framework

# GitLab / Bitbucket
Help me implement issue #42 using the KAIROS framework
```

Each agent posts its validated output as a comment after your approval:

```bash
# Jira (jira-cli — https://github.com/ankitpokhrel/jira-cli)
jira issue comment add PROJ-42 "$(cat .kairos/PROJ-42_my-feature/01-requirements.json)"

# GitLab (glab CLI — https://gitlab.com/gitlab-org/cli)
glab issue note 42 --body "$(cat .kairos/issue-42_my-feature/01-requirements.json)"

# Bitbucket (REST API)
curl -X POST "https://api.bitbucket.org/2.0/repositories/{workspace}/{repo}/issues/42/comments" \
  -u "${BITBUCKET_USER}:${BITBUCKET_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"content":{"raw":"..."}}"
```

Requires the respective CLI authenticated: `jira init`, `glab auth login`, or a Bitbucket app password in `BITBUCKET_TOKEN`.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Agent not found | Check `.claude/agents/` exists and contains `.md` files with valid YAML frontmatter |
| Wrong model used | Verify the `model:` field in each agent's frontmatter |
| Orchestrator not delegating | The `description:` field must clearly describe when to use the agent |
| `.kairos/` not created | The implementer-agent creates it on first write — ensure `write_file` is in its `tools:` list |

## Team Mode — additional setup

Team Mode activates a coordinated team of 5 specialists in place of the single Implementer Agent. It is available **only in Claude Code** because it requires the `agent` tool — the ability for one agent to spawn other agents programmatically at runtime.

### Why Claude Code only?

| Tool | Agent spawning | Team Mode |
| --- | --- | --- |
| **Claude Code** | `agent` tool — spawns agents at runtime | ✅ |
| Cursor | `@agent-name` — user-triggered only | ❌ |
| VS Code / JetBrains / others | No agent-to-agent spawning | ❌ |

### How to activate Team Mode

Team Mode is never activated automatically. When you select `implementer-lead` in Phase 0 agent selection, the Orchestrator shows a cost warning and asks for confirmation:

```
⚠️  TEAM MODE — COST WARNING

Single Agent:  ~$0.068/feature  ✅ Recommended
Team Mode:     ~$0.242/feature  (3.5× more)

✅ Confirm Team Mode
↩️  Switch to Single Agent
⛔ Cancel
```

### What the Lead spawns and when

The Implementer Lead applies real TDD across the team in three sequential phases:

```
Implementer Lead
│
├── RED phase ──► teammate-tests        (spawned first, alone)
│                  Writes all tests before any implementation.
│                  All tests fail — this is correct.
│
│   [HITL: test plan gate — you review the test suite here]
│
├── GREEN phase ─► teammate-backend     ┐
│                  teammate-frontend    ├── spawned in parallel
│                  teammate-database    ┘
│                  Goal: make the pre-existing tests pass.
│
└── REFACTOR ───► all three teammates   (quality improvements,
                                         tests must stay green)
```

### Verify the `agent` tool is enabled

Check that `implementer-lead.md` has `agent` in its `tools:` list:

```yaml
---
name: implementer-lead
tools: [read, write, agent]
model: claude-opus-4-6
---
```

Without the `agent` tool, the Lead cannot spawn teammates and Team Mode will not work.

---

## Full pipeline

```
You ──► Orchestrator
         │
         ├─[HITL]─► PM Agent              → .kairos/01-requirements.json
         ├─[HITL]─► Architect Agent       → .kairos/02-architecture.json
         ├─[HITL]─► Implementer Agent     → .kairos/03-implementation.json
         │           or
         │          Implementer Lead (Team Mode)
         │           ├── teammate-tests   [HITL: test plan gate]
         │           ├── teammate-backend ┐
         │           ├── teammate-frontend├── parallel
         │           └── teammate-database┘
         ├─[HITL]─► Code Reviewer         → .kairos/04-review.json
         ├─[HITL]─► Test Verifier         → .kairos/05-test-verification.json
         └─[HITL]─► Release Planner       → .kairos/06-deployment-plan.json
```

Each `[HITL]` gate is a pause where **you** review and approve before the next agent runs.
