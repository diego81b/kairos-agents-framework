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
mkdir -p .github/agents .github/skills
cp path/to/kairos/agents/*.md .github/agents/
cp -r path/to/kairos/skills/* .github/skills/
```

Copy the `skills/` folder too. Agent bodies link to their shared skills as `../skills/<name>/SKILL.md`, a path resolved from the agent file's own folder, so from `.github/agents/` it lands in `.github/skills/`. The orchestrator reads six `orchestrator-*` skills in many runs and every phase agent opens with `agent-contract` and writes through `artifact-template`: without the folder they fail.

::: tip Shared with VS Code
If you already set up KAIROS for VS Code, the `.github/agents/` files work in JetBrains too — no duplication needed.
:::

## Step 3 — Add `target: github-copilot` to agent frontmatter

To target both VS Code and JetBrains, omit the `target` field (defaults to both). To target only JetBrains/Copilot cloud agent, set `target: github-copilot`:

```yaml
---
name: pm-agent
description: "Analyzes feature requirements and elicits constraints. Use when you have a vague feature request that needs structured analysis."
tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion
model: sonnet
# target: github-copilot   ← set only if you want JetBrains-only; omit for both VS Code and JetBrains
---
```

This is the shipped `pm-agent` frontmatter with the optional `target` line added. This page has not verified how the Copilot plugin treats the `tools:` and `model:` values; keep the `name` as shipped, because the orchestrator names its agents by it.

::: info `handoffs` not supported in JetBrains
The `handoffs` field (used for buttons in VS Code) is **not supported** in the JetBrains/Copilot environment, and KAIROS does not need it: the orchestrator owns the gates and the dispatch.
:::

## Step 4 — Start a KAIROS session

Open Copilot Chat in JetBrains (`View → Tool Windows → GitHub Copilot Chat`), select the **Orchestrator** agent from the dropdown, and give it the request with no agent list:

```
Add Stripe payments to the checkout, issue #42
```

The orchestrator measures the change, derives which agents run (a small fix may skip the PM and the architect entirely), shows its Start Gate and dispatches the subagents itself. Do not name agents in the prompt. Whether the plugin lets the orchestrator dispatch subagents is not verified on this page; if it cannot, ask Copilot to run each agent the orchestrator names.

## Step 5 — HITL checkpoints

JetBrains has no `AskUserQuestion`, so the orchestrator's gates use the text menu:

```
✅ Approve and continue to the next phase
✏️  Request changes (describe what to fix)
⏭️  Skip next (skip the next agent)
⛔  Stop pipeline
```

Reply with your choice. Standalone agents print the same menu without Skip next. Three gates continue on their own when no check finds anything to decide (the bug triage, the requirements, the last wave of Phase 3) and print what they accepted; `every gate` brings the question back. Every other gate waits for you, and the gates that write outside `.kairos/` (the documentation draft, the QA plan) always ask.

## Step 6 — `.kairos/` outputs

Each agent whose `tools` include `Write` or `Edit` saves its own output to `.kairos/<feature_folder>/` through its "Write to Project" step. The two read-only agents (`impact-assessment-agent`, `security-reviewer-agent`) cannot, so the orchestrator writes their artifacts, and it alone writes `ledger/run.md` and `_tracking.md`. The orchestrator derives `feature_folder` at pipeline start (e.g. `issue-42_add-stripe-payments` or `feature_add-stripe-payments`).

If your Copilot build does not expose file writing to agents, nothing lands in `.kairos/` and the run cannot resume: copy each artifact from the chat into `.kairos/<feature_folder>/` by hand, or use VS Code, where the page lists the write path. This page has not run the JetBrains plugin to confirm which case you get.

Four project settings (`autonomy`, `manual-qa`, `qa-dir`, `test-changed`) work here like on every host; see [Customizing KAIROS](/customizing). The `model.` lines do not, because the plugin takes the model from each agent's `model:` field.

## Feature comparison vs Claude Code

| Feature | Claude Code | JetBrains + Copilot |
|---------|------------|---------------------|
| Native subagent format | ✅ `.claude/agents/` | ✅ `.github/agents/` (preview) |
| Context isolation per agent | ✅ | ⚠️ Depends on Copilot implementation |
| Auto-delegation via `description` | ✅ | ✅ |
| HITL gate | ✅ Orchestrator-enforced, `AskUserQuestion` | ⚠️ Orchestrator-enforced, text menu |
| `handoffs` buttons | n/a | ❌ Not supported (not needed) |
| `.kairos/` persistence | ✅ Automatic | ⚠️ Via each agent's Write step if the plugin exposes it, else by hand |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Agents not in dropdown | Check `.github/agents/` has `.md` files with `name` and `description` frontmatter |
| Plugin not finding agents | Ensure `target` is unset or `github-copilot`; `vscode`-only agents are ignored |
| Gate skipped or not shown as a menu | Reply in plain text with one of the four options; for a gate that continued on its own, `every gate` brings the question back |
| An agent reports it can't find `../skills/<name>/SKILL.md` | Copy `skills/` into `.github/skills/`, see Step 2 |
| Feature not available | Custom agents in JetBrains are preview — check plugin version and Copilot plan |

::: warning Layered Mode not supported
JetBrains does not run KAIROS Layered Mode (`agents/team/`, called Team Mode until v9.5.0). The orchestrator offers it only on Claude Code, and these agents are not mirrored for JetBrains. Use the single implementer.
:::
