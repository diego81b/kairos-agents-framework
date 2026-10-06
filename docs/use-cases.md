# Use Cases

Five shapes of work, and what KAIROS does with each: which agents it derives, which gates ask you something, which continue on their own, and what the checks are for. Read it after [What is KAIROS?](/overview) and before the [Workflow walkthrough](/workflow) if you want the pipeline as a story rather than a table.

The first three are shaped after real runs of a downstream web and mobile project, described without names and without figures (see [Quality](/metrics) for why this site publishes no numbers). Some of those runs predate v9, when you picked the agents from a menu. What each case shows under **What gets derived** is what the current rules produce for that shape, not a transcript, and every claim about a finding comes from a real run.

---

## 1. A contained bug

**Situation.** A backup script's prune step removes nothing when one of its folders is empty. The report says what was expected and what happened, with the command that shows it.

**What gets derived.** The report reads as a bug, so the Orchestrator offers the bug triage. You accept. The triage reproduces the defect, finds the cause at a `file:line`, and recommends `quick-fix`. The bug reproduced and is a defect, so that gate continues on its own and says so in one line. The impact assessment then reads the code the fix would touch and sizes it `S`, which means effort `simple_fix`.

The Start Gate is the next question. It shows the pipeline the rules derived: no requirements, no architecture, the code-first implementer in one combined step with no plan gate, and the code reviewer. The test review and the security review are decided later, at the implementation gate, and the gate says so.

**What you see.** After the Start Gate the implementer writes the fix and a regression test that fails without it (the implementer checks that by reverting the fix). If the tests pass, the files match the plan and nothing needs you, the implementation gate continues on its own and the review wave starts. The review gate is the next question.

**What the checks are for.** In the real run that shaped this case, the review wave included a security reviewer chosen by hand, and it found a medium problem in the fix itself: a pattern that could have deleted the wrong file. No test had failed. The decision was **Mitigate now**, one fix pass followed, and a recheck confirmed it. A derived `simple_fix` does not run the security reviewer unless a rule fires or you ask for it. The code reviewer still reads every changed file. If a script that deletes things is worth an adversarial read in your project, say so once:

```markdown
## KAIROS Pipeline

Add: security-reviewer-agent
```

---

## 2. A bug that hides a product decision

**Situation.** A flow that revokes a device leaves a secret in the wrong storage. The code involved is an authentication surface. Fixing the leak means choosing what the product does next: seal the secret again, or treat the device as not enrolled.

**What gets derived.** The triage reproduces it and says `quick-fix`. The impact assessment, which read the code that would change, measures more: several layers and a test suite to extend. The rule is that a triage can raise the effort and never lower it, so the larger measurement stands, and the Start Gate prints the conflict and the effort it kept. Replying `Effort: simple_fix` takes the triage's word instead.

At `medium`, the `auth` domain makes the architect's rule fire, and it makes the security reviewer's rule fire at the implementation gate too.

**What you see.**

- **Architecture gate: asks.** The architect reports that the design is not ready to hand to an implementer, because two answers are possible and the issue does not say which. You answer through **Request changes**, the architect runs again with your answer as the constraint, and the second pass is approved.
- **Plan gate: asks.** The plan is the last gate before source files change. It lists the files, the waves and the test decision.
- **Waves.** The first wave of a two-wave plan continues on its own: nothing to decide, tests green, no file outside the plan.
- **Review gate: asks.** All three reviewers came back ready or secure. The rows they left as `low` are what the Risk Disposition Loop accepts by default, and in this run you promoted three of them to **Mitigate now**: an error the user never saw, and a screen that kept showing the old state after a delete. A fix pass handled them. The recheck stopped on a `medium` row, which you accepted, and you promoted a `low` one: a second, test-only pass tightened the assertions of a test.

