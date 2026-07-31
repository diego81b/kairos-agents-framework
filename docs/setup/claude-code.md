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
│       ├── context-extractor-agent.md     ← Pre-pipeline: full-repo context (standalone)
│       ├── impact-assessment-agent.md     ← Pre-pipeline: issue grounding + agent recommendations (standalone)
│       ├── pm-agent.md
│       ├── architect-agent.md
│       ├── implementer-tdd-agent.md       ← TDD implementer (default — use when project has a test suite)
│       ├── implementer-coder-agent.md     ← Code-only implementer (no TDD — use when project has NO test suite)
│       ├── code-reviewer-agent.md
│       ├── security-reviewer-agent.md     ← Adversarial security review (optional, read-only)
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

::: info Choosing an implementer
Copy **both** `implementer-tdd-agent.md` and `implementer-coder-agent.md`. During a KAIROS run the orchestrator asks which to use.
- `implementer-tdd-agent` — **default**. Full TDD cycle (RED → GREEN → REFACTOR). Use when the project has a test suite.
- `implementer-coder-agent` — **code-only**. No TDD, no test files, no coverage. Use only when the project has no test suite or tests are explicitly out of scope.

The `team/` folder (`implementer-lead-agent.md` + teammates) is only needed if you plan to use Team Mode.
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
model: sonnet
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

Validated output is saved automatically to `.kairos/01-requirements.md`.

## Step 5 — Check `.kairos/` outputs

After each approved phase, a single Markdown file is written — a small YAML frontmatter header (status, counts) followed by the human-readable report body (data model, issues, findings, runbook):

```
.kairos/
├── 01-requirements.md         ← after PM Agent approval
├── 02-architecture.md         ← after Architect approval
├── 03-implementation.md       ← after Implementer approval
├── 04-review.md               ← after Code Reviewer approval
├── 05-test-verification.md    ← after Test Verifier approval
└── 06-deployment-plan.md      ← after Release Planner approval
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
jira issue comment add PROJ-42 "$(cat .kairos/PROJ-42_my-feature/01-requirements.md)"

# GitLab (glab CLI — https://gitlab.com/gitlab-org/cli)
glab issue note 42 --body "$(cat .kairos/issue-42_my-feature/01-requirements.md)"

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
| `.kairos/` not created | The implementer-tdd-agent or implementer-coder-agent creates it on first write — ensure `write_file` is in its `tools:` list |

## Team Mode — additional setup

Team Mode activates a coordinated team of 5 specialists in place of the single implementer agent (`implementer-tdd-agent` or `implementer-coder-agent`). It uses Claude Code’s **experimental Agent Teams feature**, available only in Claude Code.

### Enable Agent Teams

Requires Claude Code v2.1.32 or later:

```bash
claude --version
```

Set the flag at whichever scope fits your workflow:

**Project-level** (recommended — commits the setting to git so the whole team gets it):

```json
// .claude/settings.json in your project root
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

**Global** (all projects on this machine — developer preference):

```json
// ~/.claude/settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

**Shell session** (temporary, for testing):

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
claude
```

### Why Claude Code only?

| Tool | Agent Teams support | Team Mode |
| --- | --- | --- |
| **Claude Code v2.1.32+** | Experimental Agent Teams — separate sessions, peer messaging | ✅ |
| Cursor | No inter-session coordination | ❌ |
| VS Code / JetBrains / others | No inter-session coordination | ❌ |

With Agent Teams, each teammate runs in its **own Claude Code session** with its own context window. Teammates communicate peer-to-peer via a shared mailbox and coordinate work via a shared task list — not just reporting results back to the lead. This is fundamentally different from the single `implementer-tdd-agent` or `implementer-coder-agent`, which uses the `agent` tool for direct subagent spawning within a single session.

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
         ├─[HITL]─► PM Agent              → .kairos/01-requirements.md
         ├─[HITL]─► Architect Agent       → .kairos/02-architecture.md + .md
         ├─[HITL]─► implementer-tdd-agent    → .kairos/03-implementation.md
         │           or
         │          implementer-coder-agent (code-only, no TDD)
         │           or
         │          Implementer Lead-agent (Team Mode)
         │           ├── teammate-tests-agent    [HITL: test plan gate]
         │           ├── teammate-backend-agent  ┌
         │           ├── teammate-frontend-agent ├── parallel
         │           └── teammate-database-agent ┘
         ├─[HITL]─► Code Reviewer         → .kairos/04-review.md + .md
         ├─[HITL]─► Test Verifier         → .kairos/05-test-verification.md + .md
         └─[HITL]─► Release Planner       → .kairos/06-deployment-plan.md + .md
