---
description: Engineering-discipline checklist for writing new code — scope control, anti-overengineering, assumption surfacing, verifiable success criteria, rare WHY-only comments, and plain maintainable code (KISS, SOLID as judgement, no boilerplate or fragmentation). Applied before and during implementation, distinct from the REFACTOR-time code-simplification checklist.
---

# Coding Discipline

Shared reference for `implementer-tdd-agent`, `implementer-coder-agent`, `implementer-lead-agent`, and the four Layered Mode layer agents (`teammate-backend-agent`, `teammate-frontend-agent`, `teammate-database-agent`, `teammate-tests-agent`). Applied at the start of implementation, before any file is written — complements [`code-simplification`](../code-simplification/SKILL.md), which applies later, at the REFACTOR step once code already exists.

## Principles

### 1. Scope Discipline

Write the smallest change that satisfies the requirement. Don't rename unrelated identifiers, reformat untouched code, or "improve" a neighboring function while passing through it. A bug fix doesn't need surrounding cleanup; a one-shot operation doesn't need a helper extracted for reuse that doesn't exist yet. A refactor belongs in the diff only when the requirement or the approved plan names it. The REFACTOR step covers code this change wrote and nothing else: code outside the diff stays as it is, however improvable it looks.

For bug-type work specifically, tread carefully: default to the most surgical fix that resolves the defect without touching code paths the bug doesn't reach — working code already in production stays as it is, not "improved" in passing. If the minimal fix turns out not to be enough — the defect can't be resolved without touching adjacent code, an existing pattern has to change, or the fix ripples into files that aren't obviously part of it — don't decide that expansion alone. Surface it as a Risk in the Phase 0 plan (or ask directly when running standalone) so a human signs off on the wider scope at the existing approval gate, before it lands in the diff rather than after.

### 2. No Speculative Abstraction

Don't design for a hypothetical future requirement. A config flag, a generic plugin interface, or a strategy pattern needs at least two real call sites today to justify existing — one call site plus a guess about a second one later is not justification. Three similar lines of code are better than a premature abstraction built to avoid them.

### 3. Surface Assumptions

When a requirement is ambiguous, state the assumption being made — in the implementation plan or the output notes, not silently — instead of guessing and moving on without saying so. A wrong assumption that's visible can be corrected in one round-trip; a wrong assumption baked in silently surfaces as a bug report later.

### 4. Verifiable Success Criteria

Before writing code, know how its correctness will be checked: a specific test, a manual run with a concrete expected output, or a log line that proves the path was exercised. Don't declare a task done on the strength of "the code looks right" — if there's no way to verify it, that's a sign the task isn't actually scoped yet.

### 5. Trust Boundaries

Validate input only at system boundaries — user input, external API responses, data crossing a trust boundary. Don't add defensive checks, fallbacks, or error handling for states that are internally guaranteed not to occur (a value this same function just constructed, a parameter every caller already validates). Defensive code for an impossible case doesn't add safety — it adds a second, less-tested path.

### 6. Comments: Rare, WHY Only, Never Narration

The default is no comment. Write one only where a reader would otherwise undo a deliberate choice: a workaround, a hidden constraint, a subtle invariant, a non-obvious algorithm. One or two lines, stating the reason and not the mechanism. If the code needs a paragraph to be understood, rename or restructure it first; the comment is the last resort, not the first.

Never write:
- a comment that restates what the code does, or explains a plain loop, condition, assignment or call;
- a doc block (JSDoc, XML doc, docstring) that repeats the name and signature. Write one only where a lint rule or the project's existing convention requires it on public API, and keep it to one line;
- a reference to an issue, ticket, merge request, requirement, design document or spec (`#123`, `issue-1015`, `per the spec`, `see docs/...`). The commit and the tracker carry that link;
- any reference to KAIROS: ledger IDs (`C2`, `D7`, `Q3`), `AC-n`, phase or agent names, "per the architect's decision". `.kairos/` is local and gets deleted, so shipped code must not point into it;
- section banners, change-history notes ("added for X", "changed from Y"), or commented-out code.

Tests follow the same rule, and more strictly: a unit test carries no explanatory comment. The test name states the behaviour and the assertions state the expectation. No `// Arrange / Act / Assert`, no comment narrating a step, no comment saying what the test proves. A test that needs a comment to be understood is named badly or tests too much: rename it or split it. The one exception is a single line when the test pins a non-obvious WHY, such as a regression for a subtle defect or a fixture value that looks arbitrary.

Applies from PHASE 1 onward. Last step before returning, read the comment lines of your own diff, production and tests, and delete every one this principle rules out.

### 7. Simple, Maintainable Code

Write the plainest code that satisfies the requirement and that a stranger can change in six months without the author. KISS and SOLID are tests applied to the code in front of you, never a template to fill in.

- **Plain over clever.** Direct control flow and explicit names. No dense one-liners, nested ternaries, chained tricks or metaprogramming that make the reader stop and decode. A construct chosen to look elegant is a cost, not a feature.
- **SOLID as judgement.** One reason to change per unit (single responsibility) is the rule that matters day to day. The other four (open/closed, substitution, interface segregation, dependency inversion) apply only where the seam already exists: a second implementation or a test double that exists today. Never add an interface, base class, factory or injection layer to satisfy a letter of the acronym; principle 2 says why.
- **No boilerplate.** No wrapper that only forwards a call, no mapper or DTO that copies a shape an existing one already fits, no accessors on plain data, no try/catch that only rethrows, no ceremony the framework or an existing helper already covers. Reuse what the project has before writing anything new.
- **Do not fragment.** A function that reads top to bottom stays whole. Extract a piece only when it has a name in the domain, has two or more real call sites, or mixes responsibilities. Not because the function is long, and not to give every method three lines. A flow the reader must follow across five private methods is harder to maintain than the same flow in one.
- **Fit the project.** Use its layering, naming and patterns even where you would have chosen otherwise. No hidden coupling or global state; name a value whose meaning is not obvious.

## When Applying This Checklist Conflicts With a Written Contract

Contracts win. If `02-architecture.md`'s API/data-model contract, or an approved implementation plan, calls for something that reads as over-engineered by principle 2, follow the contract and flag the tension in the plan's Risks section rather than silently deviating from an already-approved design.
