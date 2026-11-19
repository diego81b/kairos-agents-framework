---
description: Layered Mode for orchestrator-agent: the offer (cost warning and question) and the stage runner (RED, GREEN, VERIFY, FIX, REFACTOR, CLOSE) that replaces the single Step 3b call. Claude Code only. Read when the implementer decision reaches Layered Mode or implementer-lead-agent is the implementer.
---

# Orchestrator: layered

Text moved unchanged out of `orchestrator-agent`, which names the point where each section applies. Terms such as `derivation`, `areas`, `corrected` and `run.md` keep the meaning they have there.

## Layered Mode check

**Layered Mode check** (only when rule 4 or 5 chose `implementer-tdd-agent`; called Team Mode until v9.5.0). Offer Layered Mode when both of these hold: two or more of `backend`, `frontend`, `db` are in `domains` (from `02-architecture.md`, else `00b-impact.md`); and the host is Claude Code:

```bash
echo "$CLAUDECODE"   # 1 inside a Claude Code session
```

Nothing else is checked: Layered Mode needs no experimental flag, because you call every agent of it as a plain subagent (**Layered Mode execution**, below). You call a layer agent only for a layer the lead scoped in, so two layers are enough to be worth it. When the check holds, or when `implementer-lead-agent` came from rule 1, show the cost warning and wait for confirmation:

```
⚠️  LAYERED MODE — COST WARNING

Single Agent:  one implementer run (implementer-tdd-agent)
Layered Mode:  more calls than that, several of them on opus (Claude Code only)

Why offered:   <layers in domains>
Calls:         lead plan, tests RED, one call per layer in scope for GREEN, lead verify,
               REFACTOR, lead close, plus a fix round for every contract mismatch found.
Cost:          not measured. Read _usage.md after the run.
Worth it for:  changes where the layers must agree on binding contracts.
```

Then ask. If `AskUserQuestion` is available (Claude Code), call it — do not also print a typed menu:
- `question`: `"Layered Mode fits this change but calls more agents than a single implementer. Use it?"`
- `header`: `"Layered Mode"`
- `options`:
  - **Confirm Layered Mode** — proceed with `implementer-lead-agent`
  - **Single agent** — use `implementer-tdd-agent`
  - **Cancel pipeline** — halt here

If `AskUserQuestion` is not available, print the same three options as a menu and wait for a typed reply.

