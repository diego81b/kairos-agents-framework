# Skills & MCP Enhancements

KAIROS agents declare **optional enhancements** via skills and MCP tools. The framework works fully without them — all enhancements are additive only. No skill or MCP is a hard dependency.

KAIROS does not recommend or depend on any third-party Skill marketplace. Every enhancement below is either an Anthropic-authored Claude Code built-in, an internal skill authored and shipped as part of the KAIROS plugin itself (auto-installed with `claude plugin install kairos`, same as every agent file), or an MCP server.

---

## MCP Tools

| MCP | Stars | Install | Agents that benefit |
|-----|-------|---------|---------------------|
| [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) | 42.8k | See [install guide](https://github.com/ChromeDevTools/chrome-devtools-mcp) | `test-verifier-agent`, `teammate-tests-agent`, `teammate-frontend-agent` |
| [Playwright MCP](https://github.com/microsoft/playwright-mcp) | 33.3k | See [install guide](https://github.com/microsoft/playwright-mcp) | `test-verifier-agent`, `teammate-tests-agent`, `teammate-frontend-agent` |

Chrome DevTools MCP enables screenshot capture, console inspection, network monitoring, Lighthouse audits, and custom in-browser assertions. Playwright MCP enables full E2E test execution against a running app.

::: warning Subagent tool access requires an explicit frontmatter grant
Installing the MCP server is not enough. `test-verifier-agent`, `teammate-tests-agent`, and `teammate-frontend-agent` run as Claude Code subagents (via the `Agent`/`Task` tool), whose `tools:` frontmatter is a strict allowlist — a tool not listed there is unreachable even if the MCP is connected session-wide, and even if the agent's body prose tells it to use that tool. `agents/test-verifier-agent.md`, `agents/team/teammate-tests-agent.md`, and `agents/team/teammate-frontend-agent.md` all list `mcp__chrome-devtools__*, mcp__playwright__*` in `tools:` for exactly this reason — if you add MCP tools to another agent, grant them the same way (`mcp__<server>__*` wildcards a whole server) or the agent will silently never call them.
:::

---

## Skills

### Built-in Claude Code skills

No install required — these ship with Claude Code.

| Skill | Agents that benefit |
|-------|---------------------|
| `code-review` | `code-reviewer-agent` |
| `security-review` | `security-reviewer-agent`, `teammate-backend-agent` |
| `verify` / `run` | `implementer-tdd-agent`, `implementer-coder-agent`, `test-verifier-agent`, `teammate-tests-agent`, `teammate-frontend-agent`, `release-planner-agent` |
| `deep-research` | `context-extractor-agent`, `impact-assessment-agent`, `pm-agent`, `architect-agent`, `retrospective-agent` |
| `outcome-issue-generator` | `pm-agent` |

### Internal (KAIROS-authored) skills

No install required — these ship as part of the KAIROS plugin itself, under `skills/` in this repo, and are auto-installed together with the agent files by `claude plugin install kairos`.

| Skill | Agents that benefit |
|-------|---------------------|
| `contract-checklist` | `architect-agent`, `implementer-lead-agent` |
| `code-simplification` | `implementer-tdd-agent`, `implementer-coder-agent` (REFACTOR step) |
| `artifact-bookkeeping` | `pm-agent`, `architect-agent`, `impact-assessment-agent`, both implementers, `code-reviewer-agent`, `security-reviewer-agent`, `test-verifier-agent`, `release-planner-agent`, `documentation-agent`, `orchestrator-agent` |
| `coding-discipline` | `implementer-tdd-agent`, `implementer-coder-agent`, `implementer-lead-agent`, `teammate-backend-agent`, `teammate-frontend-agent`, `teammate-database-agent`, `teammate-tests-agent` |

These replace what used to be third-party plugin dependencies (`karpathy-guidelines` and 11 Trail of Bits plugins) — see `CHANGELOG.md` for the removal. Their guidance was folded into each consuming agent's own checklist natively (a concrete check item, an unconditional process step) rather than gated behind "if this external skill is installed."

---

## Full agent × enhancement map

| Agent | Phase | Built-in skills | MCP |
|-------|-------|-----------------|-----|
| `orchestrator-agent` | Coordinator | — | — |
| `context-extractor-agent` | Pre | `deep-research` | — |
| `impact-assessment-agent` | Pre | `deep-research` | — |
| `pm-agent` | 1 | `deep-research`, `outcome-issue-generator` | — |
| `architect-agent` | 2 | `deep-research` | — |
| `implementer-tdd-agent` | 3a | `verify`/`run` | — |
| `implementer-coder-agent` | 3b | `verify`/`run` | — |
| `code-reviewer-agent` | 4 | `code-review`, `security-review` | — |
| `security-reviewer-agent` | 4 | `security-review` | — |
| `test-verifier-agent` | 5 | `verify`/`run` | Chrome DevTools MCP, Playwright MCP |
| `release-planner-agent` | 6 | `verify`/`run` | — |
| `documentation-agent` | 6b | — | — |
| `retrospective-agent` | Post | `deep-research` | — |
| `improvement-advisor-agent` | Post | — | — |
| `implementer-lead-agent` | Team | — | — |
| `teammate-backend-agent` | Team | `security-review` | — |
| `teammate-database-agent` | Team | — | — |
| `teammate-frontend-agent` | Team | `verify`/`run` | Chrome DevTools MCP, Playwright MCP |
| `teammate-tests-agent` | Team | `verify`/`run` | Chrome DevTools MCP, Playwright MCP |

Every agent above also applies whichever internal (KAIROS-authored) skill from the table above fits its role — omitted here since this table tracks *optional* enhancements, and the internal skills are a native part of each agent's own process, not a bolt-on.

---

## Gaps (no generic solution available)

- **Database MCP** — no mature generic database MCP exists. All database MCPs are vendor-specific. `teammate-database-agent` has no MCP enhancement.
- **Deploy MCP** — all deploy MCPs (Vercel, Buildkite, etc.) are vendor-specific. `release-planner-agent` uses `verify`/`run` for smoke testing but has no generic deploy automation.
- **LSP** — useful for type-aware code navigation, but no implementation with sufficient adoption exists (all available LSP MCP wrappers have under 400 stars). Excluded pending a more mature option.
