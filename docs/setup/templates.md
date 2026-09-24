# Pipeline Templates

KAIROS supports **explicit agent selection** so you decide which phases run — the orchestrator never infers a default pipeline.

There are two ways to declare the pipeline:

1. **In the issue body** — add a `## KAIROS Pipeline` section to the Jira/GitLab/Bitbucket issue. The orchestrator reads it automatically before asking for confirmation.
2. **In-chat** — paste the template block when the orchestrator displays the interactive list (Case B — no issue reference or section missing).

---

## Template Block

Copy this block into any issue description or paste it directly in the chat:

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

Check (`[x]`) only the agents you want to activate. The group headings are there to make the list readable, not to be parsed: the orchestrator only looks at which names are checked.

**Build — pick one.** `implementer-tdd-agent` writes tests first and is the default. `implementer-coder-agent` writes code without tests, for projects with no test suite. `implementer-lead-agent` is Team Mode: a lead plus four parallel specialists, Claude Code only, about 3.5× the cost. Checking more than one is an error: the orchestrator says so and asks you to choose.

**Optional agents.** Three agents are worth adding only when their trigger applies:

| Agent | Add it when |
|---|---|
| `security-reviewer-agent` | The change touches auth, payments, or any endpoint that writes data |
| `qa-plan-agent` | A person will verify the feature by hand. It plans the manual cases, the retests and the sign-off, and posts them to the issue |
| `documentation-agent` | An API contract or a user-visible behaviour changed |

**`Effort:`** is optional and takes `simple_fix`, `medium`, or `significant_rework`. It says how big the change is: the orchestrator passes it to every agent, and that value decides whether they run a short, trimmed, or full process. Leave it out and the run uses `medium`, so a small fix driven entirely from a template is worth marking `simple_fix`.

**`Auto-fix:`** takes a number: how many times the agents may fix their own problems before stopping to ask you. It covers two moments, after code review finds a serious problem and after test verification finds a gap. `0` means always ask.

The line also switches on the defaults that come with the effort. With an `Auto-fix:` line, `simple_fix` gets its short path: a wider automatic acceptance of low and medium risks, and no separate gate on the implementation plan. Without one, the block is read as an older template (see below): nothing is fixed automatically, every problem stops for you, and with `significant_rework` you are asked at the start of the run.

To set the two moments apart, write two lines instead of one; a moment with no line of its own falls back to the effort default (1 after review and 0 after tests for `simple_fix` and `medium`, asked at the start for `significant_rework`):

```markdown
Auto-fix after review: 1
Auto-fix after tests: 2
```

The ceiling is 5, or 2 with `implementer-lead-agent`, because each Team Mode fix is a whole team run. A higher number is lowered to the ceiling and the orchestrator tells you. With no build agent checked there is nothing to fix and the line is ignored. Auto-fix after tests needs `test-verifier-agent` checked; without it, that number has no effect.

Before the first agent runs, the orchestrator repeats the effort and auto-fix values it will use, so a wrong value can still be corrected there.

::: info Prerequisites are not in the list
`context-extractor-agent`, `impact-assessment-agent` and `bug-triage-agent` run before the pipeline, and you start them. The orchestrator never starts the first two, and offers the third only when the request reads as a bug report. Run them first when you want them; the orchestrator picks up their output automatically.
:::

### Older templates keep working

Issues written with the earlier format need no edit, and run the way they ran when they were written:

- A flat checklist with no group headings selects the same agents as the grouped one. Every agent name from the earlier format is unchanged.
- A block with no `Auto-fix:` line is an older template. `Effort:` still sets how thorough each agent is, and a missing `Effort:` still means `medium`, but nothing else changes: every problem stops for you, and the implementation plan keeps its own gate even at `simple_fix`.
- To give an existing issue the new behaviour, add an `Auto-fix:` line to it. That line is the only switch.

---

## Preset: Feature Development

Full pipeline — new functionality going to production.

```markdown
## KAIROS Pipeline

Effort: medium
Auto-fix: 1

### Analysis
- [x] pm-agent
- [x] architect-agent

### Build (pick one)
- [x] implementer-tdd-agent
- [ ] implementer-coder-agent
- [ ] implementer-lead-agent

### Review
- [x] code-reviewer-agent
- [x] security-reviewer-agent
- [x] test-verifier-agent

### After build
- [ ] qa-plan-agent
- [x] release-planner-agent
- [ ] documentation-agent
```

---

## Preset: Bug Fix

Skip design and deployment planning; focus on fix + verification.

