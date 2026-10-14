# Customizing KAIROS

KAIROS has four places where you can change how it behaves, from the narrowest to the widest. This page lists every setting, which place holds it and which one wins. Anything not on this page is not a setting: it is the text of an agent file.

## Which one do I use?

| I want to | Use | Who sees it |
|-----------|-----|-------------|
| change the pipeline for one issue (size, effort, areas, agents to add or skip, auto-fix) | the `## KAIROS Pipeline` block in the issue, see [Pipeline Templates](/setup/templates) | everyone who opens the issue |
| set the models, the QA plan folder or the manual QA answer for the whole team | `.kairos-cfg/` in the project, committed | the team |
| use my own models in every project | `~/.kairos-cfg/models` | only me |
| answer a question once and keep the answer on this machine | nothing to do: KAIROS asks when it needs the answer and stores it in `.kairos/` | only this machine |
| spend fewer tokens per run | Claude Code's auto-compact window, see [Keeping token use down](#keeping-token-use-down) | whoever sets it, in their own Claude Code settings |
| change what an agent does (its rules, wording, limits) | fork the agent file, see [Changing an agent](#changing-an-agent) | whoever has the fork |

## The two folders

`.kairos/` is where a run works. It holds the feature folders, the ledger, the tracking file and the answers KAIROS asks for once. The first run offers to add it to `.gitignore`, and you should accept: its artifacts can carry security findings and other internal detail.

`.kairos-cfg/` is where you configure. It holds only the settings below, one file each, and it is meant to be committed. KAIROS never writes it, `/kairos:setup` is the only thing that does, and the Gitignore check leaves it alone because the check only looks for `.kairos/`.

There is a `.kairos-cfg/` in the project and one in your home directory (`~` on macOS and Linux, `%USERPROFILE%` on Windows). The home one holds only `models`: where a QA plan is saved and whether a person verifies by hand are facts about one project, so a personal default for them would be wrong in the next repository.

**Never put a secret in either folder.** A project `.kairos-cfg/` ends up in git and a home one is a plain file. No setting needs a credential: API keys and tokens stay in your operating system's keychain or in your tool's own login. KAIROS reads the three files named here and ignores everything else in the folder.

## Settings

| File | Project | Home | What it holds |
|------|---------|------|---------------|
| `models` | yes | yes | one `<agent>: <alias>` line per agent, aliases `opus`, `sonnet`, `haiku`, `fable` |
| `manual-qa` | yes | no | `yes` or `no`: does a person verify features by hand in this project |
| `qa-dir` | yes | no | where QA plans are written in the repository, relative to the project root, never absolute and never containing `..` |

A file with a value KAIROS cannot use (an unknown alias, `maybe` in `manual-qa`, an absolute path) is reported once in one line and ignored, so the next place in the order below applies.

### Which file wins

For each setting the first match wins. For `models` the lookup runs per agent, so one line in the project file changes one agent and leaves the others to the next file.

| Setting | Order |
|---------|-------|
| `models` | `.kairos-cfg/models` in the project, then `.kairos/.models`, then `~/.kairos-cfg/models`, then the agent's own `model:` |
| `manual-qa` | `.kairos-cfg/manual-qa`, then `.kairos/.manual-qa`, then the question |
| `qa-dir` | `.kairos-cfg/qa-dir`, then `.kairos/.qa-dir`, then the question |

The project beats your home folder, so a team that commits `models` overrides your personal preference for the agents it names. Commit `models` only when the team means it, and leave it out when cost is each person's own choice.

The Start Gate prints the model lines in effect with the place each came from (`pm-agent haiku (project)`, `code-reviewer-agent opus (user)`), so you never have to work it out.

### Files from before v9.3.0

KAIROS 9.3.0 moved the settings, and the old places keep working, the same way the v8.4.0 ledger move did: the old path is read and nothing has to be migrated. The orchestrator never moves or rewrites a file of yours. When both exist the new one wins, so a stale `.kairos/.models` can no longer override a project file someone just committed. Answers KAIROS asks for itself (`manual-qa`, `qa-dir`) are still stored in `.kairos/`, which is local to the machine; to share one with the team, copy its value into `.kairos-cfg/` and the question stops being asked.

`/kairos:setup` is the one thing that moves a file. It asks whether the models are for the project or for you, writes the right file, and when it replaces a project choice it removes the old `.kairos/.models` so the old lines cannot come back.

## Which hosts read what

`models` works on Claude Code only, because it depends on the Agent call taking a model parameter. OpenCode and Kimi Code ignore it and the Start Gate says so; their own model settings are on their [setup pages](/setup/). `manual-qa` and `qa-dir` are read by the orchestrator on every host.

## Keeping token use down

This is a Claude Code setting and not a KAIROS one, so it lives in none of the folders above. It is on this page because the orchestrator's session is the longest conversation a run holds, and its cost is easy to misread.

Every turn rereads the whole conversation, so the tokens a session spends are its turns times its context, and 97% of them are cache reads. In 19 real runs of one project the orchestrator's context grew from about 90K to between 300K and 650K inside a single session, and the implementer's longest calls from about 70K to about 280K. Claude Code on a 1M model compacts at about 967K by default, so none of those sessions ever compacted.

Claude Code lets you compact earlier. The documented ways are the `autoCompactWindow` key in `settings.json`, the `--autocompact 250k` launch flag (one launch, Claude Code 2.1.221 or later) and the `CLAUDE_CODE_AUTO_COMPACT_WINDOW` environment variable (a plain token count, 100000 to 1000000). The docs do not say whether the variable is honored in a `settings.json` `env` entry or only in the shell, so prefer the key or the flag.

Replaying those 19 sessions with an earlier window gives the figures below. They are a simulation: after each compaction the context restarts at its early size plus 15K for the summary, one extra pass over the full context pays for the summary, and the number of turns stays the same. It does not model what a summary loses.

| Window | Orchestrator tokens | Implementer tokens | All tokens of the sample |
|--------|---------------------|--------------------|--------------------------|
| 300K | −38% | −19% | −20% |
| 250K | −42% | −31% | −27% |
| 200K | −47% | −39% | −32% |

The last column assumes the implementers compact too: the docs say the percentage override applies to subagents and do not say the same of the window. If only the orchestrator compacts, 250K saves about 13% of the sample.

Two things are not verified, which is why the first run matters. The docs say the system prompt survives a compaction and do not name an agent started with `--agent`, so check that the orchestrator still holds its gates after one. And an implementer that compacts in the middle of a wave can lose a detail it needed. The run's state is on disk, and the orchestrator re-reads `ledger/run.md` after a compaction, but a summary can still drop something. Try one issue at 250K, then read `/kairos:usage --feature <folder>`: the Peak ctx column should stop near the window, the tokens of the run should drop, and the number of fix passes should not rise. If it rises, raise the window.

## Changing an agent

Everything else about how an agent behaves is its Markdown file, and there is no setting for it. KAIROS has no mechanism yet for team rules that every agent would read (a library to prefer, a wording, a different limit). Today the only way is a fork:

- **Plugin install:** a same-named file in the project's `.claude/agents/` outranks the plugin's copy for the bare name, but the plugin's orchestrator calls its agents by scoped name and keeps using the plugin's own. A pipeline-wide change needs all the agent files copied and the scoped calls rewritten, which `/kairos:setup`'s advanced path automates for models. See [Customizing models](/setup/claude-code#customizing-models).
- **Manual copy:** edit the files you copied. If you edit a file in `agents/`, mirror the same body change into `.opencode/agents/` and `.kimi-code/agents/`, which are maintained by hand on purpose.

A fork is yours to maintain: a plugin update does not reach it. If you keep wanting the same change, say so, because a repeated need is what would justify a setting.
