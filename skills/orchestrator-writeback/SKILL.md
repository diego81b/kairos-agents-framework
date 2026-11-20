---
description: "Issue Write-back for orchestrator-agent: saving the human's pipeline correction into the tracker issue as a ## KAIROS Pipeline section, with the mandatory mode of the manual pipeline and the paste-ready fallback. Read when the run has an issue reference and a correction to save."
---

# Orchestrator: writeback

Text moved unchanged out of `orchestrator-agent`, which names the point where each section applies. Terms such as `derivation`, `areas`, `corrected` and `run.md` keep the meaning they have there.

## Issue Write-back

**Issue Write-back** (after the Size Label, before Phase 1). A `## KAIROS Pipeline` section is how a team keeps a correction across machines and colleagues, and nothing else in this plugin writes it, so offer to write back the correction the human just made. This is the second narrow exception to writing only inside `.kairos/`, after the Gitignore check, and it touches nothing in the tracker but that one section.

Skip this whole step, silently, when any of these holds:
- there is no issue reference;
- the Checklist path ended on **Use the checklist** — the issue already says exactly this;
- `corrected` is false and `derived_from_checklist` is false — with no correction there is nothing to save, and the next run derives the same pipeline from the same facts;
- `test -f .kairos/.issue-writeback-declined` succeeds and the run is not a **Manual pipeline** — the human asked not to be asked in this project. The manual pipeline ignores that file: it is the one case where saving is not offered but done (**Mandatory mode** below).

A run started from the **Manual pipeline** with `manual_pipeline: pending` follows **Mandatory mode** instead of the rest of this step (an analysis-only pipeline, when its analysis ends). Otherwise **read the issue again before composing anything.** Run Step 0d's read once more: the description may have changed since Step 0b, a first read that failed may succeed now, and the offer below is only honest if it knows what the issue holds today. If that read fails, go to the paste-ready fallback below with the block composed from the run's corrections alone, and say that the issue could not be read.

Compose an override block as **what the issue's section holds today, with this run's corrections applied on top**: start from the lines of the section just read (`issue_section`, refreshed), and for each of `Size:`, `Effort:`, `Epic:`, `Areas:` and `Auto-fix:` that the human set or corrected in this run, replace that line or add it; `Skip:` and `Add:` hold the issue's names plus this run's, and a name the human removed in this run leaves its list. Lines the human did not touch stay exactly as the issue has them, because replacing the section with the corrections alone deletes the issue's other lines (a `Skip:` that was there, an `Auto-fix:` nobody mentioned). Never write a checklist, even when the run started from one: an override block keeps the derivation, which is what makes it reusable. After **Derive instead** with no correction, the block is the `## KAIROS Pipeline` heading alone, which replaces the checklist and means "fully derived". **When the composed block says what the issue's section already says** (same lines, order and spacing aside), stop here and write nothing: there is nothing to offer, and asking to save what is already saved is the question this step must never ask.

Show the block, marking each new or changed line (`+ Effort: medium`), and the target issue, then ask. If `AskUserQuestion` is available, call it, with no typed menu too:
- `question`: `"Save your changes to the pipeline in <issue key>?"`
- `header`: `"Issue"`
- `options` (exactly these 3, in this order):
  - **Add to the issue** — append the block to the issue description, or replace only its existing `## KAIROS Pipeline` section. Nothing else in the description changes.
  - **Only for this run** — the issue is not changed.
  - **Don't ask again in this project** — never offer this again in this project; write nothing.

Without `AskUserQuestion`, print the three options as a menu. On **Don't ask again in this project**, `touch .kairos/.issue-writeback-declined`.

