# KAIROS — Contributor Instructions

Guidance for AI coding agents working in this repository. Read this before making any change.

## Project Overview

KAIROS is an intelligent multi-agent SDLC orchestration framework, distributed as a
**documentation-only project**. There is no compiled code, no test suite, and no
runtime beyond the documentation site build. The deliverables are:

- **`agents/`** — the framework artifact itself: 11 core AI agent definition files
  (Markdown + YAML frontmatter) plus 5 optional Team Mode agents in `agents/team/`.
- **`docs/`** — a VitePress site that documents the framework and exposes the agent
  files to users (published at https://kairos-docs.vercel.app).
- **`.opencode/agents/`** — a hand-maintained mirror of the 11 core agent files,
  translated to OpenCode's frontmatter schema (see "OpenCode Mirror Sync" below).
- **`.kimi-code/agents/`** — a hand-maintained mirror of the 11 core agent files,
  translated to Kimi Code's frontmatter schema (see "Kimi Code Mirror Sync" below).

KAIROS defines a 6-phase, human-gated (HITL) pipeline. Each phase is one agent file
that produces one Markdown artifact in the *target project's* `.kairos/<feature_folder>/`
directory (never in this repo):

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

The orchestrator (`orchestrator-agent.md`) routes between phases and enforces the HITL
gates. Team Mode (`agents/team/`) replaces phase 3 with a lead agent spawning 4 parallel
specialists; it requires Claude Code with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

## Build and Development Commands

Node.js (22+) with npm. The only buildable artifact is the VitePress docs site.

```bash
npm install              # install VitePress + dependencies
npm run docs:dev         # local dev server with hot reload
npm run docs:build       # build static site → docs/.vitepress/dist/
npm run docs:preview     # preview production build locally
```

There is **no lint script, no test suite, and no compile step**. A `.markdownlint.json`
exists (disables MD024 and MD060) for editor integration, but nothing enforces it in CI.
The closest thing to a verification step is: `npm run docs:build` must succeed after
any change to `docs/`, `agents/`, or `skills/` (agent files are embedded in the site).

## Repository Layout

- `agents/` — 11 core pipeline agents (canonical source) + `team/` (5 Team Mode agents, Claude Code only).
- `.opencode/agents/` — OpenCode mirror of the 11 core agents (derived, kept in sync by hand).
- `.kimi-code/agents/` — Kimi Code mirror of the 11 core agents (derived, kept in sync by hand).
- `docs/` — VitePress site. Config: `docs/.vitepress/config.js` (nav, sidebar, `srcDir: '..'`).
- `docs/setup/` — per-tool setup guides (Claude Code, Cursor, VS Code, JetBrains, Codex, OpenCode, Kimi Code, templates).
- `docs/distribution/` — distribution roadmap docs (discovery, plugin mapping, install).
- `skills/contract-checklist/SKILL.md` — shared reference skill invoked by `architect-agent`
  and `implementer-lead-agent`; published with the plugin.
- `.claude-plugin/` — Claude Code plugin metadata (`plugin.json`, `marketplace.json`).
- `.claude/CLAUDE.md`, `.github/copilot-instructions.md` — copies of the commit/versioning
  conventions; keep them consistent with this file when the conventions change.
- `internal/` — internal reference docs (cost analysis, routing logic, PROOF methodology).
  **Not published** to the site; do not link to it from `docs/`.
- `vercel.json`, `netlify.toml` — deployment configs (see Deployment below).

## Conventions for Agent Files

Each agent file is a Markdown document with YAML frontmatter consumed by AI coding tools:

```yaml
---
name: orchestrator-agent
description: "..."
tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion
model: opus
---
```

Rules that apply when editing agent files:

- **Artifact format**: every phase output is a Markdown file with a small YAML frontmatter
  header (only fields the orchestrator branches on: status, counts, `next_agent`) followed
  by a plain-Markdown body. Never introduce JSON artifact formats — nothing parses these
  files programmatically; consumers are other agents (prompt text) or humans at HITL gates.
- **Risks/Issues/Findings tables** carry a `Disposition` column, resolved row-by-row by the
  orchestrator's Risk Disposition Loop before the whole-artifact gate.
- **HITL gates are mandatory**: agents must never skip a human gate, and the orchestrator
  must never run headless. Where `AskUserQuestion` is unavailable (non-Claude-Code hosts),
  agents fall back to a printed text menu.
- **Ledger model**: each feature folder in the target project has a `ledger/` subdirectory
  (`constraints.md`, `decisions.md`, `open-questions.md`) that agents read at phase start
  and update at phase end.

## OpenCode Mirror Sync

Every file in `agents/` (the 11 core pipeline agents, **not** `agents/team/`) has a
hand-maintained counterpart in `.opencode/agents/`. There is no conversion script — the
mirror is kept in sync by hand, on purpose.

**Rule: if a commit touches any `agents/*.md` file, it must also update the matching
`.opencode/agents/*.md` file in the same commit.**

- Body changes → copy the same body change into the mirror (bodies must stay
  byte-for-byte identical between the two).
- Frontmatter changes (`description:`, `tools:`, `model:`) → re-derive the mirror's
  `description:`/`permission:`/`model:` fields using the mapping table in
  `docs/setup/opencode.md` (`tools:` CSV → granular `permission:` object;
  `model: alias` → provider-prefixed model id; `name:` dropped; add
  `mode: primary|subagent` — only `orchestrator-agent` is `primary`).
- New core agent file → add both `agents/<name>.md` and `.opencode/agents/<name>.md`.
  Removed core agent file → remove both.
- Before committing, diff the two directories' bodies (strip frontmatter from each side
  and compare) to confirm nothing drifted.

