# KAIROS — Contributor Instructions

## Commit Convention

All commits to this repository must follow [Conventional Commits](https://www.conventionalcommits.org/).

**Format:**

```
<type>(<scope>): <short summary>

[body — 1–4 lines, only when the change is non-trivial]

[footer — BREAKING CHANGE: … / Closes #n]
```

**Rules:**
- Title is required; body and footer are optional.
- Title: imperative mood, max 72 chars, no period at the end.
- Body: 1–4 lines depending on the complexity and volume of changes. Omit for trivial commits.
- Common types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `perf`.

**Examples:**

Simple change (title only):
```
docs(setup): add JetBrains setup guide
```

Non-trivial change (title + body):
```
feat(orchestrator): add context-extractor pre-pipeline step

Agents now receive a pre-built 00-context.json produced by the
context-extractor-agent, reducing redundant codebase analysis.

Closes #38
```

After making changes to this repository, generate a commit message following the above rules and present it in a fenced code block ready to copy and paste.
