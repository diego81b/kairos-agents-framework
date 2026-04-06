# VS Code Setup

VS Code with GitHub Copilot supports **native custom agents** via `.github/agents/` — `.agent.md` files with YAML frontmatter, each running in its own isolated context. VS Code also reads `.claude/agents/` for Claude-format compatibility.

::: tip `.claude/agents/` also works
VS Code detects `.md` files in `.claude/agents/` following the Claude sub-agents format. If you already set up KAIROS for Claude Code, VS Code picks up the same files automatically.

**Priority for deduplication:** `.github/agents/` > `.claude/agents/`
:::

## Prerequisites

- [VS Code](https://code.visualstudio.com) installed
- [GitHub Copilot extension](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) installed
- GitHub Copilot subscription ($10/mo)
- Project open in VS Code with `agents/` from KAIROS

## Step 1 — Copy agents to `.github/agents/`

VS Code uses `.agent.md` extension, but also detects plain `.md` files in `.github/agents/`:

```bash
mkdir -p .github/agents
copy agents\*.md .github\agents\
```

Or use `.claude/agents/` if you already have Claude Code set up.

Project layout with native VS Code format:

```
your-project/
├── .github/
│   └── agents/
│       ├── orchestrator.agent.md
│       ├── pm-agent.agent.md
│       ├── architect-agent.agent.md
│       ├── implementer-agent.agent.md
│       ├── code-reviewer.agent.md
│       ├── test-verifier.agent.md
│       └── release-planner.agent.md
```

## Step 2 — Agent file format

VS Code native `.agent.md` format supports additional fields beyond Claude's format:

```yaml
---
name: PM Agent
description: Collects and structures requirements. Use at the START of a new feature.
tools: ['read', 'edit', 'search']
model: claude-sonnet-4-6
handoffs:
  - label: "✅ Continue to Architecture"
    agent: architect-agent
    prompt: "Design the architecture for the requirements above."
    send: false
  - label: "⛔ Stop here"
    agent: ""
---
```

The `handoffs` field implements the **HITL pattern natively**: after the PM Agent responds, VS Code shows buttons `✅ Continue to Architecture` and `⛔ Stop here`. Selecting one switches context to the next agent with pre-filled prompt — no manual copy-paste needed.

VS Code maps Claude tool names automatically:

| Claude tools | VS Code equivalent |
|-------------|--------------------|
| `read_file` | `read` |
| `write_file` | `edit` |
| `bash` | `execute` (shell) |

## Step 3 — Configure handoffs for HITL

Add `handoffs` to each KAIROS agent file to create the HITL gate chain:

**`pm-agent.agent.md`** excerpt:
```yaml
handoffs:
  - label: "✅ Approve → Architecture"
    agent: architect-agent
    prompt: "Design the architecture for these requirements: {output}"
    send: false
  - label: "✏️ Request changes"
    agent: pm-agent
    prompt: "Revise the requirements based on this feedback: "
    send: false
```

Repeat for each agent in the chain, pointing to the next phase.

## Step 4 — Start a KAIROS session

Open Copilot Chat, select the **Orchestrator** agent from the dropdown (or type `@orchestrator`), and prompt:

```
Help me implement [your feature] using the KAIROS framework
```

The orchestrator delegates to PM Agent. After PM Agent responds, the handoff buttons appear — select `✅ Approve → Architecture` to continue.

## Step 5 — `.kairos/` persistence

VS Code agents with `edit` in their `tools` list can write files. Add to each agent's instructions:

```markdown
After the user approves, save the output to `.kairos/<feature_folder>/01-requirements.json`.
```

Or save manually by copying the JSON from the chat after each approved phase.

## Feature comparison vs Claude Code

| Feature | Claude Code | VS Code + Copilot |
|---------|------------|-------------------|
| Native subagent format | ✅ `.claude/agents/` | ✅ `.github/agents/*.agent.md` |
| Context isolation per agent | ✅ | ✅ |
| Auto-delegation via `description` | ✅ | ✅ |
| HITL built-in gate | ✅ Orchestrator-enforced | ✅ Via `handoffs` buttons |
| `.kairos/` persistence | ✅ Automatic | ⚠️ Via agent instructions or manual |
| Claude format compatibility | ✅ Native | ✅ Reads `.claude/agents/*.md` |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Agents not in dropdown | Check `.github/agents/` has `.agent.md` files with valid frontmatter |
| Handoff buttons not appearing | Verify `handoffs:` is in agent frontmatter and `agent` tool is in `tools:` |
| Wrong agent format | Plain `.md` files work in `.github/agents/` but `.agent.md` unlocks full features |
| `.kairos/` not written | Add `edit` to agent `tools:` and explicit instruction to write the file |
