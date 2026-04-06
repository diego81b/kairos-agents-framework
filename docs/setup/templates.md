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
- [ ] implementer-agent
- [ ] code-reviewer
- [ ] test-verifier
- [ ] release-planner
```

Check (`[x]`) only the agents you want to activate.

---

## Preset: Feature Development

Full pipeline — new functionality going to production.

```markdown
## KAIROS Pipeline

- [x] pm-agent
- [x] architect-agent
- [x] implementer-agent
- [x] code-reviewer
- [x] test-verifier
- [x] release-planner
```

---

## Preset: Bug Fix

Skip design and deployment planning; focus on fix + verification.

```markdown
## KAIROS Pipeline

- [x] pm-agent
- [ ] architect-agent
- [x] implementer-agent
- [x] code-reviewer
- [x] test-verifier
- [ ] release-planner
```

---

## Preset: Hotfix

Minimal pipeline — urgent production fix, skip analysis and planning.

```markdown
## KAIROS Pipeline

- [ ] pm-agent
- [ ] architect-agent
- [x] implementer-agent
- [x] code-reviewer
- [ ] test-verifier
- [ ] release-planner
```

---

## Preset: Refactor / Rework

All phases except deployment — improving existing code without a new release.

```markdown
## KAIROS Pipeline

- [x] pm-agent
- [x] architect-agent
- [x] implementer-agent
- [x] code-reviewer
- [x] test-verifier
- [ ] release-planner
```

---

## Preset: Documentation

Analysis and writing only — no code, no deployment.

```markdown
## KAIROS Pipeline

- [x] pm-agent
- [ ] architect-agent
- [ ] implementer-agent
- [ ] code-reviewer
- [ ] test-verifier
- [ ] release-planner
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
| 1 | `pm-agent` | Requirements analysis, acceptance criteria, risks |
| 2 | `architect-agent` | System design, API contracts, DB schema |
| 3 | `implementer-agent` | TDD code generation (plan gate + code gate) |
| 4 | `code-reviewer` | Standards, security, performance review |
| 5 | `test-verifier` | Test coverage and assertion quality |
| 6 | `release-planner` | Deployment steps, rollback, monitoring |
