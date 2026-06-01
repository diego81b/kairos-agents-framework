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
tools: Read, Write, Edit, Bash, Grep, Glob
model: opus
---
```

`agents/team/` holds the 5 Team Mode agents (Claude Code only — require `agent` tool support).

### Pipeline Overview

KAIROS defines a 6-phase, human-gated pipeline:

| Phase | Agent file | Output artifact |
|-------|-----------|----------------|
| Pre | `context-extractor-agent.md` | `00-context.json` |
| 1 | `pm-agent.md` | `01-requirements.json` |
| 2 | `architect-agent.md` | `02-architecture.json` |
| 3 | `implementer-tdd-agent.md` or `implementer-coder-agent.md` | code + `03-implementation.json` |
| 4 | `code-reviewer-agent.md` | `04-review.json` |
| 5 | `test-verifier-agent.md` | `05-test-verification.json` |
| 6 | `release-planner-agent.md` | `06-deployment-plan.json` |

All artifacts land in `.kairos/<feature_folder>/` inside the target project (not this repo).

Team Mode (`agents/team/`) replaces phase 3 with a lead agent that spawns 4 parallel specialists; requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` and Claude Code ≥ 2.1.32.

### VitePress Site (`docs/`)

Config lives in `docs/.vitepress/config.js` — it reads `version` from `package.json` and injects it site-wide. The sidebar and nav are defined there.

`docs/agent-files.md` and `docs/agent-files-team.md` embed the raw agent Markdown as copy blocks. When agent files change, those pages must be updated to stay in sync.

`internal/` contains reference docs that are NOT published to the site.

### Deployment

Vercel auto-deploys on push (`vercel.json`: buildCommand `npm run docs:build`, output `docs/.vitepress/dist/`). CI skips builds not triggered by version tags (see `.github/workflows/`).
