---
description: Show which model each KAIROS agent really used and how many tokens it spent, measured from the session transcripts
allowed-tools: Bash
---

# KAIROS Usage — model and tokens per agent

**Claude Code only** — this reads the subagent transcripts Claude Code writes under `~/.claude/projects/`. If you are not running in Claude Code, stop and say so.

Run the script from the project root and print what it prints, unchanged:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/usage.mjs" $ARGUMENTS
```

The table has one row per **agent call**, never an aggregate per agent type; the last row is the total. With no arguments it reports the latest session of this project, the primary session included. `--feature <feature_folder>` reports every session but only the agents dispatched for that feature. `--feature <feature_folder> --write <file>` writes the same report to a file, which is how the orchestrator keeps `.kairos/<feature_folder>/_usage.md` current in a run: after every agent that returns, written by the script and never retyped by a model. `--session <id>` picks one session, `--json` prints machine-readable rows.

If `node` is missing, say so and stop: the script has no dependencies but needs Node 18 or later. If the script reports nothing found, relay that and do not estimate anything.

After the table, add at most three lines, and only from the table:
- every row whose Check column is not `ok` or `-`: the agent, the model it ran on and the model it was expected to run on. A mismatch means `.kairos/.models` or the agent's `model:` was not the model that answered;
- which agent spent the most output tokens;
- that cache-read tokens are billed far below the others, so a large cache-read figure is not a large cost.

The figures are read from the transcript file, never reported by an agent about itself; Claude Code does not document that file's format, so a Claude Code update can break the script. Say so if the table looks empty for a session you know ran agents.
