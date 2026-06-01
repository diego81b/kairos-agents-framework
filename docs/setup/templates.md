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

- [ ] pm-agent
- [ ] architect-agent
- [ ] implementer-tdd-agent
- [ ] implementer-coder-agent
- [ ] code-reviewer-agent
- [ ] security-reviewer-agent
- [ ] test-verifier-agent
- [ ] release-planner-agent
```

Check (`[x]`) only the agents you want to activate. For the implementation step, pick **one** of `implementer-tdd-agent` (TDD, default) or `implementer-coder-agent` (no TDD). Add `security-reviewer-agent` when the feature touches auth, payments, or any write endpoint.

---

## Preset: Feature Development

Full pipeline — new functionality going to production.

```markdown
## KAIROS Pipeline

- [x] pm-agent
- [x] architect-agent
- [x] implementer-tdd-agent
- [x] code-reviewer-agent
- [x] security-reviewer-agent
- [x] test-verifier-agent
- [x] release-planner-agent
```

---

## Preset: Bug Fix

Skip design and deployment planning; focus on fix + verification.

```markdown
## KAIROS Pipeline

- [x] pm-agent
- [ ] architect-agent
- [x] implementer-tdd-agent
- [x] code-reviewer-agent
- [ ] security-reviewer-agent
- [x] test-verifier-agent
- [ ] release-planner-agent
```

---

## Preset: Hotfix

Minimal pipeline — urgent production fix, skip analysis and planning.

```markdown
## KAIROS Pipeline

- [ ] pm-agent
- [ ] architect-agent
- [x] implementer-tdd-agent
- [x] code-reviewer-agent
- [ ] security-reviewer-agent
- [ ] test-verifier-agent
- [ ] release-planner-agent
```

---

## Preset: Refactor / Rework

All phases except deployment — improving existing code without a new release.

```markdown
## KAIROS Pipeline

- [x] pm-agent
- [x] architect-agent
- [x] implementer-tdd-agent
- [x] code-reviewer-agent
- [ ] security-reviewer-agent
- [x] test-verifier-agent
- [ ] release-planner-agent
```

---

## Preset: Documentation

Analysis and writing only — no code, no deployment.

```markdown
## KAIROS Pipeline

- [x] pm-agent
- [ ] architect-agent
- [ ] implementer-tdd-agent
- [ ] code-reviewer-agent
- [ ] security-reviewer-agent
- [ ] test-verifier-agent
- [ ] release-planner-agent
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
| pre | `impact-assessment-agent` | Issue-scoped grounding → effort, domains, agent recommendations (standalone, optional) |
| 1 | `pm-agent` | Requirements analysis, acceptance criteria, risks |
| 2 | `architect-agent` | System design, API contracts, DB schema |
| 3 | `implementer-tdd-agent` | TDD code generation (plan gate + code gate) — **default** |
| 3b | `implementer-coder-agent` | Code generation without TDD (for projects without a test suite) |
| 4 | `code-reviewer-agent` | Standards, security, performance review |
| 4b | `security-reviewer-agent` | Adversarial security review — IDOR, auth, injection, secrets, data exposure (optional) |
| 5 | `test-verifier-agent` | Test coverage and assertion quality |
| 6 | `release-planner-agent` | Deployment steps, rollback, monitoring |
