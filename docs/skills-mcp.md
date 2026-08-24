# Skills & MCP Enhancements

KAIROS agents declare **optional enhancements** via skills and MCP tools. The framework works fully without them — all enhancements are additive only. No skill or MCP is a hard dependency.

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

### karpathy-guidelines

| Skill | Stars | Install | Agents that benefit |
|-------|-------|---------|---------------------|
| `karpathy-guidelines` | 167k+ | `claude plugin install multica-ai/andrej-karpathy-skills` | `implementer-tdd-agent`, `implementer-coder-agent`, `implementer-lead-agent`, `teammate-backend-agent`, `teammate-frontend-agent`, `teammate-tests-agent`, `teammate-database-agent` |

Coding best practices distilled from Andrej Karpathy's principles. Referenced in all implementer and teammate agents.

### Trail of Bits plugins

[Trail of Bits](https://github.com/trailofbits/skills) is a plugin marketplace, not a monolithic suite (5.5k stars, 39 plugins, 74 skills). Each plugin installs independently.

::: info Install decision
`testing-handbook-skills` and `trailmark` were evaluated but **skipped** — those plugins bundle too many unrelated skills (15 and 10 respectively) for the single skill each would contribute. Inline fallback instructions are embedded directly in the relevant agent files instead.
:::

| Plugin | Skills included | Agents that benefit | Purpose |
|--------|-----------------|---------------------|---------|
| `differential-review` | `differential-review` | `code-reviewer-agent` | Security-focused diff review |
| `insecure-defaults` | `insecure-defaults` | `security-reviewer-agent`, `teammate-backend-agent` | Hardcoded secrets and insecure defaults detection |
| `supply-chain-risk-auditor` | `supply-chain-risk-auditor` | `security-reviewer-agent` | Dependency threat audit |
| `static-analysis` | `semgrep`, `codeql`*, `sarif-parsing` | `code-reviewer-agent`, `test-verifier-agent` | Static analysis stack |
| `variant-analysis` | `variant-analysis` | `security-reviewer-agent` | Vulnerability pattern search across codebase |
| `sharp-edges` | `sharp-edges` | `code-reviewer-agent`, `teammate-backend-agent` | Error-prone API usage detection |
| `property-based-testing` | `property-based-testing` | `test-verifier-agent`, `teammate-tests-agent` | Property-based test generation |
| `mutation-testing` | `mutation-testing` | `test-verifier-agent` | Mutation testing to validate test suite strength |
| `fp-check` | `fp-check` | `code-reviewer-agent`, `test-verifier-agent` | False-positive verification for static analysis findings |
| `ask-questions-if-underspecified` | `ask-questions-if-underspecified` | `pm-agent` | Surfaces ambiguities before requirement analysis |
| `audit-context-building` | `audit-context-building` | `context-extractor-agent` | Ultra-granular code analysis for audit-quality context |

*`codeql` requires CodeQL CLI installed locally — optional.

---

## Install commands

```bash
# Trail of Bits plugins (approved subset)
claude plugin install trailofbits/skills/differential-review
claude plugin install trailofbits/skills/insecure-defaults
claude plugin install trailofbits/skills/supply-chain-risk-auditor
claude plugin install trailofbits/skills/static-analysis
claude plugin install trailofbits/skills/variant-analysis
claude plugin install trailofbits/skills/sharp-edges
claude plugin install trailofbits/skills/property-based-testing
claude plugin install trailofbits/skills/mutation-testing
claude plugin install trailofbits/skills/fp-check
claude plugin install trailofbits/skills/ask-questions-if-underspecified
claude plugin install trailofbits/skills/audit-context-building

# karpathy-guidelines
claude plugin install multica-ai/andrej-karpathy-skills
```

---

## Full agent × enhancement map

| Agent | Phase | Built-in skills | Trail of Bits plugins | MCP |
|-------|-------|-----------------|-----------------------|-----|
| `orchestrator-agent` | Coordinator | — | — | — |
| `context-extractor-agent` | Pre | `deep-research` | `audit-context-building` | — |
| `impact-assessment-agent` | Pre | `deep-research` | — | — |
| `pm-agent` | 1 | `deep-research`, `outcome-issue-generator` | `ask-questions-if-underspecified` | — |
| `architect-agent` | 2 | `deep-research` | — | — |
| `implementer-tdd-agent` | 3a | `karpathy-guidelines`, `verify`/`run` | — | — |
| `implementer-coder-agent` | 3b | `karpathy-guidelines`, `verify`/`run` | — | — |
| `code-reviewer-agent` | 4 | `code-review`, `security-review` | `differential-review`, `static-analysis`, `sharp-edges`, `fp-check` | — |
| `security-reviewer-agent` | 4 | `security-review` | `insecure-defaults`, `supply-chain-risk-auditor`, `variant-analysis` | — |
| `test-verifier-agent` | 5 | `verify`/`run` | `property-based-testing`, `mutation-testing`, `sarif-parsing`, `fp-check` | Chrome DevTools MCP, Playwright MCP |
| `release-planner-agent` | 6 | `verify`/`run` | — | — |
| `documentation-agent` | 6b | — | — | — |
| `retrospective-agent` | Post | `deep-research` | — | — |
| `improvement-advisor-agent` | Post | — | — | — |
| `implementer-lead-agent` | Team | `karpathy-guidelines` | — | — |
| `teammate-backend-agent` | Team | `karpathy-guidelines`, `security-review` | `sharp-edges`, `insecure-defaults` | — |
| `teammate-database-agent` | Team | `karpathy-guidelines` | — | — |
| `teammate-frontend-agent` | Team | `karpathy-guidelines`, `verify`/`run` | — | Chrome DevTools MCP, Playwright MCP |
| `teammate-tests-agent` | Team | `karpathy-guidelines`, `verify`/`run` | `property-based-testing` | Chrome DevTools MCP, Playwright MCP |

---

## Gaps (no generic solution available)

- **Database MCP** — no mature generic database MCP exists. All database MCPs are vendor-specific. `teammate-database-agent` has no MCP enhancement.
- **Deploy MCP** — all deploy MCPs (Vercel, Buildkite, etc.) are vendor-specific. `release-planner-agent` uses `verify`/`run` for smoke testing but has no generic deploy automation.
- **LSP** — useful for type-aware code navigation, but no implementation with sufficient adoption exists (all available LSP MCP wrappers have under 400 stars). Excluded pending a more mature option.
