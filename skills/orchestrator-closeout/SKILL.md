---
description: "Close-out for orchestrator-agent Step 10: finalizing _tracking.md, presenting the summary, the phase-file cleanup gate and the optional project summary written by documentation-agent. Read when the last active phase's gate resolves."
---

# Orchestrator: closeout

Text moved unchanged out of `orchestrator-agent`, which names the point where each section applies. Terms such as `derivation`, `areas`, `corrected` and `run.md` keep the meaning they have there.

## Close-out (Step 10, sub-steps a to d)

a. **Finalize** — read the actual files back off disk (never from chat memory of this run — same discipline as Step 0b's resume point): `03-implementation.md`, `03-implementation-plan.md` and `06b-documentation.md` when present, `ledger/open-questions.md`, `ledger/constraints.md`, `ledger/decisions.md`, `ledger/loops.md` (each only if it exists — a folder from before v8.4.0 has no `loops.md`, and keeps its loop sections in `open-questions.md`). Then, in `_tracking.md`: rewrite `## Status` with `**Run:** complete`; rewrite `## Issue Alignment` one last time; check that `## Phases` has a section for every phase that ran and fill any gap from that artifact's `## Summary`; append the completion line to `## Log`; and write the final sections below, after `## Phases`, replacing them if a re-run of this step already wrote them (a later hotfix can reopen a completed folder). Never rewrite `## Log` lines already there. The file stays a digest: never paste artifact bodies, code diffs, or long free-text feedback into it.
   ```
   ## Files Changed
   <code files from 03-implementation.md's cumulative `## Files Written` table — the union across every pass in its Pass Log, never just the last pass; doc files from 06b-documentation.md's Docs Touched if it ran; note any file in 03-implementation-plan.md's Files to Create/Modify that was planned but never actually written — file paths only, never diffs or file content>

   ## Run Summary
   <three to six lines distilled from ## Log, which stays in full above: total gate resolutions, waves and gates continued automatically, fix passes, Request-changes re-runs per phase, and, one line each, only the entries that matter on their own — Escalate/Stop pipeline, any choice that deviated from the recommended option, every `## Loop History` outcome (exhausted, thrash, or interrupted), and every decision a later row names in its `Supersedes` column (`D2 → D5, accepted at <phase>`)>

   ## Open Questions
   <every still-🔴-open row from ledger/open-questions.md, copied verbatim, except deferred risks (`⚠ deferred`, or an older `🔴 open` row marked `deferred risk`/`deferred contract mismatch`), which go in Accepted Risks below — omit this section if none remain>

   ## Open Constraints
   <every row of ledger/constraints.md still `🔴 open`, copied verbatim — omit this section if none remain. It is empty by construction when release-planner-agent ran; on a run without it, this is the only place an unmet `MUST` or `BLOCKING` row surfaces>

   ## Accepted Risks
   <every deferred row from ledger/open-questions.md (`⚠ deferred`, or an older `🔴 open` row marked `deferred risk`/`deferred contract mismatch`), copied verbatim — risks the human chose to ship with. Omit this section if none>

   ```

   **Usage.** `_usage.md` has been refreshed after every agent that returned, so it is already current; refresh it once more here only when an agent returned since. When the file exists, name its path in the summary of sub-step b; when it does not, say nothing about it (the **Usage file** rule: a host without the transcripts has no figures to give, and an absence is not news). Nothing from it is copied into `_tracking.md`.

   **Areas.** When `areas` is not `all`, the run is complete for the areas it selected and no further. Say which areas have not run (`Areas not run: delivery`) in the `## Run Summary`, and in the 3-5 line summary below.

b. **Present** — show a 3-5 line summary (same format as step 9). The file is already open in the editor from Step 0f; do not open it again.

c. **Cleanup gate** — a separate prompt, only after (b). Before asking, check two things and use them to pick the recommended option:
   - `ls ".kairos/$feature_folder/07-retrospective.md" 2>/dev/null` — if absent, `retrospective-agent` has not run for this feature yet and still needs these files as its own input.
   - Whether any question or constraint is still open — the rows just copied into Open Questions and Open Constraints. Deferred risks do not count: nobody is going to answer them, and counting them would recommend keeping everything forever.
   - List the exact files a cleanup would remove: every `.md` file directly in `.kairos/$feature_folder/` except `_tracking.md`, `_usage.md`, `_issues.md` (the deliverable of an analysis-only run), `_findings.md` (the Deferred findings' issue text), `_recap.md` (a pre-v8.5.0 folder's) and `07-retrospective.md` — this includes any `-iter{N}` / `-recheck` variant the review loop and fix passes wrote, not just the base 00–06b names. `07-retrospective.md` is excluded for the same reason as `ledger/`: nothing folds its content forward, so deleting it on the very run where it's most likely to exist (Delete is only recommended once retrospective already ran) would destroy it outright. Never delete `ledger/` under any option, and never construct the `rm` from a glob — pass the exact listed paths.

   If `AskUserQuestion` is available:
   - `question`: `"Tracking file finalized. Delete the <N> intermediate phase file(s) it now summarizes?"`
   - `header`: `"Cleanup"`
   - `options`:
     - **Keep everything** — do nothing. Mark `(Recommended)` whenever `07-retrospective.md` is absent, an open question remains, or `areas` is not `all`; state which in the option description (e.g. "retrospective-agent hasn't run yet — it needs these files", "2 open question(s) remain", "1 open constraint remains", "delivery has not run — it reads these files").
     - **Delete phase files, keep tracking** — delete exactly the listed files; `_tracking.md` and `ledger/` are untouched. Mark `(Recommended)` only when `07-retrospective.md` already exists AND no open question or open constraint remains AND `areas` is `all`.

   If `AskUserQuestion` is not available, print the same two options as a typed menu with the same recommendation logic and wait for a reply.

   If `Bash` is unavailable, or the delete command is denied: report `⚠️ Cleanup skipped — could not delete files.` and stop there — never work around it with another mechanism. Log the choice in `## Log` either way.

d. **Project Summary (optional)** — `.kairos/` may now be gitignored (Step 0c), so `_tracking.md` may not survive in the project's own git history. Ask whether to also persist a sanitized copy inside the project itself, outside `.kairos/`:
   - `question`: `"Also save a sanitized summary inside the project (outside .kairos/), so there's a durable record even if .kairos/ is gitignored?"`
   - `header`: `"Project Summary"`
   - `options`:
     - **Yes, save it** (Recommended) — proceed below.
     - **No, .kairos-only** — do nothing further.

   If `AskUserQuestion` isn't available, print the same two options as a menu and wait for a reply.

   On **Yes**: you do not compose the summary, `documentation-agent` does. It is the agent that owns documentation, already finds how the project writes and places its docs (**Detect Existing Conventions First**), and holds the redaction rules for anything that leaves `.kairos/`; a summary composed here would be a second author of the same kind of text. Dispatch @kairos:documentation-agent with `mode: orchestrated` and `step: summary` each on its own line (and the usual `feature_folder`, `effort` and `areas` lines), recorded in `in_flight` with `step: summary`. It reads each artifact's `## Summary`, the ledger, `03-implementation.md`'s `## Files Written` and `06b-documentation.md` when they exist, never `_tracking.md` and never `04b-security-review.md` beyond a category and a one-line non-exploitable takeaway (e.g. "1 high-severity auth gap found and fixed", never the attack path), redacts, writes the draft to `.kairos/$feature_folder/_project-summary.md` (replacing it on a re-run) and ends it with a `## Target` section: the proposed path and the convention it came from, in one line. The proposal follows the project's own docs layout, and `docs/kairos-summaries/$feature_folder.md` only when it finds none. Nothing is written outside `.kairos/` in this call.

   **The gate is yours, not the agent's.** `documentation-agent` is a subagent and has no `AskUserQuestion`, so it cannot show one, and the yes above only agreed to save something, not to save this content. Run the normal gate on the draft: print its path and the proposed target, and reply `open`/`apri` opens it and shows the gate again; then ask Approve, Request changes or Stop. `Request changes` re-dispatches the same call with the feedback (a different target path is feedback too) and shows the gate again; `Stop` writes nothing. Only on `Approve`, invoke @kairos:documentation-agent in **Verbatim passthrough** mode with `gate: resolved` on its own line, the draft's content without its `## Target` section and the target path. It checks that the target is a documentation file and writes it; nothing reaches the project before that. Print `📄 Project summary written to <path> — not committed.` and log the outcome in `_tracking.md`'s `## Log`.
