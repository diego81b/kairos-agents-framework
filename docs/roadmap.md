# Roadmap

## v2.0 — Current (April 2026)

**Core framework**

- 8-agent ecosystem: Orchestrator + Context Extractor + PM + Architect + Implementer + Code Reviewer + Test Verifier + Release Planner
- Selective pipeline — explicit agent selection at run start, no automatic inference
- 4-option HITL gate at every phase (Approve / Request changes / Skip next / Stop)
- Pipeline Templates — preset checkboxes for Feature, Bug Fix, Hotfix, Refactor, Docs

**Implementer Team Pattern** (Claude Code only, optional)

- `implementer-lead-agent` — team coordinator: creates binding contracts (API, DB, test, pattern), spawns 4 parallel teammates
- `teammate-tests-agent` — test specialist (RED phase first, >80% coverage)
- `teammate-backend-agent` — backend specialist (APIs per contract)
- `teammate-frontend-agent` — frontend specialist (UI per contract)
- `teammate-database-agent` — database specialist (schema + migrations per contract)
- Team Mode routing in Orchestrator with explicit cost warning (~$0.068 single vs ~$0.242 team)

**Implementer two-stage gate**
- Phase 0: structured implementation plan (files, test cases, TDD order, risks) before any file is written
- Phase 1: TDD cycle — tests first, implementation after, coverage >80% enforced

**Multi-tool support**
- Claude Code (`.claude/agents/`)
- Cursor IDE (`.cursor/agents/`)
- VS Code Copilot (`.github/agents/` + native HITL handoffs)
- JetBrains AI Assistant
- OpenAI Codex CLI (`.codex/agents/` TOML format)

**Issue tracker integration**
- Jira (`jira-cli`) — auto-reads `## KAIROS Pipeline` from issue description
- GitLab Issues (`glab`) — supports `.gitlab/issue_templates/`
- Bitbucket Issues (REST API)

**Artifact isolation**
- `.kairos/<feature_folder>/` per feature — named from issue reference (`PROJ-42_add-stripe-payments`)
- One JSON file per phase, never overwritten across features

**Open source** — AGPL-3.0

---

## v2.1 — Planned (Q3 2026)

- **MCP server integration** — first-class support for `sequential-thinking`, `context7`, and project-specific MCP tools declared per agent  
- **GitHub Issues support** — complete the tracker trio alongside Jira / GitLab / Bitbucket  
- **Re-run single phase** — resume a pipeline from any phase without re-running the full sequence  
- **VS Code HITL improvements** — richer handoff buttons with artifact preview inline

---

## v2.2 — Planned (Q4 2026)

- **Pipeline metrics dashboard** — per-team velocity tracking across runs (phases completed, skip rates, revision counts)
- **Team template registry** — share and version `## KAIROS Pipeline` presets across a repository or organization
- **Parallel subagent execution** — allow independent phases (e.g. Architect + PM) to run concurrently where there are no dependencies

---

## v3.0 — Exploration (2027)

- **Custom agent composition** — define project-specific agents alongside the core 7, registered in the orchestrator
- **Cross-repo knowledge** — agents can query a shared codebase index for patterns and conventions without bloating context
- **Audit log UI** — browsable history of all KAIROS runs with phase diffs, approval decisions, and issue links

---

## License

AGPL-3.0 — free to use, fork, and modify. If you distribute a modified version, the source must remain open.

---

## Contact & Support

Built by **Comm.it** — Software Consulting Agency, Florence, Italy

- GitHub: [github.com/diego81b/kairos-agents-framework](https://github.com/diego81b/kairos-agents-framework)
- Website: [comm-it.it](https://comm-it.it)

---

*"The Right Moment for Development" — KAIROS Framework v2.0*
