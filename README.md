# KAIROS Framework

**"The Right Moment for Development"**

Intelligent multi-agent SDLC orchestration

## What's Included

- **agents/** - 14 core agent definitions + 5 optional Team Mode specialists
- **docs/** - Complete documentation site (VitePress)
- **CHANGELOG.md** - Version history

## Optional Enhancements

KAIROS agents declare optional enhancements via skills and MCP tools. The framework works fully without them — enhancements are additive only.

KAIROS does not depend on or recommend any third-party skill plugin — coding-discipline and security-review heuristics ship natively as part of this plugin's own `skills/` directory, installed automatically with KAIROS itself.

**Recommended installs:**
- [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) — behavioral verification for test agents (42.8k stars)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) — E2E automation for test agents (33.3k stars)

See [Skills & MCP Enhancements](docs/skills-mcp.md) for the full map and install commands.

## Quick Start

1. Copy `agents/` to your project
2. Start Claude Code with the orchestrator as the session's **primary** agent — not by naming it inside an already-open chat: `claude --agent orchestrator-agent` (or `claude --agent kairos:orchestrator-agent` if installed as a plugin)
3. Describe the feature you want — the Orchestrator coordinates the pipeline automatically

## Invocation Contract

When starting a KAIROS run, invoke the orchestrator with the **bare feature request only**:

- **Never pre-select phases or agents in the invocation prompt.** Agent selection is a human decision made at the orchestrator's Step 0e gate — a caller-supplied list is treated as an unconfirmed proposal, never as authorization.
- **Never launch the orchestrator backgrounded or detached — and never invoke it by name inside an existing conversation.** Every phase ends at a HITL gate that needs a live human. In Claude Code, a spawned subagent has no `AskUserQuestion`, so gates degrade to the text-menu fallback — and this applies just as much to `@kairos:orchestrator-agent`/"use the orchestrator agent" typed mid-chat as to an explicit background launch, since both dispatch through the same `Agent` tool as a subagent. Start the session with the orchestrator as its **primary** agent instead — `claude --agent kairos:orchestrator-agent` (plugin install) or `claude --agent orchestrator-agent` (copied into `.claude/agents/`) — never as something you call from within another session. `--agent` is a startup flag only; to switch mid-session, exit (`Ctrl+D` / `/exit`) and relaunch with it.
- **Run the standalone pre-pipeline agents yourself if you want them.** `context-extractor-agent` and `impact-assessment-agent` are invoked directly by you, before the orchestrator — the orchestrator never auto-invokes them.

## Documentation Website

```bash
npm install          # install VitePress + dependencies
npm run docs:dev     # local dev server with hot reload
npm run docs:build   # build static site → docs/.vitepress/dist/
npm run docs:preview # preview the production build locally
```

## Deployment

The documentation site deploys automatically:

1. **Vercel** (primary) — auto-deploys on push to `main`
2. **Netlify** — triggered via deploy hook on `v*` tags

A release means: bump versions + changelog, commit, tag `vX.Y.Z`, push.

## Files

- `agents/` - Core agents + `team/` folder (Team Mode specialists)
- `docs/` - VitePress documentation site
- `CHANGELOG.md` - Version history
- `internal/` - Internal guides (cost analysis, routing logic, provider specifics)

## Workflow

1. **Edit docs** → modify files in `docs/`
2. **Preview locally** → `npm run docs:dev`
3. **Build** → `npm run docs:build`
4. **Deploy** → Git push (Vercel/Netlify auto-deploy)

## Implementation Modes

| Mode | Cost | Works on | When to use |
| --- | --- | --- | --- |
| Single Agent (default) | ~$0.068/feature | Everywhere | All features |
| Team Mode (optional) | ~$0.242/feature | Claude Code only | Critical systems, explicit request |

Team Mode activates a Lead + 4 parallel specialists (Tests, Backend, Frontend, Database). The Orchestrator always shows a cost warning before enabling it.

## License

AGPL-3.0

---

Built with intelligence, timing, and excellence. 🚀
