# Configuring KAIROS

You can change three things without editing an agent: which models the agents use, how often KAIROS asks you a question, and what it knows about your project (where QA plans go, how to run related tests). All three live in one small text file, `.kairos-cfg/config`. This page lists every setting, which place holds it and which one wins. Anything not on this page is not a setting: it is the text of an agent file.

## Start here

Most people need one of these.

| I want | Do this |
|--------|---------|
| lower token cost | run `/kairos:setup` and choose **Economy** |
| fewer questions during a run | nothing: `autonomy` is `balanced` by default. To see what it would do first, set `autonomy: shadow`. See [Fewer questions](#fewer-questions-the-autonomy-dial) |
| every question, as before v10 | `autonomy: ask` in the project config, or say `ask all` in the launch prompt |
| KAIROS to stop asking where QA plans go | add `qa-dir: docs/qa-plans/` to the project config |
| faster test runs | add `test-changed: npm test -- --findRelatedTests {files}` (your runner's command) |

A complete project file, every line optional:

```
# .kairos-cfg/config
model.architect-agent: opus
model.pm-agent: haiku
autonomy: balanced
manual-qa: yes
qa-dir: docs/qa-plans/
test-changed: npm test -- --findRelatedTests {files}
```

## Which one do I use?

KAIROS has five places where you can change how it behaves, from the narrowest to the widest.

| I want to | Use | Who sees it |
|-----------|-----|-------------|
| change the pipeline for one issue (size, effort, areas, agents to add or skip, auto-fix) | the `## KAIROS Pipeline` block in the issue, see [Pipeline Templates](/setup/templates) | everyone who opens the issue |
| change how much KAIROS asks for one run | a phrase in the launch prompt (`ask all`, `trust`), see [Fewer questions](#fewer-questions-the-autonomy-dial) | this run |
| set the models, the dial, the QA plan folder, the manual QA answer or the related-tests command for the whole team | `.kairos-cfg/config` in the project, committed | the team |
| use my own models in every project | `model.` lines in `~/.kairos-cfg/config` | only me |
| answer a question once and keep the answer on this machine | nothing to do: KAIROS asks when it needs the answer and stores it in `.kairos/` | only this machine |
| spend fewer tokens per run | Claude Code's auto-compact window, see [Keeping token use down](#keeping-token-use-down) | whoever sets it, in their own Claude Code settings |
| change what an agent does (its rules, wording, limits) | fork the agent file, see [Changing an agent](#changing-an-agent) | whoever has the fork |

## The two folders

`.kairos/` is where a run works. It holds the feature folders, the ledger, the tracking file and the answers KAIROS asks for once. The first run offers to add it to `.gitignore`, and you should accept: its artifacts can carry security findings and other internal detail.

`.kairos-cfg/` is where you configure. It holds one file, `config`, with one `key: value` line per setting, and it is meant to be committed. KAIROS never writes it, `/kairos:setup` is the only thing that does, and the Gitignore check leaves it alone because the check only looks for `.kairos/`.

There is a `.kairos-cfg/` in the project and one in your home directory (`~` on macOS and Linux, `%USERPROFILE%` on Windows). The home one holds only the `model.` lines: where a QA plan is saved, whether a person verifies by hand and how much a run asks are facts about one project, so a personal default for them would be wrong in the next repository.

**Never put a secret in either folder.** A project `.kairos-cfg/` ends up in git and a home one is a plain file. No setting needs a credential: API keys and tokens stay in your operating system's keychain or in your tool's own login. KAIROS reads only `config` and ignores everything else in the folder and any key it does not know.

## Settings

`.kairos-cfg/config` is a plain text file: one `key: value` per line, blank lines and lines starting with `#` ignored.

| Key | Project | Home | What it holds |
|-----|---------|------|---------------|
| `model.<agent>` | yes | yes | the model for one agent, aliases `opus`, `sonnet`, `haiku`, `fable` |
| `autonomy` | yes | no | `ask`, `shadow`, `balanced` or `trust`: how many questions a run asks. Default `balanced` |
| `manual-qa` | yes | no | `yes` or `no`: does a person verify features by hand in this project |
| `qa-dir` | yes | no | where QA plans are written in the repository, relative to the project root, never absolute and never containing `..` |
| `test-changed` | yes | no | the project's own command for running only the tests related to some files, with `{files}` standing for the changed files (`npm test -- --findRelatedTests {files}`); or `off`, which makes every check run the whole suite. See [Test scope](/workflow#test-scope) |

A new setting is one more line in this file and one more row in this table, never a new file.

A line with a value KAIROS cannot use (an unknown alias, `maybe` in `manual-qa`, an absolute path) is reported once in one line and ignored, so the next place in the order below applies. An unknown `autonomy` value reads as `balanced` and the Start Gate names it.

### Which place wins

For each key the first match wins. For `model.<agent>` the lookup runs per agent, so one line in the project file changes one agent and leaves the others to the next place.

| Key | Order |
|-----|-------|
| `model.<agent>` | `.kairos-cfg/config` in the project, then `~/.kairos-cfg/config`, then the agent's own `model:` |
| `autonomy` | a phrase in the launch prompt, then `.kairos-cfg/config` in the project (never the home folder), then `balanced` |
| `manual-qa` | `.kairos-cfg/config`, then `.kairos/.manual-qa`, then the question |
| `qa-dir` | `.kairos-cfg/config`, then `.kairos/.qa-dir`, then the question |
| `test-changed` | `.kairos-cfg/config`, then the runner's own related-tests option (Jest, Vitest, pytest, Go), then the test files the change touches. It is never asked |

The project beats your home folder, so a team that commits `model.` lines overrides your personal preference for the agents they name. Commit them only when the team means it, and leave them out when cost is each person's own choice.

The Start Gate prints what is in effect with the place each came from: the model lines (`pm-agent haiku (project)`, `code-reviewer-agent opus (user)`) and the dial (`Autonomy: balanced (default)`), so you never have to work it out.

### Setting things up with `/kairos:setup`

`/kairos:setup` is the one thing that writes the folder. Today it covers the models: it asks whether they are for the project or for you, offers **Default**, **Economy**, **Custom** and **Advanced**, replaces only the `model.` lines of the right `config` (every other line stays) and prints what it wrote. The other keys are plain lines you add by hand; the file is meant to be edited.

### Files from older versions

Until 9.10 the model lines could also live in per-setting files (`.kairos-cfg/models`, `.kairos/.models`, `~/.kairos-cfg/models`, `.kairos-cfg/manual-qa`, `.kairos-cfg/qa-dir`). Version 10 no longer reads them: move the lines into `config`. Answers KAIROS asks for itself (`manual-qa`, `qa-dir`) are still stored in `.kairos/`, which is local to the machine; to share one with the team, add it to `.kairos-cfg/config` and the question stops being asked.

## Fewer questions: the autonomy dial

A run asks you at gates and about risk rows. In real runs most of those answers were the option KAIROS had already marked `(Recommended)`. `autonomy` lets KAIROS take that option for you when the stakes are low, and tell you it did.

It never invents a decision. It only executes the recommended option the agent would have shown you, and only while it stays under a limit that grows with the size and the surprises of the issue.

| Value | What a run does |
|-------|-----------------|
| `ask` | every question, as before v10 |
| `shadow` | asks exactly as `ask`, and writes in the log what `balanced` would have decided for you. Use it for a week to see what you would save before you turn it on |
| `balanced` | the default. Decides low-risk rows and continues a few gates on its own, always traced |
| `trust` | as `balanced`, with a higher limit, and a clean review gate may also continue |

**What it never decides for you**, whatever the value: security findings of medium impact or more, rows where an agent doubts the premise, anything that changes scope or a product decision, a contract mismatch between layers, anything written outside `.kairos/` or posted to the tracker (documentation, QA delivery, the size label), irreversible steps (the cleanup, a risky migration or rollback), failures, and every `critical` row. Rows that touch auth or the database stay with you at the architecture and plan gates. The Start Gate and the implementation plan for medium and larger work always ask.

**How it decides how much to ask.** KAIROS gives the issue a score from facts it already measured (size, domains touched, contract change, unknowns, risk rows) and adds to it each time the run surprises it: a finished review that adds a medium risk, a changed acceptance criterion, a file outside the plan, an answer you gave against the recommendation. Decisions it takes without you add to a second counter, and your next real answer resets that one. While the two stay under the limit it decides, past it it asks. So a small fix flows through, and a large issue asks almost everything, which is the point. The limits are first estimates: in the first real runs, small fixes had most of their rows decided and a large issue with a contract change asked nearly every question.

**You can always see and undo it.**
- The tracking file shows an `Autonomy` line (value, score, room left, drift) and an `Auto-decisions` section with each row, the option taken and the rule.
- The next gate that asks prints what was decided for you since the last one.
- `revert R3` (or `annulla R3`) at any gate reopens that row and asks it normally. A second revert, or a second answer against a recommendation, puts the rest of the run back to `ask`.
- If a run drifts from what you approved (a file outside the plan, a dropped criterion, a contract change nobody announced), KAIROS stops deciding and asks what to do with the extra work first.

**Changing it for one run.** Say it in the launch prompt or at any gate: `ask all` (or `chiedi tutto`) for every question, `trust` (or `fidati`) for the higher limit. The Start Gate's **Change the pipeline** accepts the same words and `balanced` and `shadow`. Nothing you say changes the saved file.

## Troubleshooting

| What you see | Why, and what to do |
|--------------|---------------------|
| A `model.` line has no effect | The lines work on Claude Code only; the Start Gate says so on other hosts. Check the alias (`opus`, `sonnet`, `haiku`, `fable`): a bad one is reported once and ignored. The project file beats your home file for the agents it names |
| `autonomy: balanced`, and it still asks everything | The issue is large or surprised the run, so the limit was reached. Read the `Autonomy` line in `_tracking.md`: `room` is what is left. Rows on the never-decided list stay with you at any value |
| KAIROS decided a row you wanted to see | Say `revert R3` at the next gate. If you want none of it, set `autonomy: ask` |
| The same question comes back every issue (`manual-qa`, `qa-dir`) | The answer is stored in `.kairos/` on this machine only. Add it to the project `config` and it stops being asked, for the whole team |
| `autonomy` in my home file does nothing | Home files read only the `model.` lines. Put `autonomy` in the project file |
| A settings file from before v10 stopped working | Version 10 reads only `config`. Move the lines into it |

## Which hosts read what

The `model.` lines work on Claude Code only, because it depends on the Agent call taking a model parameter. OpenCode and Kimi Code ignore it and the Start Gate says so; their own model settings are on their [setup pages](/setup/). `autonomy`, `manual-qa` and `qa-dir` are read by the orchestrator on every host, and `autonomy` needs the `skills/` folder next to the agents, like the other orchestrator skills. `test-changed` is read by the agents that run tests (both implementers, Test Verifier and the Layered Mode lead), not by the orchestrator, and also on every host.

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
