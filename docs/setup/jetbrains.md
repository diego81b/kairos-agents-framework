# JetBrains Setup

JetBrains IDEs (IntelliJ IDEA, PyCharm, WebStorm, etc.) support GitHub Copilot **custom agents** in public preview via the same `.github/agents/` folder used by VS Code. Agent files use YAML frontmatter with `target: github-copilot` to target the JetBrains/Copilot environment.

::: warning Preview feature
Custom agents in JetBrains are in **public preview** and subject to change. Requires the [GitHub Copilot plugin for JetBrains](https://plugins.jetbrains.com/plugin/17718-github-copilot) and a Copilot subscription.
:::

## Prerequisites

- JetBrains IDE (IntelliJ IDEA, PyCharm, WebStorm, etc.)
- [GitHub Copilot plugin](https://plugins.jetbrains.com/plugin/17718-github-copilot) installed
- GitHub Copilot subscription ($10/mo)
- Project open with `agents/` from KAIROS

## Step 1 — Install and authenticate

In `Settings → Plugins → Marketplace`, install **GitHub Copilot**. Sign in via `Tools → GitHub Copilot → Login to GitHub`.

## Step 2 — Copy agents to `.github/agents/`

JetBrains reads custom agents from `.github/agents/` in your project root — the same location as VS Code:

```bash
mkdir -p .github/agents
copy agents\*.md .github\agents\
```

::: tip Shared with VS Code
If you already set up KAIROS for VS Code, the `.github/agents/` files work in JetBrains too — no duplication needed.
:::

## Step 3 — Add `target: github-copilot` to agent frontmatter

To target both VS Code and JetBrains, omit the `target` field (defaults to both). To target only JetBrains/Copilot cloud agent, set `target: github-copilot`:

```yaml
---
name: PM Agent
description: Collects and structures requirements. Use at the START of a new feature.
tools:
  - read
  - edit
  - search
model: claude-sonnet-4-6
# target: github-copilot   ← set only if you want JetBrains-only; omit for both VS Code and JetBrains
---
```

::: info `handoffs` not supported in JetBrains
The `handoffs` field (used for HITL buttons in VS Code) is **not supported** in the JetBrains/Copilot environment. HITL is enforced manually via agent prompt wording.
:::

## Step 4 — Start a KAIROS session

Open Copilot Chat in JetBrains (`View → Tool Windows → GitHub Copilot Chat`), select the **Orchestrator** agent from the dropdown, and prompt:

```
Help me implement [your feature] using the KAIROS framework
```

The orchestrator delegates to the PM Agent based on its `description` field.

## Step 5 — HITL checkpoints

Since `handoffs` are not available, the HITL gate relies on agent prompt wording. Each KAIROS agent ends with:

```
✅ Approve and continue to the next phase
✏️  Request changes (describe what to fix)
⛔  Stop here
```

Reply with your choice. The orchestrator will not proceed without your explicit approval (as defined in `agents/orchestrator-agent.md`).

## Step 6 — Save `.kairos/` outputs

JetBrains Copilot Chat does not write files automatically. After each approved phase:

1. Copy the JSON output from the chat
2. Save to `.kairos/<feature_folder>/01-requirements.json`, `.kairos/<feature_folder>/02-architecture.json`, etc.

> `feature_folder` is derived by the orchestrator at pipeline start (e.g. `issue-42_add-stripe-payments` or `feature_add-stripe-payments`).

Or instruct the agent to save it directly if `edit`/`write` tools are available.

## Feature comparison vs Claude Code

| Feature | Claude Code | JetBrains + Copilot |
|---------|------------|---------------------|
| Native subagent format | ✅ `.claude/agents/` | ✅ `.github/agents/` (preview) |
| Context isolation per agent | ✅ | ⚠️ Depends on Copilot implementation |
| Auto-delegation via `description` | ✅ | ✅ |
| HITL via `handoffs` buttons | ✅ (Claude Code behavior) | ❌ Not supported |
| HITL via agent prompt | ✅ | ✅ Manual |
| `.kairos/` persistence | ✅ Automatic | ⚠️ Via tools or manual |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Agents not in dropdown | Check `.github/agents/` has `.md` files with `name` and `description` frontmatter |
| Plugin not finding agents | Ensure `target` is unset or `github-copilot`; `vscode`-only agents are ignored |
| HITL not respected | Add explicit "wait for ✅ approval" wording to each agent's instructions |
| Feature not available | Custom agents in JetBrains are preview — check plugin version and Copilot plan |
