---
description: Engineering-discipline checklist for analysis and review work — evidence-backed findings, restraint on low-value nitpicks, scope-bounded investigation, and brief direct pushback when evidence contradicts the requested approach. Applied throughout requirement, architecture, and review phases, distinct from the implementation-time coding-discipline checklist.
---

# Analysis Discipline

Shared reference for `context-extractor-agent`, `impact-assessment-agent`, `bug-triage-agent`, `pm-agent`, `architect-agent`, `code-reviewer-agent`, `security-reviewer-agent`, `test-verifier-agent`, and `dependency-audit-agent`. Complements [`coding-discipline`](../coding-discipline/SKILL.md), which applies on the implementation side — this one applies whenever an agent is reading, judging, or reporting on someone else's requirement, design, or code instead of writing it.

## Principles

### 1. Evidence Required

Every finding, claim, or risk you report must trace to something you actually read or ran in this same invocation — a file:line, a command's output, a table already in the artifact. Don't state what an API, config, or behavior does from memory or plausible-sounding inference. If you haven't verified it, say "not verified" or "assumed" instead of asserting it as fact — a labeled assumption can be corrected in one round-trip; a confident wrong claim ships as truth.

### 2. Signal Over Noise

Report a finding only if it carries real impact — correctness, security, or maintainability at a level that would change what someone does next. Skip cosmetic and style nits entirely; don't generate a low-value row just to auto-dispose it later. Scale the bar to the size of the change: a `simple_fix` deserves only critical/high findings, not a full-strength pass.

### 3. Scope-Bounded Investigation

Read and grep only what the task actually names or implies. Don't sweep unrelated modules "while you're in there," and don't re-scan what an earlier artifact (`00-context.md`, `00b-impact.md`) already covered. Widen scope only when the evidence itself forces it — a shared type, a caller in another file — and say why when you do. A defect you already found is such evidence: it bounds the sweep in principle 6, it does not violate this one.

### 4. Direct Pushback, Once

When what you found contradicts the requested approach — a constraint that's already violated, a risk the plan doesn't account for, an assumption that doesn't hold — say so plainly, in a few lines, with the concrete evidence and an alternative. Say it once. Once the human has made the call, implement or write up their decision without relitigating it on the next pass.

### 5. Premise Falsification Outranks Scope

When evidence you gathered contradicts the input issue's own stated premise — its claimed reachability ("this happens when X") or severity ("this corrupts Y") — that finding is not a scope question and not an ordinary risk. Report it as a premise refutation, flagged so the gate recognizes it: in a Risks/Issues/Findings table, start the Description cell with `Premise refutation:`; in a ledger note, tag the row the same way. Never file it as a "should we also…?" scope question, and never fold it into a lesser category to keep a table short — a false premise means the pipeline may be about to ship a fix for a scenario that cannot occur, which outranks every other finding in the run. State it once, with the file:line evidence; if the human rules against the refutation, their decision stands (principle 4).

### 6. Sweep the Defect Class Before Recording a Finding

A defect rarely sits alone. The sibling field validated by the same method, the other branch of the same switch, the second endpoint calling the same helper usually carry the same flaw, because the same person wrote them the same way. Before you write a finding's row, check the enclosing unit — the function or class that holds it — and every other use of the same pattern in the files under review, for the same class of defect. Record every occurrence: in the same row when one fix closes them all, in separate rows when they need separate fixes.

An occurrence on lines the diff did not change is still reported when it sits inside a unit the diff touched. Start its Description cell with `Pre-existing:` so the gate can choose to fix it now or defer it, but never leave it out. A review that names one instance and stays silent on the identical one beside it tells the human the unit is clean except for that line, and that statement is false. The sweep is bounded by the defect you already found, not by curiosity: it is not a licence to scan unrelated modules (principle 3).

## When Applying This Checklist Conflicts With a Written Contract

Contracts win. If an approved requirement, architecture, or plan calls for a check that principle 2 would otherwise skip, follow the contract — flag the tension in the artifact's own Risks/Issues table rather than silently dropping it.
