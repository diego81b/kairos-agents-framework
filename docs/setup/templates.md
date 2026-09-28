# Pipeline Templates

Since v9.0.0 you don't pick agents from a menu. The orchestrator works out which agents run from facts about the change, at the point in the run where each fact exists, and you confirm or correct that at a gate. A `## KAIROS Pipeline` section in an issue exists to hold your **corrections**: the effort, the auto-fix budget, and any agent you want forced on or off.

Two formats are read:

1. **The override block** (new): `Effort:`, `Auto-fix:`, `Skip:` and `Add:` lines, all optional. The orchestrator derives the pipeline and applies them on top.
2. **The checklist** (older): one checkbox per agent. A checklist is a selection a person already confirmed, so it still **wins over the derivation**. Issues written before v9.0.0 run exactly as they did.

---

## How the pipeline is derived

`impact-assessment-agent` runs at the start of every run (the orchestrator starts it). It reads the issue and the code it touches, then reports the facts the rules below use: effort, the domains touched, whether the project has a test suite, and whether the change alters a contract. `architect-agent` reports the same kind of facts about its design. Neither one names an agent. The rule table lives in the orchestrator alone.

| Agent | Decided | Runs when |
|---|---|---|
| `pm-agent` | at the start | effort is `medium` or `significant_rework` |
| `architect-agent` | at the start | effort is `significant_rework`, or `medium` and the change touches `db` or `auth`, changes a contract, or spans two or more of backend/frontend/db |
| an implementer | at the start (whether), before the plan (which) | the issue asks for code. A spike or an analysis-only issue writes none |
| `code-reviewer-agent` | at the start | an implementer runs |
| `test-verifier-agent` | at the implementation gate | the implementation wrote or changed a test file |
| `security-reviewer-agent` | at the implementation gate | the change touches `auth` or `integrations`, a `SECURITY`/`PRIVACY`/`COMPLIANCE` constraint exists, or the architecture's threat model produced rows |
| `qa-plan-agent` | at the review gate | the project verifies features by hand (asked once per project) and something is left for a person: no tests were written, an acceptance criterion went to manual verification, or the change touches the frontend. A `VERIFICATION` constraint triggers it in any project |
| `release-planner-agent` | at the review gate | the change ships a migration, a new environment variable or configuration key, a deployment or CI file, or a dependency change |
| `documentation-agent` | at the review gate | the change alters a contract, or the architecture's Behaviour Delta is not `N/A` |

**Which implementer.** The choice is made right before the implementation plan, when the design exists:

- no test suite in the project, or effort `simple_fix` → `implementer-coder-agent`;
- otherwise the architecture's `test_first` fact decides: `yes` → `implementer-tdd-agent`, `no` → `implementer-coder-agent`. Without an architecture, a project with a test suite gets `implementer-tdd-agent`;
- on the TDD path, Team Mode (`implementer-lead-agent`) is offered when two or more of backend/frontend/db are touched, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set and you are in Claude Code. You still confirm its ~3.5× cost.

`implementer-coder-agent` is **code-first**, not code-only: it writes the code, then adds or updates tests where the project has them. When the modules it touches already have tests it must extend them, and it may skip tests only with a written reason in the plan.

Each decision taken during the run is printed at the gate before it, with the rule that fired. Reply there to change it (`add security-reviewer`, `skip release-planner`): the correction holds for the rest of the run and is logged in `_tracking.md`.

::: info When architect is skipped
Skipping `architect-agent` when the rule calls for it is allowed. The orchestrator says what is lost: the Behaviour Delta that test verification and the QA plan read, the threat-model rows that can trigger the security review, and the first full pass over the ledger. The implementer and Team Mode decisions then fall back to `00b-impact.md` and the project files.
:::

---

## Override Block

Copy this block into any issue description, or paste it as your reply at the orchestrator's start gate. Every line is optional:

```markdown
## KAIROS Pipeline

Effort: medium
Auto-fix: 1
Skip: release-planner-agent
Add: security-reviewer-agent
```

**`Effort:`** takes `simple_fix`, `medium`, or `significant_rework` and replaces the effort `impact-assessment-agent` measured. It says how big the change is: the orchestrator passes it to every agent, and it decides whether they run a short, trimmed, or full process, as well as the derivation rules above.

**`Auto-fix:`** takes a number: how many times the agents may fix their own problems before stopping to ask you. It covers the review wave: code review, security review and test verification run together, and the agents may retry while code review reports a serious problem or test verification a gap. Security findings always wait for you. `0` means always ask. Without the line, `simple_fix` and `medium` get 1 and `significant_rework` asks you at the start. The ceiling is 5, or 2 when Team Mode runs, because each Team Mode fix is a whole team run.

**`Skip:`** and **`Add:`** take a comma-separated list of agent names. A skipped agent never runs, whatever its rule says. An added agent runs in its normal place in the pipeline, even when its rule would not fire. Naming an implementer in `Add:` (for example `implementer-coder-agent`) forces that implementer.

Before the first agent runs, the orchestrator shows the pipeline it derived, with these corrections applied, at its start gate. You can still change anything there.

### Saving corrections to the issue

When the run started from an issue and you corrected something at the start gate, the orchestrator offers to save the correction as an override block:

- **Add to the issue**: appends the block to the issue description, or replaces only its existing `## KAIROS Pipeline` section. Nothing else in the description changes.
- **Only for this run**: the issue is not changed.
- **Don't ask again in this project**: stops the question for every later run in this project.

With no correction there is nothing to save and the question is not asked: the next run derives the same pipeline from the same facts. The write works on GitLab (`glab`) and Bitbucket (credentials plus `jq`). On Jira the orchestrator prints the block ready to paste instead, because `jira-cli` returns the rendered description rather than its source, and writing it back would reformat the rest of the issue. The same paste-ready block appears whenever a tool or credential is missing, and the run always continues.

---

## Checklist Templates (older format)

Issues written before v9.0.0 carry a checklist. It still works, and it wins over the derivation: the checked agents run and no other agent does, the orchestrator does not start `impact-assessment-agent`, and it asks once whether to use the checklist or derive the pipeline instead.

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

To move an issue to derivation, pick **Derive instead** when the orchestrator asks, then save the resulting override block to the issue.

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

::: info Prerequisites are not in the list
`context-extractor-agent` still runs only when you start it. `impact-assessment-agent` is started by the orchestrator on every derived run; if you already ran it yourself, the orchestrator reuses its `00b-impact.md`. `bug-triage-agent` is offered when the request reads as a bug report.
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
| 3 | `implementer-lead-agent` | Team Mode: lead + parallel specialists per touched layer (Claude Code only, ~3.5× cost) |
| 4 | `code-reviewer-agent` | Standards, security, performance review |
| 4b | `security-reviewer-agent` | Adversarial security review — IDOR, auth, injection, secrets, data exposure |
| 5 | `test-verifier-agent` | Test coverage and assertion quality |
| 5b | `qa-plan-agent` | Manual and exploratory QA plan, regression retest list, UAT sign-off |
| 6 | `release-planner-agent` | Deployment steps, rollback, monitoring |
| 6b | `documentation-agent` | Feature-facing docs — README, API reference, CHANGELOG |
