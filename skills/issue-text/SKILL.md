---
description: Reference for pm-agent and architect-agent on how the _issues.md file is laid out when no development follows. Not a way to file issues.
---

# Issue Text

Shared reference for `pm-agent` (step 8) and `architect-agent` (step 7). Whichever of the two runs last in an analysis-only run writes `.kairos/<feature_folder>/_issues.md`: text for a person to paste into a tracker, a document or an email. Nothing in KAIROS creates an issue, reads the text back or files it, and no other agent reads this skill.

One layout. There is no mode to choose: the reader decides how much to keep.

## 1. When the file is written, and by whom

Written when no development follows: `ledger/run.md` holds `areas` without `development`, or the prompt asks for issues (`scrivi le issue`, `write the issues`). Run standalone, without a `run.md`, the prompt decides.

The author is the last analysis agent that ran:

- `architect-agent`, when it ran. It overwrites a file `pm-agent` wrote earlier in the same run and adds the Design notes.
- `pm-agent`, when `architect-agent` is not in `active_agents` of `ledger/run.md`.

Without a `run.md`, an agent writes the file whenever the prompt asks for issues.

## 2. How many issues

- `01-requirements.md` holds a `## Slices` table with two or more rows: one issue per row, in the table's order.
- Otherwise (one row, no table, no `01-requirements.md`, Lean Mode): one issue holding the whole change.

A slice is one run of one issue in KAIROS. Writing a slice as its own issue is an offer, which is why the file says nothing about whether the reader should split.

## 3. Layout of the file

````markdown
# Issues: <the feature, in the words of the request>

## 1. <Title>

**Goal:** <one or two sentences: what a user or the system can do after this issue that it cannot do today>

**Out of scope:** <what a reader might expect here that another issue of this list holds, by title. Omit the line when there is none>

**Acceptance criteria**
- <one observable result per line> (AC-n)

**Design notes**
<what a developer needs from the design to build this issue, written out: the data model rows, the endpoint and its error responses, the limits with their units, the constraints that bind it>

**Depends on:** <titles of the issues of this list that must land first, or the number of an existing tracker issue. Omit the line when there is none>

## 2. <Title>
...

**Not carried:** AC-n (<reason>), AC-m (<reason>)
````

Rules for each part:

- **Title.** Imperative, in the words of the product, under about 70 characters. No ids, no phase names.
- **Goal.** Product words. It restates no criterion.
- **Acceptance criteria.** Copy each criterion from `01-requirements.md` word for word, with its `AC-n` in parentheses at the end as a trace. A later run maps tests against those ids, so a rewritten criterion loses its id. Every `AC-n` of the requirements lands in exactly one issue: the one whose slice row lists it. Without `01-requirements.md`, write criteria from the design's observable outcomes, one per line, with no ids.
- **Design notes.** Only when `architect-agent` wrote the file: omit the whole block when `pm-agent` did. Written out in full. A reader who opens the issue on a colleague's machine has no `.kairos/` folder, so a pointer to `02-architecture.md`, a ledger row or a `C`/`D`/`Q` id is not content. Keep only the parts this issue builds: the tables, endpoints and constraints of other issues stay with them. A limit names its unit (`400 lock keys per request, 2 per row, so 200 rows`), as in the Behaviour Delta rule.
- **Depends on.** From the slice row's `Waits for` column, turned into titles. A dependency written as `S1` means nothing outside the run.
- **Not carried.** The last line of the file, outside any issue: name every criterion of `01-requirements.md` that no issue holds and why (dropped by a `Scope:` decision, moved to a later run, refuted), or write `**Not carried:** none`. Omit the line when there is no `01-requirements.md`.
- Local ids (`AC-n`, `C`, `D`, `Q`, `R`) appear only in parentheses as a trace, never as the sentence.

## 4. Rules that hold for the whole file

- Inside an issue no line starts with `#`: the issue's own `##` heading is the only heading line, and the labels above are bold. A pasted body must not look like a `## KAIROS Pipeline` section or a heading of the tracker's own.
- The language of the text is the language of the requirements, or of the prompt when there are none.
- No `Size:`, `Effort:`, `Areas:`, `Skip:` or `Epic:` line, in any issue. Each issue's own run measures size and effort, and the author has no second source for them. The epic does not exist when the text is written.
- No estimate in hours or days.
- The Summary's `What:` line of the author's artifact names the path of `_issues.md` and the number of issues, so the gate shows it.
