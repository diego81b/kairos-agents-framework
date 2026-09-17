# FAQ

**Q: Do I have to learn all 17 agents?**

A: No. You start the Orchestrator and describe what you want; it asks which phases should run and invokes the rest. The agents you may end up calling yourself are the six standalone ones, all optional: Context Extractor, Impact Assessment, and Bug Triage before a run; Retrospective, Improvement Advisor, and Dependency Audit after one or outside any feature. See [All Agents](./agents).

---

**Q: How do I actually start a run?**

A: Launch the Orchestrator as the session's primary agent — in Claude Code, `claude --agent kairos:orchestrator-agent`. Do **not** `@`-mention it inside an already-open chat: that dispatches it as a subagent, which loses `AskUserQuestion`, so every approval gate silently degrades to a text menu. See [Claude Code setup](./setup/claude-code).

---

**Q: What if what I have is a bug, not a feature?**

A: Start with Bug Triage. It reproduces the defect, isolates it, states the root cause at `file:line` with an evidence trail, and recommends whether the fix belongs on the Quick fix path or the full pipeline. You can run it yourself before the pipeline, or hand the report straight to the Orchestrator — it recognises a bug report, offers to run triage first, and gates the result for you.

---

**Q: Does every feature pay for the whole pipeline?**

A: No. The Orchestrator asks one question up front — how big is this change — and the answer drives everything downstream. `simple_fix` runs a code-only implementer plus a review, in Lean Mode. `medium` runs the ordinary pipeline in Trimmed Mode. `significant_rework` runs everything in full and asks you to choose the loop policy yourself. See [Workflow](./workflow).

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
