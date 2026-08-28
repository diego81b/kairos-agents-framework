# Skills & MCP Enhancements

KAIROS agents declare **optional enhancements** via skills and MCP tools. The framework works fully without them — all enhancements are additive only. No skill or MCP is a hard dependency.

KAIROS does not recommend or depend on any third-party Skill marketplace. Every enhancement below is either an Anthropic-authored Claude Code built-in, an internal skill authored and shipped as part of the KAIROS plugin itself (auto-installed with `claude plugin install kairos`, same as every agent file), or an MCP server.

---

## How a Skill Actually Works

A Skill is one Markdown file (`SKILL.md`) with a YAML `description` header and an instruction body — a checklist, a format, a process. It is **not** injected into every prompt: Claude Code's `Skill` tool loads it on demand, only when the current task matches that `description`, and only into the agent that invoked it. This is different from an MCP server, which is a live external tool an agent calls repeatedly (a browser, a database, a deploy target) — a Skill is read-once instructions, an MCP is a running connection.

KAIROS ships its own internal skills, under `skills/` in this repo, for one reason: several agents needed the *identical* checklist (how to tally a Risks table, what error format to show on missing input) and duplicating that prose across 9+ agent files meant it would drift out of sync the first time one file got edited and the others didn't. Each internal skill lives once; every consuming agent's body just says "apply the `<name>` skill" and the shared text loads at that point instead of being copy-pasted per agent.

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

| Skill | What it does | Agents that benefit |
|-------|---------------|---------------------|
| `code-review` | Structured multi-angle review pass (correctness, security, style, standards) | `code-reviewer-agent` |
| `security-review` | Adversarial security audit checklist — asks "how do I break this," not just "does this pass a compliance box" | `security-reviewer-agent`, `teammate-backend-agent` |
| `verify` / `run` | Actually executes the project (build, test, run) to confirm a change works, instead of trusting a static read of the code | `implementer-tdd-agent`, `implementer-coder-agent`, `test-verifier-agent`, `teammate-tests-agent`, `teammate-frontend-agent`, `release-planner-agent` |
| `deep-research` | Multi-source investigation pattern for open-ended questions, before committing to an answer | `context-extractor-agent`, `impact-assessment-agent`, `pm-agent`, `architect-agent`, `retrospective-agent` |
| `outcome-issue-generator` | Drafts outcome-driven issue/ticket text from a requirement | `pm-agent` |

### Internal (KAIROS-authored) skills

No install required — these ship as part of the KAIROS plugin itself, under `skills/` in this repo, and are auto-installed together with the agent files by `claude plugin install kairos`. Each row links to the actual `SKILL.md` — open it to see the full checklist, not just the summary below.

| Skill | What it enforces | Agents that use it |
|-------|-------------------|---------------------|
| [`agent-contract`](/skills/agent-contract/SKILL) | One shared `🚨 AGENT ERROR` format for a missing required input, instead of nine agents each inventing their own wording | `pm-agent`, `architect-agent`, `impact-assessment-agent`, `code-reviewer-agent`, `security-reviewer-agent`, `test-verifier-agent`, `release-planner-agent`, `documentation-agent`, `retrospective-agent` |
| [`contract-checklist`](/skills/contract-checklist/SKILL) | 9 questions to resolve before finalizing any API/DB contract — entity lifecycle, IDOR risk, idempotency, delete behavior, pagination, error shape | `architect-agent`, `implementer-lead-agent` |
| [`code-simplification`](/skills/code-simplification/SKILL) | REFACTOR-step checklist: what to simplify, how to confirm behavior didn't change, when to stop | `implementer-tdd-agent`, `implementer-coder-agent` (REFACTOR step) |
| [`artifact-bookkeeping`](/skills/artifact-bookkeeping/SKILL) | Pure-arithmetic rules for tallying a Risk/Issue/Finding table by impact and deriving each phase's pass/fail status from a fixed threshold — no agent "eyeballs" a count | `pm-agent`, `architect-agent`, `impact-assessment-agent`, both implementers, `code-reviewer-agent`, `security-reviewer-agent`, `test-verifier-agent`, `release-planner-agent`, `documentation-agent`, `orchestrator-agent` |
| [`coding-discipline`](/skills/coding-discipline/SKILL) | Pre-implementation checklist: scope discipline, no speculative abstraction, surface assumptions, trust boundaries, WHY-only comments | `implementer-tdd-agent`, `implementer-coder-agent`, `implementer-lead-agent`, all 4 teammate agents |
| [`issue-tracker-comment`](/skills/issue-tracker-comment/SKILL) | Shared jira/glab/bitbucket commands for posting a phase's output as a comment on the originating issue | every phase agent's own optional tracker-comment step |

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

Every agent above also applies whichever internal (KAIROS-authored) skill from the table above fits its role — omitted here since this table tracks *optional* enhancements, and the internal skills are a native part of each agent's own process, not a bolt-on. `agent-contract` specifically is omitted from every row above for the same reason and because it applies almost universally (see the internal-skills table above for its full agent list), not per-phase.

---

## Gaps (no generic solution available)

- **Database MCP** — no mature generic database MCP exists. All database MCPs are vendor-specific. `teammate-database-agent` has no MCP enhancement.
- **Deploy MCP** — all deploy MCPs (Vercel, Buildkite, etc.) are vendor-specific. `release-planner-agent` uses `verify`/`run` for smoke testing but has no generic deploy automation.
- **LSP** — useful for type-aware code navigation, but no implementation with sufficient adoption exists (all available LSP MCP wrappers have under 400 stars). Excluded pending a more mature option.