If confirmed → call @kairos:team:implementer-lead-agent, and lower `loop_policy.review.max_retries` to 2 if it is higher, saying so (Step 0e's clamp). If single → call @kairos:implementer-tdd-agent. If cancelled → stop. Log the choice. Do NOT call `implementer-lead-agent` without this confirmation.

## Layered Mode execution

**Layered Mode execution** (only when `implementer-lead-agent` is the implementer). Step 3b is not one call here: you run the stages below, each agent a plain subagent called in the foreground, so nothing in it needs an experimental flag. The lead cannot call the layer agents and the layer agents cannot ask anyone anything: you call every one of them, and the files in the feature folder are the only channel between them, which is why every question a stage raises comes back to you as a row on disk.

| Stage | Call | Runs |
|-------|------|------|
| RED | `teammate-tests-agent`, `step: red` | alone: no other agent writes while it does |
| GREEN | one `teammate-<layer>-agent` per layer of the plan's `layers_in_scope` (`backend`, `frontend`, `database`), `step: green` | in one message, in parallel |
| VERIFY | `implementer-lead-agent`, `step: verify`, `round: <n>` | alone |
| FIX | the layer agents named in `layers_to_fix` of `03-verify.md` (the tests agent when it is listed), `step: fix`, `round: <n>` | in one message, in parallel |
| REFACTOR | the implementation layers in scope, `step: refactor`; never the tests agent | in one message, in parallel |
| CLOSE | `implementer-lead-agent`, `step: close`, `round: <n>`, `pass_kind: <kind>` | alone |

An initial pass runs RED, GREEN, VERIFY, then FIX and VERIFY until the verdict is `pass`, then REFACTOR, then CLOSE. A fix pass after the review wave (4.3 and 4.5) runs `implementer-lead-agent` with `step: scope`, then FIX for the layers its `03-verify.md` names, then CLOSE: RED and REFACTOR never run in it, and the lead reads the contracts back from `03-contracts.md`. When the plan has more than one wave (`total_waves` above 1), every wave runs RED to CLOSE on its own, and every call of it carries `wave: <n> of <total>`; the wave in progress is the `next_wave` of the partial `03-implementation.md`, or 1 when there is none.

**Prompts.** Every call states these as `key: value` lines, one per line, next to the dispatch lines the other agents get: `Feature folder: <folder>`, `effort: <value>`, `step: <stage>`, and where they apply `layer: <layer>` on a layer call, `round: <n>`, `pass_kind: <kind>` on CLOSE, `wave: <n> of <total>`, and `human_decision:` (below). `_usage.md` takes the feature from the `Feature folder:` line, so a call without it goes unattributed. `pass_kind` is `initial` for a plan with one wave, `wave <n> of <total>` otherwise, `loop iteration <N>` in the review loop (4.3), `fix pass after the review gate` or `fix pass after the QA plan gate` (4.5), and `manual re-run after Request changes`. A layer agent has no recovery mode: an interrupted one is re-run from its first prompt (Step 0b).

**Round.** For VERIFY and CLOSE, `round` counts the FIX stages already run in this chain, where a chain starts after GREEN (VERIFY), after REFACTOR (CLOSE) or at `scope`; so the first VERIFY and the first CLOSE of an initial pass are `0`. A FIX stage carries its own number, `1` for the first. A chain allows two FIX rounds.

**State.** Before each dispatch, in one edit of `run.md`, write `layered_stage`, `layered_round` and one `in_flight` entry for every call you are about to make, the parallel ones together, with the stage as the entry's `step`. Remove an entry as its call returns, and when the stage's last call has returned refresh `_usage.md` once (**Usage file**), then act on the result as below. Stages are not phases: between two of them there is no gate, no question and no `_tracking.md` rewrite, only one `## Log` line per stage (`<date> | 3b | layered <stage> | <result in a few words>`). You stop at a `human` verdict, at a blocked layer, and at the Phase 3 gate after CLOSE.

**Reading the results.** After a layer stage, read the frontmatter of each called layer's `03-layer-<layer>.md`. A call that returned with no report is re-run once with the interrupted-run sentence; a second miss counts as `blocked`. `status: blocked` ends the stages: show that report's `## Notes` and `## Cross-domain requests`, and ask with **Retry the stage** or **Stop pipeline**. `status: partial` does not stop anything, because the lead's next VERIFY or CLOSE flags it as a mismatch. After a lead call, read the frontmatter of `03-verify.md` (`stage`, `round`, `verdict`, `layers_to_fix`); when it is missing or its `verdict` is not `pass`, `fix` or `human`, report it as the Artifact Contract Check does and re-run that call once, and treat a second failure as the Error Handling section does.
- `pass` after VERIFY: REFACTOR. `pass` after CLOSE: the pass is finished and `03-implementation.md` was written last; go on to the Phase 3 gate, or to Wave Continuation for a `partial` wave.
- `fix`: FIX for the layers in `layers_to_fix`, with `round` one higher than the round that returned it (a `scope` counts as round 0), then the stage that returned the `fix` again (VERIFY after a VERIFY, CLOSE after a CLOSE or a `scope`). When the VERIFY or CLOSE of round 2 still says `fix`, treat it as `human`. The lead moves a mismatch it has sent twice to `## Needs Human` on its own, so this is the backstop for mismatches that keep changing.
- `human`: stop and show the rows of `## Needs Human` with their IDs. If `AskUserQuestion` is available, ask one question, `"The layers could not settle these contract points. How do you want to proceed?"`, header `"Contract gap"`, options **Accept as documented gap**, **I fixed it by hand**, **Stop pipeline**; free text is an instruction that overrides the contract point for the layers. Otherwise print the same as a menu. Write each Accept and each instruction as a `decisions.md` row (`Phase: orchestrator`; `Accepted gap: <layer>, <field>` or `Contract clarified by the human: <text>`, opening with `Scope:` when it widens or narrows what the issue asked), then call the **same lead step** again, never a layer, with one `human_decision:` line per row: `<row id>: accept`, `<row id>: fixed by hand` or `<row id>: <instruction>`. A choice that names no ID applies to every row shown. **Stop pipeline** halts as at any gate: the files already written stay, nothing is reverted, and the message says so.

A `Contract divergence` row of the plan that the human dispositioned **Mitigate now** at the plan gate needs nothing from you: the lead applies it to `03-contracts.md` at the start of its next `verify` or `scope`. On one of them step 2's Escalate follow-up is asked without **Keep it open and go on**, so an Escalate there is either answered (the row closes **Mitigate now** and the lead applies it) or **Stop here**, which stops for the architect before any stage runs.

**Resume.** With `in_flight` empty, `layered_stage` says which stage's calls all returned, and you continue from reading its results, exactly as if the session had not ended: the next stage follows the list above, and after a FIX it is the stage named by `03-verify.md`'s `stage` field (`scope` leads to CLOSE), at `layered_round`. A `layered_stage` of `close` with `03-verify.md` at `verdict: pass` and a `03-implementation.md` is a finished pass: show the Phase 3 gate. With `in_flight` set, re-invoke what is listed (Step 0b).