**What it shows.** The gates that keep asking are the ones where decisions change: the architecture, the plan, the review. No signal can predict a `low` row you will care about, which is why the review gate is never skipped. See [Gates that continue on their own](/workflow#gates-that-continue-on-their-own).

---

## 3. A feature of medium size

**Situation.** A settings screen has to disable a feature when a related row is removed on the server. The issue is short, and the first impact assessment sizes it `S`.

**What gets derived.** You read the Start Gate, find the scope too narrow (the issue also covers stale keys), and reply with that feedback. The impact assessment runs again and measures `M`. The rules then derive:

| Agent | Result | Rule that fired |
|---|---|---|
| `pm-agent` | runs | effort is `medium` |
| `architect-agent` | skipped | `medium`, no `db` or `auth`, no contract change |
| implementer | `implementer-tdd-agent` | the project has a suite and there is no architecture to say otherwise |
| `code-reviewer-agent` | runs | an implementer runs |
| `test-verifier-agent`, `security-reviewer-agent` | decided at the implementation gate | test files written, and a `SECURITY` constraint the requirements declared |
| `qa-plan-agent` | decided at the review gate | the project verifies features by hand and the change touches the frontend |

**What you see.** The requirements gate continues on its own if the analysis left no open question, no scope change and no blocking constraint. Otherwise it asks. The plan gate asks. If the implementation gate continues on its own, its line carries a `Decided here` block with the two reviewers it just added and the rule behind each. There is no question to correct them at, so interrupt the session if you want to change one, or reply `every gate` at the Start Gate to be asked there. The review wave runs, the review gate asks, a fix pass follows, and the QA plan gate ends the run with a plan written for a person who tests by hand.

**What it shows.** The pipeline was not chosen from a menu. Each agent ran because a rule fired on a fact, and the gate that decided it said which. `Add:` and `Skip:` lines, or a reply at any gate, change one decision without touching the others.

---

## 4. Analysis now, build later

**Situation.** You want an issue sized and designed before anyone commits to building it, or the issue is a spike that should produce a decision and no code.

**What gets derived.** Say so at the start: `Areas: analysis` in the issue, or **Choose areas** at the first question. The run covers the analysis agents whose rules fire (`pm-agent`, `architect-agent`), plus the impact assessment, which reports the facts every run needs, and it ends at the last analysis gate with `01-requirements.md` and, when the architect ran, `02-architecture.md`. An issue the impact assessment reads as analysis-only (`change_kind: analysis`) derives no implementer and then no reviewer, unless you add one.

**Later.** Start the Orchestrator on the same issue. The folder holds a finished run that did not cover every area, so it offers **Run the remaining areas**: development, review and delivery, with the earlier artifacts read as facts instead of redone. If the issue is large and was built slice by slice, **Start a new run** keeps one ledger across runs instead of splitting it.

---

## 5. A short path with stronger tests

**Situation.** A bug fix in a project that wants the regression test written first and reviewed, without paying for requirements, architecture and a plan gate.

**What gets derived.** The recipe is two lines in the issue (or pasted at the Start Gate):

```markdown
## KAIROS Pipeline

Effort: simple_fix
Add: implementer-tdd-agent, test-verifier-agent
```

`Effort: simple_fix` keeps the short path. An implementer named in `Add:` beats the `simple_fix` rule, so `implementer-tdd-agent` runs test-first in its combined step. `test-verifier-agent` runs at the implementation gate, which a bare `simple_fix` skips. There is no acceptance-criteria list to map tests against, because no `pm-agent` ran. Without these two lines the code-first implementer already requires a regression test that fails without the fix, so add them only when the order or the test review matters to you. The details are in [Pipeline Templates](/setup/templates#short-path-with-stronger-tests).

---

## Reading a run afterwards

Every run keeps one file for you, `.kairos/<feature_folder>/_tracking.md`. Its `## Log` has one line per event: each gate and your answer, each wave and gate that continued on its own with the rows it accepted for you, each fix pass and each resume. Read it after a run to see what the Orchestrator decided in your place and on what evidence. In Claude Code, `/kairos:usage` shows which model each agent really used and how many tokens it spent.

If a run felt slow, [the FAQ](/faq) says what to change without giving up the review wave.
