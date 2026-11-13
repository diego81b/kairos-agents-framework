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
- Update `version` in [package.json](../package.json) to the new value.
- Prepend a new section to [CHANGELOG.md](../CHANGELOG.md)
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

## OpenCode Mirror Sync

Every file in `agents/` (the 17 core pipeline agents, **not** `agents/team/`) has a hand-maintained counterpart in `.opencode/agents/`. There is no conversion script — this mirror is kept in sync by hand, on purpose, to avoid a generated artifact drifting from a script no one maintains.

**Rule: if a commit touches any `agents/*.md` file, it must also update the matching `.opencode/agents/*.md` file in the same commit.**

- Body changes → copy the same body change into the mirror (bodies must stay byte-for-byte identical between the two).
- Frontmatter changes (`description:`, `tools:`, `model:`) → re-derive the mirror's `description:`/`permission:`/`model:` fields using the mapping table in `docs/setup/opencode.md`.
- New core agent file → add both `agents/<name>.md` and `.opencode/agents/<name>.md`.
- Removed core agent file → remove both.
- Before committing, diff the two directories' bodies (strip frontmatter from each side and compare) to confirm nothing drifted.

**`agents/team/*.md` is explicitly out of scope for this mirror** — do not add a Layered Mode file (the folder's name is the v9.4 one, kept on purpose) to `.opencode/agents/` just because this rule says "every `agents/*.md` file." The Agent Teams dependence that once justified this is gone since v9.5.0, but nobody has run Layered Mode on OpenCode, so mirroring is a separate decision. See `docs/setup/opencode.md`'s "No Layered Mode mirror" note before changing this.

## Kimi Code Mirror Sync

Every file in `agents/` (the 17 core pipeline agents, **not** `agents/team/`) also has a hand-maintained counterpart in `.kimi-code/agents/`. Same discipline as the OpenCode mirror: no conversion script, kept in sync by hand, on purpose.

**Rule: if a commit touches any `agents/*.md` file, it must also update the matching `.kimi-code/agents/*.md` file in the same commit.**

- Body changes → copy the same body change into the mirror (bodies must stay byte-for-byte identical between the two).
- Frontmatter changes (`description:`, `tools:`, `model:`) → re-derive the mirror's fields using the mapping table in `docs/setup/kimi-code.md`. Unlike the OpenCode mirror, `name:`/`description:`/`tools:` CSV copy over unchanged (Kimi Code accepts Claude-Code-style frontmatter and shares the same tool names, `AskUserQuestion` included); the only translation is `model: opus` → `model_preference: primary` and `model: sonnet` → `model_preference: secondary` (symbolic — resolves to the user's configured Kimi models, never concrete Claude model ids).
- New core agent file → add both `agents/<name>.md` and `.kimi-code/agents/<name>.md`. Removed core agent file → remove both.
- Before committing, diff the two directories' bodies (strip frontmatter from each side and compare) to confirm nothing drifted.

**`agents/team/*.md` is explicitly out of scope for this mirror too** — same status as the OpenCode exclusion above (deferred, not run there). See `docs/setup/kimi-code.md`'s "No Layered Mode mirror" note before changing this.

## Orchestrator Size Budget

`agents/orchestrator-agent.md` grew from 58 KB (v7.4.0, 2026-08-27) to 252 KB (v9.7.0, 2026-10-23), about 4 KB a day, and it is loaded into every turn of every run. The rules in it that small models miss are the ones buried deepest. Until the kairos-cli runner replaces it, the file does not grow.

**Rule: the file stays at or under 252,000 bytes** (`wc -c agents/orchestrator-agent.md`). The budget is a ceiling, not a target.

- A change that adds text to `agents/orchestrator-agent.md` must remove or shorten at least as much elsewhere in the same file, and the commit says what went.
- Prefer, in this order: delete a rule the derivation made redundant; shorten a paragraph that restates another; fix the rule where it already is. A new paragraph is the last resort.
- New behaviour goes into the agent it belongs to, not into the orchestrator, unless the orchestrator is the only one that can act on it (gates, dispatch, ledger writes, `run.md`).
- Over budget is allowed only for a fix that stops a real failure and has no shorter form. Say so in the CHANGELOG entry and lower the next change's allowance by the same amount.
- Do not add code to this repo to make the file shorter. The deterministic rules (derivation, resume, contract check, option parsing) live in the kairos-cli runner, which already implements most of them; this file stays the readable specification and the Claude Code host.
- The mirrors (`.opencode/agents/`, `.kimi-code/agents/`) carry the same body, so one check covers all three.
