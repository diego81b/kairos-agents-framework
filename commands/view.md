---
description: Render one KAIROS phase artifact as a synthetic, human-readable HTML page
allowed-tools: Read, Glob, Artifact
---

# KAIROS View — synthetic HTML for one phase artifact

**Claude Code only** — this command publishes an Artifact, a capability this host provides and others (Cursor, JetBrains/Copilot, Codex CLI, OpenCode, Kimi Code) do not. If you are not running in Claude Code, stop and say so instead of attempting the steps below.

You are turning ONE `.kairos/<feature_folder>/<phase-file>.md` into a compact, readable HTML page — never the whole feature folder, never more than one file per invocation.

## Step 1 — Resolve the target file

`.kairos/` accumulates one subfolder per feature ever processed — potentially a long history. Never Glob phase files across every folder at once; narrow to one feature folder first, then to one phase file inside it.

1. **Feature folder** — if the user's prompt already names one (a feature/issue reference, or a folder name), use it. Otherwise Glob `.kairos/*/` for folder names only (no file listing yet), and ask which one via `AskUserQuestion`.
2. **Phase file** — if the user's prompt already names a phase or file (e.g. `04-review.md`, "the architecture doc"), use it directly within the folder from step 1. Otherwise Glob `.kairos/<feature_folder>/[0-9]*.md` for that folder only, list what you find (phase name + status), and ask which one via `AskUserQuestion`.

If the prompt already fully specifies both feature and phase in one go, skip straight to Step 2 — don't ask twice for something already given.

## Step 2 — Read it

Read the target file in full: the YAML frontmatter and the Markdown body.

## Step 3 — Load `artifact-design` before building anything

Call the `Skill` tool with `artifact-design` before writing any HTML — this is required by the Artifact tool's own rules, not optional here.

## Step 4 — Synthesize, don't dump

Build a single HTML page that distills the file, it does not paste it verbatim:

- Header: phase name (from the filename) and its verdict field (`status:` or, for an architect artifact, `promptable:`).
- Small stat tiles for whichever tally fields are present in the frontmatter — `risk_counts`, `issues_summary`, `findings_summary`, `open_dispositions`.
- Any Risks/Issues/Findings/Contract-Drift table in the body → a real HTML table, one row per finding, with a visible `Disposition` badge per row (Accept / Mitigate / Escalate / Defer / open).
- Long prose sections (rationale, analysis) → summarized to their key points, not reproduced wholesale. Preserve every table and every concrete number as-is; compress prose only.

## Step 5 — Publish

Publish via the `Artifact` tool. Title = the phase name (e.g. "Code Review", "Architecture"). Description = one sentence naming the feature and verdict. Pick a favicon emoji matching the phase (e.g. 🔍 for review, 🏗️ for architecture, 🛡️ for security).

## Step 6 — Hand back the link

Return the artifact URL to the user with a one-line summary of what it shows. Do not also paste the full synthesized content into the chat — that defeats the point of the command.
