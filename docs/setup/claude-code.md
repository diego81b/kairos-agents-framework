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
mkdir -p .claude/agents/team
cp path/to/kairos/agents/*.md .claude/agents/
cp path/to/kairos/agents/team/*.md .claude/agents/team/
```

Your project structure should look like:

```
your-project/
├── .claude/
│   └── agents/
│       ├── orchestrator-agent.md
│       ├── context-extractor-agent.md
│       ├── pm-agent.md
│       ├── architect-agent.md
│       ├── implementer-agent.md       ← default, works everywhere
│       ├── code-reviewer-agent.md
│       ├── test-verifier-agent.md
│       ├── release-planner-agent.md
│       └── team/                      ← Team Mode specialists
│           ├── implementer-lead-agent.md
│           ├── teammate-tests-agent.md
│           ├── teammate-backend-agent.md
│           ├── teammate-frontend-agent.md
│           └── teammate-database-agent.md
├── src/
└── ...
```

::: tip Keep agents in sync
If you maintain KAIROS as a submodule or copy, remember to re-copy after updates. The source of truth is always `agents/` in the KAIROS repository.
:::

::: info Team Mode agents are optional
The `team/` folder (including `implementer-lead-agent.md`) is only needed if you plan to use Team Mode. For most projects, `implementer-agent.md` alone is sufficient.
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

Team Mode activates a coordinated team of 5 specialists in place of the single Implementer Agent. It uses Claude Code’s **experimental Agent Teams feature**, available only in Claude Code.

### Enable Agent Teams

Create or update `.claude/settings.json` in your project root:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Requires Claude Code v2.1.32 or later:

```bash
claude --version
```

### Why Claude Code only?

| Tool | Agent Teams support | Team Mode |
| --- | --- | --- |
| **Claude Code v2.1.32+** | Experimental Agent Teams — separate sessions, peer messaging | ✅ |
| Cursor | No inter-session coordination | ❌ |
| VS Code / JetBrains / others | No inter-session coordination | ❌ |

With Agent Teams, each teammate runs in its **own Claude Code session** with its own context window. Teammates communicate peer-to-peer via a shared mailbox and coordinate work via a shared task list — not just reporting results back to the lead. This is fundamentally different from the single Implementer Agent, which uses the `agent` tool for direct subagent spawning within a single session.

### How to activate Team Mode

Team Mode is never activated automatically. When you select `implementer-lead-agent` in Phase 0 agent selection, the Orchestrator shows a cost warning and asks for confirmation:

```
⚠️  TEAM MODE — COST WARNING

Single Agent:  ~$0.068/feature  ✅ Recommended
Team Mode:     ~$0.242/feature  (3.5× more — experimental, Claude Code only)

Requires: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 in .claude/settings.json

✅ Confirm Team Mode
↩️  Switch to Single Agent
⛔ Cancel
```

### What the Lead spawns and when

The Implementer Lead applies real TDD across the team in three sequential phases:

```
Implementer Lead
│
├── RED phase ──► teammate-tests-agent      (spawned first, alone)
│                  Writes all tests before any implementation.
│                  All tests fail — this is correct.
│
│   [HITL: test plan gate — you review the test suite here]
│
├── GREEN phase ─► teammate-backend-agent    ┌
│                  teammate-frontend-agent   ├── spawned in parallel
│                  teammate-database-agent   ┘
│                  Goal: make the pre-existing tests pass.
│
└── REFACTOR ───► all three teammates        (quality improvements,
                                         tests must stay green)
```

### Verify Agent Teams is enabled

Check that `Claude Code v2.1.32+` is installed and the env var is set:

```bash
claude --version
```

You can also verify the setting is active by looking at `.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Without this flag, the Lead cannot create a team and Team Mode will not work.

---

## Full pipeline

```
You ──► Orchestrator
         │
         ├─[HITL]─► PM Agent              → .kairos/01-requirements.json
         ├─[HITL]─► Architect Agent       → .kairos/02-architecture.json
         ├─[HITL]─► Implementer Agent     → .kairos/03-implementation.json
         │           or
         │          Implementer Lead-agent (Team Mode)
         │           ├── teammate-tests-agent    [HITL: test plan gate]
         │           ├── teammate-backend-agent  ┌
         │           ├── teammate-frontend-agent ├── parallel
         │           └── teammate-database-agent ┘
         ├─[HITL]─► Code Reviewer         → .kairos/04-review.json
         ├─[HITL]─► Test Verifier         → .kairos/05-test-verification.json
         └─[HITL]─► Release Planner       → .kairos/06-deployment-plan.json
```

Each `[HITL]` gate is a pause where **you** review and approve before the next agent runs.
