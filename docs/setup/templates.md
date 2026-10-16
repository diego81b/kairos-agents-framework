# Pipeline Templates

Since v9.0.0 you don't pick agents from a menu. The orchestrator works out which agents run from facts about the change, at the point in the run where each fact exists, and you confirm or correct that at a gate. A `## KAIROS Pipeline` section in an issue exists to hold your **corrections**: the effort, the auto-fix budget, and any agent you want forced on or off.

Two formats are read:

1. **The override block** (new): `Size:`, `Effort:`, `Epic:`, `Areas:`, `Auto-fix:`, `Skip:` and `Add:` lines, all optional. The orchestrator derives the pipeline and applies them on top.
2. **The checklist** (older): one checkbox per agent. A checklist is a selection a person already confirmed, so it still **wins over the derivation**. Issues written before v9.0.0 run exactly as they did. Since v9.6.0 the orchestrator also writes one: when you pick the agents yourself (see [Choosing the pipeline by hand](#choosing-the-pipeline-by-hand)), the result is saved in the issue as a checklist.

**A pipeline that exists always wins.** If the issue holds a `## KAIROS Pipeline` section, or the run is a resumed one, that pipeline runs whatever your prompt says. The words that pick areas (see [Saying what the run is for](#saying-what-the-run-is-for)) are ignored with one line, and the way to change the pipeline is to edit the issue's section.

---

## How the pipeline is derived

`impact-assessment-agent` runs when the rules need its facts, and the orchestrator starts it. That is every derived run that covers `analysis` or `development`. A run limited to `review` and `delivery` does not start it: the code already exists, so the orchestrator reads the effort from an `Effort:` line, else from the issue's `size:` label, else takes `medium`, and says which on the start gate. In that case `documentation-agent` is not derived, and the start gate tells you to add it if the change alters a contract or what a user sees. When the assessment runs, it reads the issue and the code it touches, then reports the facts the rules below use: effort, the domains touched, whether the project has a test suite, and whether the change alters a contract. `architect-agent` reports the same kind of facts about its design. Neither one names an agent. The rule table lives in the orchestrator alone.

| Agent | Area | Decided | Runs when |
|---|---|---|---|
| `pm-agent` | analysis | at the start | effort is `medium` or `significant_rework` |
| `architect-agent` | analysis | at the start | effort is `significant_rework`, or `medium` and the change touches `db` or `auth` or changes a contract. Backend and frontend both changing is not a rule: with no contract change the design is two layers edited |
| an implementer | development | at the start (whether), before the plan (which) | the issue asks for code. A spike or an analysis-only issue writes none |
| `code-reviewer-agent` | review | at the start | an implementer runs |
| `test-verifier-agent` | review | at the implementation gate | the implementation wrote or changed a test file, and effort is not `simple_fix` (with no `pm-agent` there is no acceptance-criteria list to map tests against, and code review already reads the tests) |
| `security-reviewer-agent` | review | at the implementation gate | the change touches `auth` or `integrations`, a `SECURITY`/`PRIVACY`/`COMPLIANCE` constraint exists, or the architecture's threat model produced rows |
| `qa-plan-agent` | delivery | at the review gate | the project verifies features by hand (asked once per project, at this gate, and only when something below fires) and something is left for a person: no tests were written, an acceptance criterion went to manual verification, or the change touches the frontend. A `VERIFICATION` constraint triggers it in any project |
| `release-planner-agent` | delivery | at the review gate | the change ships a migration, a new environment variable or configuration key, a deployment or CI file, or a dependency change |
| `documentation-agent` | delivery | at the review gate | the change alters a contract, or the architecture's Behaviour Delta is not `N/A` |

**Which implementer.** The choice is made right before the implementation plan, when the design exists:

- no test suite in the project, or effort `simple_fix` → `implementer-coder-agent`;
- otherwise the architecture's `test_first` fact decides: `yes` → `implementer-tdd-agent`, `no` → `implementer-coder-agent`. Without an architecture, a project with a test suite gets `implementer-tdd-agent`;
- on the TDD path, Layered Mode (`implementer-lead-agent`) is offered when two or more of backend/frontend/db are touched and you are in Claude Code. No flag is needed, and you still confirm it; what it costs is not measured, so read `_usage.md` after a run.

`implementer-coder-agent` is **code-first**, not code-only: it writes the code, then adds or updates tests where the project has them. When the modules it touches already have tests it must extend them, and it may skip tests only with a written reason in the plan.

An agent runs only when its rule fires **and** its area is selected (see [Areas](#areas)). `impact-assessment-agent` and `bug-triage-agent` belong to no area: they report the facts, so they run whichever areas you chose.

Each decision taken during the run is printed at the gate before it, with the rule that fired. Reply there to change it (`add security-reviewer`, `skip release-planner`): the correction holds for the rest of the run and is logged in `_tracking.md`. At the Start Gate the same choice is a button, **Change the pipeline**, which lists the agents that can be added or skipped with their current state.

::: info When architect is skipped
Skipping `architect-agent` when the rule calls for it is allowed. The orchestrator says what is lost: the Behaviour Delta that test verification and the QA plan read, the threat-model rows that can trigger the security review, and the first full pass over the ledger. The implementer and Layered Mode decisions then fall back to `00b-impact.md` and the project files.

Two of those facts, the threat-model rows and the Behaviour Delta, are then absent by design, not unknown: they count as none, and the security and documentation rules are decided by their other conditions (the domains, the constraints, a contract change). Without that, every `simple_fix`, which never has an architecture, would run the security review and a documentation draft. At the implementation gate the orchestrator also compares the domains with the files the implementation actually wrote, so an `auth` or `integrations` file the impact assessment did not list still starts the security review. A fact that should exist and does not (an impact assessment that failed, an artifact written by an older version) still counts toward running the agent.
:::

---

## Override Block

Copy this block into any issue description, or paste it as your reply at the orchestrator's start gate. Every line is optional:

```markdown
## KAIROS Pipeline

Size: M
Epic: PROJ-10
Auto-fix: 1
Skip: release-planner-agent
Add: security-reviewer-agent
```

**`Size:`** takes `XS`, `S`, `M`, `L` or `XL` and replaces the size `impact-assessment-agent` measured. The effort follows from it (see [Size](#size)), so a `Size:` line sets both.

**`Effort:`** takes `simple_fix`, `medium`, or `significant_rework` and replaces the effort `impact-assessment-agent` measured. It says how big the change is: the orchestrator passes it to every agent, and it decides whether they run a short, trimmed, or full process, as well as the derivation rules above. It does not change the size: the start gate shows the size as measured and the effort you forced, side by side. A bug triage can raise the effort (`full-pipeline` on a change the impact assessment called `simple_fix` makes it `medium`) but never lowers it: when the triage says `quick-fix` and the impact assessment measures `medium` or more, the run keeps the larger effort and the start gate says so. An `Effort: simple_fix` line is how you take the triage's word instead.

**`Epic:`** names the epic this issue belongs to (`PROJ-10`, `&5`). Without the line the orchestrator reads the epic from the tracker when the CLI exposes one (GitLab epics, Jira parent). It decides where the QA plan goes: with an epic, the plan is one cumulative file for the whole epic (see [Phase 5b](/workflow#phase-5b-qa-plan-qa-plan-agent-optional)). Bitbucket Issues has no epics, so there the line is the only source.

**`Areas:`** takes `all`, or any of `analysis`, `development`, `review`, `delivery` (`analisi` and `sviluppo` work too). See [Areas](#areas). With the line present the orchestrator does not ask which areas to run.

**`Auto-fix:`** takes a number: how many times the agents may fix their own problems before stopping to ask you. It covers the review wave: code review, security review and test verification run together, and the agents may retry while code review reports a serious problem or test verification a gap. Security findings always wait for you. `0` means always ask. Without the line, `simple_fix` and `medium` get 1 and `significant_rework` asks you at the start. The ceiling is 5, or 2 when Layered Mode runs, because each Layered Mode fix is a lead scope call, a call per layer in scope and a lead close.

**`Skip:`** and **`Add:`** take a comma-separated list of agent names. A skipped agent never runs, whatever its rule says. An added agent runs in its normal place in the pipeline, even when its rule would not fire. Naming an implementer in `Add:` (for example `implementer-coder-agent`) forces that implementer.

Before the first agent runs, the orchestrator shows the pipeline it derived, with these corrections applied, at its start gate. You can still change anything there.

**A section in the issue means no question.** When the issue already carries a `## KAIROS Pipeline` section (either format), you have already decided: the orchestrator prints the pipeline it is about to run and starts, without asking you to confirm it again. It still asks when something is not a decision you have seen: the issue could not be read, the impact assessment left an unresolved escalation or failed, a fact that gates an agent is unknown, the architect was skipped against its rule, or nothing would run. A checklist is used as written; to derive the pipeline instead, say `derive` in your prompt when you start the run.

### Areas

A run does not always need the whole pipeline. The agents belong to four areas, and you can limit a run to some of them, for example only the analysis of an issue now and the build later:

| Area | Agents |
|---|---|
| `analysis` | `pm-agent`, `architect-agent` |
| `development` | the implementer |
| `review` | `code-reviewer-agent`, `security-reviewer-agent`, `test-verifier-agent` |
| `delivery` | `qa-plan-agent`, `release-planner-agent`, `documentation-agent` |

The orchestrator asks once, at the start, unless an `Areas:` line, a phrase in your prompt (see [Saying what the run is for](#saying-what-the-run-is-for)) or `decide each step` already answers it: **All areas** (the default, one click), **Choose the pipeline myself** or **Decide each step**. Inside the areas the rules above still decide each agent. To limit the run to some areas, type their names in the question's free field or reply at the start gate: `only analysis`, `solo sviluppo`, `add review`, `skip delivery` or `all areas`.

#### Saying what the run is for

Four phrases in the prompt that starts the run answer the area question in advance. They are matched as whole words, in the text you typed to start the run and nowhere else (never the issue text), and the start gate names the phrase that fired and what it set:

| You write | The run covers |
|---|---|
| `analizziamo`, `analizza`, `analyze`, `analyse` | `analysis` |
| `rendi ready`, `rendiamo ready`, `make ready`, `make it ready` | `analysis`, with `pm-agent` and `architect-agent` forced on, because a ready issue has requirements and a design |
| `implementiamo`, `implementa`, `sviluppiamo`, `implement` | all areas (no question asked) |
| `finalizziamo`, `finalizza`, `chiudiamo la issue`, `finalize`, `wrap up` | `review` (add `delivery` at the start gate to extend it) |

A phrase chooses areas and nothing else: the rules still decide the agents inside them, and `finalizziamo` never closes or comments on the tracker issue. A phrase is a per-run intent and is never offered for saving, because an `Areas: analysis` line in the issue would turn the next run, started with `implementiamo`, into a run that analyses only. A first cut, not measured on real runs: the table is the whole list, and a phrase it does not hold matches nothing, so the question is asked as before. To analyse now and build later, use the phrase; to keep the choice, pick the pipeline by hand or add an `Areas:` line.

#### Choosing the pipeline by hand

**Choose the pipeline myself** opens one dialog with a group per area (analysis, development, review, delivery) and lets you tick the agents. The impact assessment is one of the analysis choices, so a run that skips it never pays for it. The pipeline is exactly what you ticked: no rule adds or drops an agent, and the effort is the impact assessment's when you ticked it, else `medium`, which you can change at the start gate. The orchestrator then saves it to the issue as a checklist **without asking**, because a pipeline you picked agent by agent is a decision no rule can rebuild, and a colleague who opens the issue tomorrow must find it there. Every agent appears, ticked or not, with the final effort and auto-fix budget. A `## KAIROS Pipeline` section that someone added in the meantime is never replaced: the block is printed for you to paste, and the issue's own section wins for the next run. This is the one case where the write-back ignores `Don't ask again in this project`. Without an issue reference nothing is written outside `.kairos/`.

On Jira the description is not writable by the plugin, so the block goes in as a comment (the record) and is printed paste-ready for the description. A comment is not read back as a saved pipeline, so on Jira the next run on another machine asks again until the block is in the description. A failed write never stops the run: it prints the block and says why it was not saved.

**Decide each step** is for a run where you want to say yes or no to every agent. It takes all four areas and keeps the rules, but turns each of their announcements into a question: at the start gate, at the implementation gate and at the review gate the orchestrator prints what the rules say about the agents decided there and asks which of them should run, the rules' answer marked as recommended. What you tick against the rules is saved as a `Skip:` or `Add:` override for that run, so the write-back can offer to put it in the issue. The implementer is not asked about: it follows the design, and `Add: implementer-coder-agent` forces another. There is no template line for it, because an issue that carries a `## KAIROS Pipeline` section already holds a decision and starts without asking. Write `decide each step` (or `decidi tu ogni step`) in the prompt that starts the run to answer the area question in advance, or reply it at the start gate; reply `derive` to turn it off. When the issue already carries a `## KAIROS Pipeline` section, an override block or a checklist, the pipeline is decided and the orchestrator never asks about agents: a `decide each step` in the prompt is ignored with one line. Choosing **All areas** (`full`) is final in the same way, with no agent question at any gate. The bug triage (when your input reads as a bug report) and the impact assessment belong to no area and run before the start gate: in this mode the orchestrator lists them in one block before the first one, and the triage gate always stops, so you read the triage before the assessment starts.

Two things to know. `review` or `delivery` without `development` has no implementation record to read, so the orchestrator lists the changed files from `git diff` against the default branch and gives them to the agents. And when a run covered only some areas, running the same issue again offers **Run the remaining areas**, using the earlier artifacts as facts; the cleanup at the end recommends keeping the phase files for that reason.

### Size

`impact-assessment-agent` gives every issue a T-shirt size before any code is written. It measures the footprint of the change from the code the issue touches, not hours: read it as "how much of the codebase moves", never as a time estimate. The same criteria as the effort apply, split finer, and the effort follows from the size through a fixed map:

| Size | Criteria | Effort |
|------|----------|--------|
| `XS` | 1 file, no new endpoint, no schema change, no auth impact | `simple_fix` |
| `S` | 2 files, same limits | `simple_fix` |
| `M` | 3-6 files, at most 1 new or modified endpoint, schema change possible, no auth redesign | `medium` |
| `L` | 7-10 files, 2-3 new or modified endpoints, schema change possible, no auth redesign | `medium` |
| `XL` | more than 10 files, a new subsystem or domain, auth changes or schema migrations | `significant_rework` |

As with the effort, a criterion of a higher level wins over the file count: a new endpoint, a schema change or an auth impact never leaves a change at `XS` or `S`. Only the effort decides how thorough each agent is; the size is a label for people, so nothing branches on it.

The start gate shows the size next to the effort. When you confirm it on a run that started from an issue, the orchestrator sets a `size:<value>` label on that issue, replacing any `size:` label already there, so the tracker can group an epic's issues by size. Where there is no tracker CLI, or the tracker has no labels (Bitbucket Issues), the label is skipped without a message and the run continues. A run that has no impact assessment (a checklist that does not name it, or a run limited to review and delivery) has no measured size and sets no label. It reads an existing `size:` label of the issue only as a fallback for the effort, never ahead of a measurement.

### Saving corrections to the issue

When the run started from an issue and you corrected something at the start gate, the orchestrator offers to save the correction as an override block:

- **Add to the issue**: appends the block to the issue description, or replaces only its existing `## KAIROS Pipeline` section. Nothing else in the description changes.
- **Only for this run**: the issue is not changed.
- **Don't ask again in this project**: stops the question for every later run in this project.

With no correction there is nothing to save and the question is not asked: the next run derives the same pipeline from the same facts. The write works on GitLab (`glab`) and Bitbucket (credentials plus `jq`). On Jira the orchestrator prints the block ready to paste instead, because `jira-cli` returns the rendered description rather than its source, and writing it back would reformat the rest of the issue. The same paste-ready block appears whenever a tool or credential is missing, and the run always continues.

---

## Checklist Templates (older format)

Issues written before v9.0.0 carry a checklist, and so do issues saved by the manual pipeline. It still works, and it wins over the derivation: the checked agents run and no other agent does, the orchestrator starts `impact-assessment-agent` only when the checklist names it, and it asks once whether to use the checklist or derive the pipeline instead.

```markdown
## KAIROS Pipeline

Effort: medium
Auto-fix: 1

### Analysis
- [ ] pm-agent
- [ ] architect-agent

### Build (pick one)
- [ ] implementer-tdd-agent
- [ ] implementer-coder-agent
- [ ] implementer-lead-agent

### Review
- [ ] code-reviewer-agent
- [ ] security-reviewer-agent
- [ ] test-verifier-agent

### After build
- [ ] qa-plan-agent
- [ ] release-planner-agent
- [ ] documentation-agent
```

- A flat checklist with no group headings selects the same agents as the grouped one.
- Checking more than one implementer is an error: the orchestrator says so and derives the pipeline instead.
- A checklist with no `Auto-fix:` line is read as it was before v8.5.0: `Effort:` still sets how thorough each agent is, but nothing is fixed automatically, every problem stops for you, and the implementation plan keeps its own gate even at `simple_fix`.
- The older pair `Auto-fix after review: N` / `Auto-fix after tests: N` still works: the run uses the larger of the two numbers.

A checklist that checks `implementer-coder-agent` now gets the code-first coder: where the touched code already has tests, it extends them. To keep a run free of tests, say so at the start gate.

To move an issue to derivation, say `derive` in your prompt when you start the run (the orchestrator no longer asks), then accept the offer to save the resulting override block to the issue.

---

## Examples

**Hotfix.** Keeps the short path even if the impact assessment measures more:

```markdown
## KAIROS Pipeline

Effort: simple_fix
```

**Anything that touches money or personal data.** Forces the security review whatever the domains say:

```markdown
## KAIROS Pipeline

Add: security-reviewer-agent
```

**Refactor without a release.** Large rework, more automatic fixes, no deployment plan:

```markdown
## KAIROS Pipeline

Effort: significant_rework
Auto-fix: 2
Skip: release-planner-agent
```

**Documentation only.** An analysis-only issue writes no code; this adds the documentation phase after requirements:

```markdown
## KAIROS Pipeline

Effort: simple_fix
Add: pm-agent, documentation-agent
```

### Short path with stronger tests

A `simple_fix` runs code-first with no requirements, no architecture and no plan gate, and skips `test-verifier-agent`. For a bug fix in a project that wants a regression test written first and reviewed, keep the short path and add the two agents:

```markdown
## KAIROS Pipeline

Effort: simple_fix
Add: implementer-tdd-agent, test-verifier-agent
```

An implementer named in `Add:` beats the `simple_fix` rule, so `implementer-tdd-agent` runs test-first in its combined step (plan and code in one run, Lean Mode). `test-verifier-agent` runs at the implementation gate as usual, without an acceptance-criteria list to map tests against, because no `pm-agent` ran. Without these two lines `implementer-coder-agent` already requires a regression test that fails without the fix and checks that by reverting the fix, so add them only when the order (test first) or the test review matters to you. The lines belong to one issue or one run: there is no project-wide setting.

::: info Prerequisites are not in the list
`context-extractor-agent` still runs only when you start it. `impact-assessment-agent` is started by the orchestrator on every derived run that covers analysis or development, and on a manual pipeline only when you tick it; if you already ran it yourself, the orchestrator reuses its `00b-impact.md`. `bug-triage-agent` is offered when the request reads as a bug report.
:::

---

## Tracker Setup

### GitLab

Save the template as a reusable issue template:

```
.gitlab/issue_templates/kairos.md
```

Paste an override block (or leave the section out: no section means a fully derived pipeline). GitLab exposes it in the issue creation form under **Templates**.

### Jira

In your Jira project settings, paste an override block into **Description → Default text** for the relevant issue type (Story, Bug, etc.). Alternatively, create a saved filter template and add the block manually.

### Bitbucket

Bitbucket does not support issue description templates natively. Paste the block into the **Description** field when creating the issue.

### In-chat (no issue)

Paste the block as your reply at the orchestrator's start gate. It is applied as a correction to the derived pipeline.

---

## Agent Role Reference

| # | Agent | Role |
|---|-------|------|
| pre | `context-extractor-agent` | Full-repo scan → stack, patterns, conventions (standalone, optional) |
| pre | `impact-assessment-agent` | Issue-scoped grounding → effort, domains, test suite, contract change: the facts the pipeline is derived from (started by the orchestrator) |
| 1 | `pm-agent` | Requirements analysis, acceptance criteria, risks |
| 2 | `architect-agent` | System design, API contracts, DB schema, and the facts that choose the implementer |
| 3 | `implementer-tdd-agent` | Test-first code generation (plan gate + code gate) |
| 3 | `implementer-coder-agent` | Code-first generation: code, then the tests the project and the touched modules call for |
| 3 | `implementer-lead-agent` | Layered Mode: lead plus a layer agent per touched layer, run in stages by the orchestrator (Claude Code only, cost not measured) |
| 4 | `code-reviewer-agent` | Standards, security, performance review |
| 4b | `security-reviewer-agent` | Adversarial security review — IDOR, auth, injection, secrets, data exposure |
| 5 | `test-verifier-agent` | Test coverage and assertion quality |
| 5b | `qa-plan-agent` | Manual and exploratory QA plan, regression retest list, UAT sign-off |
| 6 | `release-planner-agent` | Deployment steps, rollback, monitoring |
| 6b | `documentation-agent` | Feature-facing docs — README, API reference, CHANGELOG |