Triage the defect before you pick this block. `bug-triage-agent` reproduces it, finds the root cause with evidence, and says whether the fix is contained or structural — which is what decides whether this preset or the Feature Development one is the right shape. Run it yourself, or hand the report to the Orchestrator and accept the offer it makes at its Bug-Input Check. A checklist checked before anyone has reproduced the bug is a guess.

```markdown
## KAIROS Pipeline

Effort: medium
Auto-fix: 1

### Analysis
- [x] pm-agent
- [ ] architect-agent

### Build (pick one)
- [x] implementer-tdd-agent
- [ ] implementer-coder-agent
- [ ] implementer-lead-agent

### Review
- [x] code-reviewer-agent
- [ ] security-reviewer-agent
- [x] test-verifier-agent

### After build
- [ ] qa-plan-agent
- [ ] release-planner-agent
- [ ] documentation-agent
```

---

## Preset: Hotfix

Minimal pipeline — urgent production fix, skip analysis and planning.

```markdown
## KAIROS Pipeline

Effort: simple_fix
Auto-fix: 1

### Analysis
- [ ] pm-agent
- [ ] architect-agent

### Build (pick one)
- [x] implementer-tdd-agent
- [ ] implementer-coder-agent
- [ ] implementer-lead-agent

### Review
- [x] code-reviewer-agent
- [ ] security-reviewer-agent
- [ ] test-verifier-agent

### After build
- [ ] qa-plan-agent
- [ ] release-planner-agent
- [ ] documentation-agent
```

---

## Preset: Refactor / Rework

All phases except deployment — improving existing code without a new release.

```markdown
## KAIROS Pipeline

Effort: significant_rework
Auto-fix after review: 1
Auto-fix after tests: 2

### Analysis
- [x] pm-agent
- [x] architect-agent

### Build (pick one)
- [x] implementer-tdd-agent
- [ ] implementer-coder-agent
- [ ] implementer-lead-agent

### Review
- [x] code-reviewer-agent
- [ ] security-reviewer-agent
- [x] test-verifier-agent

### After build
- [ ] qa-plan-agent
- [ ] release-planner-agent
- [ ] documentation-agent
```

---

## Preset: Documentation

Analysis and writing only — no code, no deployment. `documentation-agent` works from the feature request and the requirements when no architecture or implementation artifact exists.

```markdown
## KAIROS Pipeline

Effort: simple_fix

### Analysis
- [x] pm-agent
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
- [x] documentation-agent
```

---

## Tracker Setup

### GitLab

Save the template as a reusable issue template:

```
.gitlab/issue_templates/kairos.md
```

Paste the full-feature preset (or blank template) in that file. GitLab exposes it in the issue creation form under **Templates**.

### Jira

In your Jira project settings, paste one of the presets into **Description → Default text** for the relevant issue type (Story, Bug, etc.). Alternatively, create a saved filter template and add the block manually.

### Bitbucket

Bitbucket does not support issue description templates natively. Paste the chosen preset into the **Description** field when creating the issue.

### In-chat (no issue)

When the orchestrator shows the Case B selection prompt, paste the entire template block as your reply. The orchestrator will parse the checked agents and ask for confirmation before proceeding.

---

## Agent Role Reference

| # | Agent | Role |
|---|-------|------|
| pre | `context-extractor-agent` | Full-repo scan → stack, patterns, conventions (standalone, optional) |
| pre | `impact-assessment-agent` | Issue-scoped grounding → effort, domains, work breakdown, agent recommendations (standalone, optional) |
| 1 | `pm-agent` | Requirements analysis, acceptance criteria, risks |
| 2 | `architect-agent` | System design, API contracts, DB schema |
| 3 | `implementer-tdd-agent` | TDD code generation (plan gate + code gate) — **default** |
| 3 | `implementer-coder-agent` | Code generation without TDD (for projects without a test suite) |
| 3 | `implementer-lead-agent` | Team Mode: lead + 4 parallel specialists (Claude Code only, ~3.5× cost) |
| 4 | `code-reviewer-agent` | Standards, security, performance review |
| 4b | `security-reviewer-agent` | Adversarial security review — IDOR, auth, injection, secrets, data exposure (optional) |
| 5 | `test-verifier-agent` | Test coverage and assertion quality |
| 5b | `qa-plan-agent` | Manual and exploratory QA plan, regression retest list, UAT sign-off |
| 6 | `release-planner-agent` | Deployment steps, rollback, monitoring |
| 6b | `documentation-agent` | Feature-facing docs — README, API reference, CHANGELOG (optional) |
