# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

KAIROS is a documentation-only project: a collection of AI agent definition files (Markdown) and a VitePress documentation site. There is no compiled code, no test suite, and no runtime beyond the docs build.

The two main deliverables are:
- `agents/` — the agent instruction files themselves (the actual framework artifact)
- `docs/` — the VitePress site that documents and exposes those agents to users

## Development Commands

```bash
npm install              # install VitePress + dependencies
npm run docs:dev         # local dev server with hot reload (http://localhost:5173)
npm run docs:build       # build static site → docs/.vitepress/dist/
npm run docs:preview     # preview production build locally
```

No linting, no tests, no compile step.

## Architecture

### Agent Files (`agents/`)

Each file is a Markdown document with YAML frontmatter consumed by Claude Code or other AI tools:

```yaml
---
name: orchestrator-agent
description: "..."
tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion
model: opus
---
```

`agents/team/` holds the 5 Team Mode agents (Claude Code only — require `agent` tool support).

### Pipeline Overview

KAIROS defines a 6-phase, human-gated pipeline:

| Phase | Agent file | Output artifact |
|-------|-----------|----------------|
| Pre-A | `context-extractor-agent.md` | `00-context.md` |
| Pre-B | `impact-assessment-agent.md` | `00b-impact.md` |
| 1 | `pm-agent.md` | `01-requirements.md` |
| 2 | `architect-agent.md` | `02-architecture.md` |
| 3 | `implementer-tdd-agent.md` or `implementer-coder-agent.md` | code + `03-implementation.md` |
| 4 | `code-reviewer-agent.md` | `04-review.md` |
| 4.5 | `security-reviewer-agent.md` *(optional)* | `04b-security-review.md` |
| 5 | `test-verifier-agent.md` | `05-test-verification.md` |
| 6 | `release-planner-agent.md` | `06-deployment-plan.md` |

Every phase (Pre-A through 6) writes a single Markdown file: a YAML frontmatter header carrying only what the orchestrator branches on (status, counts, `next_agent`), followed by a plain-Markdown body (data model, issues tables, findings, runbook) — see each agent file's "Output Format" section. No phase output is JSON: nothing in this repo parses these files programmatically, every consumer is either another agent reading the file as prompt text or a human at a HITL gate, so Markdown serves both better than escaped JSON strings. Any Risks/Issues/Findings table in the body carries a `Disposition` column, resolved row-by-row by the orchestrator's Risk Disposition Loop (see `orchestrator-agent.md`'s HITL section) before the whole-artifact gate is shown.

All artifacts land in `.kairos/<feature_folder>/` inside the target project (not this repo). Each feature folder also contains a `ledger/` subdirectory with three living files — `constraints.md`, `decisions.md`, `open-questions.md` — that agents read at phase start and update at phase end (forced accounting model).

Team Mode (`agents/team/`) replaces phase 3 with a lead agent that spawns 4 parallel specialists; requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` and Claude Code ≥ 2.1.32.

### VitePress Site (`docs/`)

Config lives in `docs/.vitepress/config.js` — it reads `version` from `package.json` and injects it site-wide. The sidebar and nav are defined there.

`docs/agent-files.md` and `docs/agent-files-team.md` embed the raw agent Markdown as copy blocks. When agent files change, those pages must be updated to stay in sync.

`internal/` contains reference docs that are NOT published to the site.

VitePress `srcDir` is set to `..` (repo root), so the site sources Markdown from the entire repo, not just `docs/`. `CHANGELOG.md` is rewritten to `changelog.md` via the `rewrites` config.

### Skills (`skills/`)

`skills/contract-checklist/SKILL.md` is a shared reference invoked by `architect-agent` and `implementer-lead-agent`. Skills here are published as part of the plugin.

### Plugin (`​.claude-plugin/`)

`plugin.json` holds the Claude Code plugin metadata including its own `version` field. **Both `package.json` and `plugin.json` versions must be bumped together** when releasing — `.claude/CLAUDE.md` covers versioning rules but only names `package.json`.

### Deployment

Vercel auto-deploys on push (`vercel.json`: buildCommand `npm run docs:build`, output `docs/.vitepress/dist/`). CI skips builds not triggered by version tags (see `.github/workflows/`).
