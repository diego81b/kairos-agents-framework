# FAQ

**Q: Do I have to learn all 17 agents?**

A: No. You start the Orchestrator and describe what you want; it works out which phases should run from facts about the change, shows you that pipeline at its Start Gate for you to confirm or correct, and invokes the rest. The agents you may end up calling yourself are the standalone ones, all optional: Context Extractor and Bug Triage before a run (Impact Assessment too, though the Orchestrator runs it for you anyway); Retrospective, Improvement Advisor, and Dependency Audit after one or outside any feature. See [All Agents](./agents).

---

**Q: How do I actually start a run?**

A: Launch the Orchestrator as the session's primary agent — in Claude Code, `claude --agent kairos:orchestrator-agent`. Do **not** `@`-mention it inside an already-open chat: that dispatches it as a subagent, which loses `AskUserQuestion`, so every approval gate silently degrades to a text menu. See [Claude Code setup](./setup/claude-code).

---

**Q: What if what I have is a bug, not a feature?**

A: Start with Bug Triage. It reproduces the defect, isolates it, states the root cause at `file:line` with an evidence trail, and recommends whether the fix belongs on the short `simple_fix` path or the full pipeline. You can run it yourself before the pipeline, or hand the report straight to the Orchestrator — it recognises a bug report, offers to run triage first, and gates the result for you.

---

**Q: Does every feature pay for the whole pipeline?**

A: No. The Impact Assessment measures how big the change is, and the Orchestrator derives the pipeline from that and the other facts it reports; you confirm or correct the effort at the Start Gate. `simple_fix` runs the code-first implementer (which still extends the tests of the code it touches) plus a review, in Lean Mode. `medium` runs the ordinary pipeline in Trimmed Mode. `significant_rework` runs everything in full and asks you to choose the loop policy yourself. See [Workflow](./workflow).

---

**Q: Which tool do I need?**

A: Claude Code gets the full experience, including the plugin, the slash commands, and Team Mode. Cursor, VS Code/Copilot, JetBrains, Codex CLI, OpenCode and Kimi Code all work, with pre-converted agent packs for the last two. Gates fall back to a printed menu wherever `AskUserQuestion` is unavailable. See [Setup](./setup/).

---

**Q: Can I customize agents?**

A: Yes. The agent files are Markdown — edit them to match your team's patterns, libraries, or standards. If you edit a file in `agents/`, mirror the same body change into `.opencode/agents/` and `.kimi-code/agents/`, which are maintained by hand on purpose.

---

**Q: Where does the output go?**

A: Into `.kairos/<feature-folder>/` in your project — one Markdown file per phase, plus a `ledger/` with the living constraints, decisions, and open questions. Three files sit at the project root instead, because they outlive any single feature: `_lessons.md`, `_tech-debt.md`, and `decisions/ADR-*.md`. Nothing is written outside `.kairos/` except code from the implementer, documentation from the Documentation Agent, and a single `.kairos/` line the Orchestrator appends to your `.gitignore` once, after you say yes.

---

**Q: Does it work with existing code?**

A: Yes. Context Extractor scans the repository for stack, patterns, and conventions before the pipeline starts, and Impact Assessment scopes that to the issue at hand — effort, domains, which agents are worth running.

---

**Q: Does KAIROS deploy anything?**

A: No, by design. Release Planner produces a deployment *plan* — runbook, rollback strategy, monitoring thresholds — and stops there. Deployment execution, post-deploy verification, observability-as-code, incident response, and load testing are deliberately out of scope: they need credentials, live environments, and a presence a terminal session does not have.

---

**Q: Is the output production-ready?**

A: Treat it as a strong draft that still needs your review. The point of the gates is that you see every artifact before the next phase builds on it: Code Reviewer and Test Verifier catch a lot, Security Reviewer adds an adversarial pass, and QA Plan covers what automated tests structurally cannot. None of them replace the human at the gate.

---

**Q: What does Team Mode cost?**

A: Roughly 3.5× a normal run, and it needs Claude Code with the experimental Agent Teams flag. The Orchestrator shows the cost warning and requires explicit confirmation before it activates. For most features the single implementer is the right call.

---

**Q: Can teams collaborate?**

A: Yes. The agents, the skills, and the `.kairos/` artifacts all live in the repository, so they travel with the branch and review like any other file. Each phase can also post its artifact as a comment on the issue in Jira, GitLab, or Bitbucket.

---

**Q: How do I know which model each agent really used, and what it cost in tokens?**

A: Open `_usage.md` in the feature folder. In Claude Code the Orchestrator has it rewritten after every agent that returns, with one row per agent call: the model that answered and the input, output, cache-write and cache-read tokens. `/kairos:usage` prints the same report on demand. It reads the subagent transcripts Claude Code writes, so the model and the token counts are measured, not reported by an agent about itself. On a sample of 437 real KAIROS subagent runs every agent had used the model tier its `model:` line names. See [Usage](/workflow#usage-model-and-tokens-per-agent).

---

**Q: Can I run only part of the pipeline, for example only the analysis?**

A: Yes. At the start the Orchestrator asks once which areas to run (analysis, development, review, delivery; the default is all), or reads an `Areas:` line from the issue. Inside the areas you chose it still derives each agent from the facts. Run the same issue again later and it offers the remaining areas. See [Areas](/setup/templates#areas).

---

**Q: The pipeline feels slow compared with plain Claude. What can I change without losing the checks?**

A: Keep the review wave: it is where the checks live, and in real runs it is where you changed a decision (a `low` row promoted to **Mitigate now**). What you can drop is the round trip at gates where nothing was left to decide. The Orchestrator now continues on its own after the bug triage when the bug reproduced and is a defect (the Start Gate follows it anyway) and, in `simple_fix` and `medium` runs, after the requirements (no open question, no scope change, nothing it had to ask you) and after the finished implementation (the review wave is the next check). It says so in one line, with the rows it accepted for you (`low`, and `medium` in a `simple_fix`). It stops the moment any signal fires, and `significant_rework` keeps every gate. Reply `every gate` to be asked at every gate again. The architecture, the implementation plan, the review gate, the documentation draft and the QA plan always ask: the plan is the last gate before source files change, the review gate is where you change decisions, and the last two write outside `.kairos/` or post to the tracker. This saves the minutes you spend answering, not the time the agents take or a day nobody answers a gate. For a bug fix, `Effort: simple_fix` plus `Add: implementer-tdd-agent, test-verifier-agent` in the issue gives the short pipeline (no requirements, no architecture, no plan gate) with test-first code and a test review. See [Pipeline Templates](/setup/templates#short-path-with-stronger-tests).

---

**Q: Do the reviewers overwrite each other's ledger entries when they run in parallel?**

A: No. Inside the review wave none of them writes the ledger: each returns its updates as a block in its own report, and the Orchestrator applies the blocks one after another. QA plan, release planner and documentation are not parallelized, because they depend on each other's output.

---

**Q: I build a big issue one slice at a time. Do I get a folder per slice?**

A: No. An issue has one folder and one ledger. When the folder already holds a finished run, the Orchestrator offers **Start a new run**: it moves the finished run's reports to `runs/run-<k>/`, keeps the ledger (so decisions and constraints carry over), the triage and the tracking log, and starts the next slice fresh. Criteria that belong to a slice not built yet show as `later` in the tracking file and in the test verification, never as gaps. See [Tracking File](/workflow#tracking-file).
