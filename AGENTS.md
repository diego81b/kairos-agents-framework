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

## Versioning & Changelog

Every change must bump the version in `package.json`
and add a matching entry to `CHANGELOG.md`.

**Rules:**

- Follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.
  - `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `perf` → bump PATCH.
  - `feat` → bump MINOR.
  - Breaking change (`BREAKING CHANGE:` footer or `!` after type) → bump MAJOR.
- Update `version` in [package.json](./package.json) to the new value.
- Prepend a new section to [CHANGELOG.md](./CHANGELOG.md)
  using the existing format:

  ```markdown
  ## vX.Y.Z — Month D, YYYY

  ### Added | Changed | Fixed | Removed

  - **`path/to/file`** — short description of the change.
  ```

- Group entries under `Added`, `Changed`, `Fixed`, or `Removed`
  (omit empty groups).
- Use the current date (today) for the entry header.
- Reference impacted files with backtick-wrapped paths
  and explain the user-visible effect, not the implementation detail.

After making changes, present both the bumped `package.json` version
and the new changelog block alongside the commit message.