```

Each `[HITL]` gate is a pause where **you** review and approve before the next agent runs.

---

## Customizing models

KAIROS's shipped frontmatter splits agents into two tiers — `opus` for the 5 reasoning-heavy agents (`orchestrator`, `architect`, `context-extractor`, `impact-assessment`, `security-reviewer`) and `sonnet` for the 6 execution agents (`pm`, `implementer-tdd`, `implementer-coder`, `code-reviewer`, `test-verifier`, `release-planner`). Claude Code has no plugin-install-time or config-file mechanism for per-agent models, but there are three ways to change them:

1. **Edit the `model:` frontmatter** in your `.claude/agents/` copies. Aliases (`sonnet`, `opus`, `haiku`), full model IDs (e.g. `claude-opus-5`), and `inherit` (follow the main conversation) are all accepted. Downgrading the execution tier to `haiku` is the easiest token-saver; keep `orchestrator-agent` and `architect-agent` on stronger models. Downside: your edits are local forks — re-apply them after re-copying updated KAIROS agents.
2. **Global subagent override** — the `CLAUDE_CODE_SUBAGENT_MODEL` environment variable wins over every subagent's frontmatter `model:` (resolution order: env var → per-invocation override → frontmatter → main conversation model). Settable in `settings.json`:
   ```json
   {
     "env": { "CLAUDE_CODE_SUBAGENT_MODEL": "haiku" }
   }
   ```
   Coarse but zero-maintenance: **all** subagents — including architect and security review — run on that one model, so it's a blunt cost cut, not a per-tier tuning.
3. **Shadow copy for plugin installs** — if you installed KAIROS as a plugin, a same-named agent file in your project's `.claude/agents/` outranks the plugin's copy (project scope > plugin scope), so you can override just the agents whose model you want to change. Same fork caveat as option 1.

There is intentionally no KAIROS-side config file for this: Claude Code offers no hook the plugin could use to rewrite frontmatter at install time.

---

## Suggested Models

Claude Code accepts short aliases that always resolve to the latest model in each family, or full versioned IDs (e.g. `claude-sonnet-4-6`) to pin a specific release.

| Alias | Resolves to | Use for |
|-------|------------|--------|
| `sonnet` | Latest Sonnet | Most agents — good balance of quality and speed |
| `opus` | Latest Opus | Orchestrator, TDD Implementer — highest reasoning capability |
| `haiku` | Latest Haiku | Team Mode teammates — fast and cost-efficient |

### Per-agent defaults

| Agent | Default | Upgrade trigger |
|-------|---------|----------------|
| `orchestrator-agent` | `opus` | Never downgrade — coordination requires full reasoning |
| `implementer-tdd-agent` | `opus` | Never downgrade — TDD cycle is the most resource-intensive phase |
| `implementer-coder-agent` | `sonnet` | Upgrade to `opus` for complex codebases; no TDD overhead |
| `architect-agent` | `sonnet` | Upgrade to `opus` for distributed systems, complex multi-db, or non-trivial scaling |
| `pm-agent` | `sonnet` | Upgrade to `opus` for enterprise features with competing constraints (compliance, multi-region, strict SLAs) |
| `context-extractor-agent` | `sonnet` | Rarely needs upgrading |
| `code-reviewer-agent` | `sonnet` | Upgrade to `opus` for deep security audits |
| `test-verifier-agent` | `sonnet` | Sufficient for coverage analysis |
| `release-planner-agent` | `sonnet` | Sufficient for deployment planning |

### Team Mode agents

| Agent | Model | Notes |
|-------|-------|-------|
| `implementer-lead-agent` | `opus` | Coordinates teammates — same tier as implementer |
| `teammate-*-agent` (×4) | `haiku` | Scoped, single-responsibility tasks — optimised for speed and cost |