On **Add to the issue**:
1. **Use the description you just read**, with Step 0d's command (on GitLab add `--jq .description`). Never send a description you did not read back successfully, or the write replaces the whole description with the block alone. If the human took long to answer, read it again.
2. **Compose** the new description: the text you read with its `## KAIROS Pipeline` section (heading up to the next `## ` heading or the end) replaced by the block, or the block appended after a blank line. Write it to `.kairos/$feature_folder/_issue-description.md`.
3. **Write** it, after `command -v` confirms the tool exists:
   ```bash
   # GitLab
   glab issue update <id> --description "$(cat ".kairos/$feature_folder/_issue-description.md")"

   # Bitbucket (needs jq to build the JSON body)
   jq -Rs '{content:{raw:.}}' ".kairos/$feature_folder/_issue-description.md" | \
     curl -X PUT "https://api.bitbucket.org/2.0/repositories/{workspace}/{repo}/issues/<id>" \
       -u "${BITBUCKET_USER}:${BITBUCKET_TOKEN}" -H "Content-Type: application/json" -d @-
   ```
   **Jira: do not write.** `jira issue view` returns the rendered description, not its source, so a write would reformat the rest. Use the paste-ready fallback and say why in one line.
4. **Delete** `_issue-description.md` whatever the outcome, and report `✅ Pipeline changes saved to <issue key>` or the failure.

**Paste-ready fallback** — no tracker CLI, a failed read or write, missing `jq` or Bitbucket credentials, or Jira: print the block in a fenced `markdown` code block with `Paste this into <issue key>'s description:`, and continue. The write-back never blocks the run.

**Mandatory mode** (the **Manual pipeline** only). A person who picked every agent by hand made a decision no rule can rebuild, and a colleague who opens the issue tomorrow must find it there; the question the three buttons above ask is therefore not asked. Print `💾 Saving your pipeline to <issue key> (mandatory in this mode)` and go on:
1. **Read the issue again**, exactly as above. A failed read goes to the paste-ready fallback.
2. **Compose the block** from the final checklist, after the Start Gate and every correction made there: the `## KAIROS Pipeline` heading, every agent in pipeline order as `- [x] <agent>` or `- [ ] <agent>` (the unticked ones too, so the section reads as a complete decision and not as a partial list), then `Effort: <value>` and `Auto-fix: <N>` with their final values. This is the one place this file writes a checklist: an override block would be re-derived by the next run, and the point of this mode is that nothing is.
   **Analysis only** (no `Development`, `Review` or `Delivery` agent ticked: the run makes the issue ready, and a checklist saved now would hold agents that already ran and none of the ones a later run needs). Do not save at the Start Gate. Wait until the last ticked analysis agent's gate resolves, when its facts exist, then ask the Manual pipeline's Development, Review and Delivery questions once more in one call, marking `(Recommended)` each agent the Selection Rules derive from those facts and naming the fact (`test_first: yes`, `domains has db`). Compose the checklist with the analysis agents that ran unticked (`- [ ]`, their artifacts stay in the folder) and the chosen later agents ticked, then save. A run stopped before then saves nothing.
3. **Never replace a section the re-read shows**: if the issue now holds a `## KAIROS Pipeline` section it did not hold when the run started, write nothing, print the block paste-ready, and say that the issue's own section wins. Otherwise append the block after a blank line, with the commands and `_issue-description.md` step of **On Add to the issue**.
4. **Jira**: post the block as a comment with `jira issue comment add PROJ-42 --no-input "<block>"` as the record, and print it paste-ready for the description. Step 0d reads only the description, so the next run asks again until a person pastes the block; say so in one line.
5. **No CLI, a failed write or any other failure**: print the block paste-ready, loudly (`⚠️  Your pipeline is not saved to <issue key>: <reason>. Paste this into its description:`), and continue. This mode never blocks the run.
6. **No issue reference**: write nothing outside `.kairos/`; `run.md` already holds the pipeline.

Then set `manual_pipeline: done`, delete `_issue-description.md`, log `pipeline saved to <issue key>` (or `pipeline not saved: <reason>`) in `_tracking.md`'s `## Log`, and continue to Phase 1.