**`agents/team/*.md` is explicitly out of scope for this mirror.** Team Mode's
coordination logic (the Agent Teams flag, the `agent` tool for spawning, an unconditional
`AskUserQuestion` call with no fallback in `implementer-lead-agent.md`) is
Claude-Code-specific; a frontmatter-only port ships a non-functional agent.

## Kimi Code Mirror Sync

Every file in `agents/` (the 11 core pipeline agents, **not** `agents/team/`) has a
hand-maintained counterpart in `.kimi-code/agents/`. Same discipline as the OpenCode
mirror: no conversion script, kept in sync by hand, on purpose.

**Rule: if a commit touches any `agents/*.md` file, it must also update the matching
`.kimi-code/agents/*.md` file in the same commit.**

- Body changes → copy the same body change into the mirror (bodies must stay
  byte-for-byte identical between the two).
- Frontmatter changes (`description:`, `tools:`, `model:`) → re-derive the mirror's
  fields using the mapping table in `docs/setup/kimi-code.md`. This mirror is much
  closer to the canonical format than OpenCode's: `name:`, `description:`, and the
  `tools:` CSV all copy over unchanged (Kimi Code accepts Claude-Code-style
  frontmatter and shares the same tool names, `AskUserQuestion` included). The only
  translation is `model: opus` → `model_preference: primary` and
  `model: sonnet` → `model_preference: secondary` — symbolic preferences that
  resolve to the user's configured Kimi models, never concrete Claude model ids.
- New core agent file → add both `agents/<name>.md` and `.kimi-code/agents/<name>.md`.
  Removed core agent file → remove both.
- Before committing, diff the two directories' bodies (strip frontmatter from each side
  and compare) to confirm nothing drifted.

**`agents/team/*.md` is explicitly out of scope for this mirror too** — same rationale
as the OpenCode exclusion: Team Mode's coordination logic is Claude-Code-specific, and
a frontmatter-only port ships a non-functional agent.

## Docs Site Conventions

- `docs/.vitepress/config.js` reads `version` from `package.json` and injects it
  site-wide. `srcDir` is `..` (repo root), so the site sources Markdown from the whole
  repo; `CHANGELOG.md` is rewritten to `/changelog`. `AGENTS.md`, `README.md`, and other
  root files are excluded via `srcExclude`.
- `docs/agent-files.md` and `docs/agent-files-team.md` embed the raw agent files at build
  time with VitePress `<<< @/path` imports — **no manual sync needed** for their content,
  but a new agent file must be added to these pages, and to the nav/sidebar in
  `docs/.vitepress/config.js`.

## Commit Convention

All commits to this repository must follow [Conventional Commits](https://www.conventionalcommits.org/).

**Format:**

```
<type>(<scope>): <short summary>

[body — 1–4 lines, only when the change is non-trivial]

[footer — BREAKING CHANGE: … / Closes #n]
```

**Rules:**
- Title is required; body and footer are optional.
- Title: imperative mood, max 72 chars, no period at the end.
- Body: 1–4 lines depending on the complexity and volume of changes. Omit for trivial commits.
- Common types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `perf`.

**Examples:**

Simple change (title only):
```
docs(setup): add JetBrains setup guide
```

Non-trivial change (title + body):
```
feat(orchestrator): add context-extractor pre-pipeline step

Agents now receive a pre-built 00-context.json produced by the
context-extractor-agent, reducing redundant codebase analysis.

Closes #38
```

After making changes to this repository, generate a commit message following the above
rules and present it in a fenced code block ready to copy and paste. Do not run
`git commit` unless explicitly asked.

## Versioning & Changelog

Every change must bump the version in `package.json` and add a matching entry to
`CHANGELOG.md`. **The `version` field in `.claude-plugin/plugin.json` must be bumped to
the same value** — the two files are released together.

**Rules:**

- Follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.
  - `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `perf` → bump PATCH.
  - `feat` → bump MINOR.
  - Breaking change (`BREAKING CHANGE:` footer or `!` after type) → bump MAJOR.
- Update `version` in [package.json](./package.json) to the new value.
- Prepend a new section to [CHANGELOG.md](./CHANGELOG.md)
  using the existing format:

  ```markdown
  ## vX.Y.Z — Month D, YYYY

  ### Added | Changed | Fixed | Removed

  - **`path/to/file`** — short description of the change.
  ```

- Group entries under `Added`, `Changed`, `Fixed`, or `Removed`
  (omit empty groups).
- Use the current date (today) for the entry header.
- Reference impacted files with backtick-wrapped paths
  and explain the user-visible effect, not the implementation detail.

After making changes, present both the bumped `package.json` version
and the new changelog block alongside the commit message.

## Deployment

- **Vercel** (primary): auto-deploys on push to `main`. `vercel.json` sets
  `buildCommand: npm run docs:build`, `outputDirectory: docs/.vitepress/dist`.
- **Netlify**: `.github/workflows/deploy-docs.yml` triggers a Netlify deploy hook
  (via secret `NETLIFY_DEPLOY_HOOK`) on pushes of `v*` tags. `netlify.toml` mirrors the
  same build command/output and pins Node 22.
- A release therefore means: bump versions + changelog, commit, tag `vX.Y.Z`, push.

## Security Considerations

- This repo ships prompt/instruction files, not executable code; the main integrity risk
  is content drift, addressed by the mirror-sync and changelog rules above.
- Never commit secrets. The only secret in use is `NETLIFY_DEPLOY_HOOK`, stored in
  GitHub Actions secrets.
- `internal/` contains unpublished internal material — do not reference or expose it
  from the public site (`docs/`).

## License

AGPL-3.0 — see `LICENSE`.
