---
description: Engineering-discipline checklist for writing new code — scope control, anti-overengineering, assumption surfacing, and verifiable success criteria. Applied before and during implementation, distinct from the REFACTOR-time code-simplification checklist.
---

# Coding Discipline

Shared reference for `implementer-tdd-agent`, `implementer-coder-agent`, `implementer-lead-agent`, and the four teammate agents (`teammate-backend-agent`, `teammate-frontend-agent`, `teammate-database-agent`, `teammate-tests-agent`). Applied at the start of implementation, before any file is written — complements [`code-simplification`](../code-simplification/SKILL.md), which applies later, at the REFACTOR step once code already exists.

## Principles

### 1. Scope Discipline

Write the smallest change that satisfies the requirement. Don't rename unrelated identifiers, reformat untouched code, or "improve" a neighboring function while passing through it. A bug fix doesn't need surrounding cleanup; a one-shot operation doesn't need a helper extracted for reuse that doesn't exist yet.

### 2. No Speculative Abstraction

Don't design for a hypothetical future requirement. A config flag, a generic plugin interface, or a strategy pattern needs at least two real call sites today to justify existing — one call site plus a guess about a second one later is not justification. Three similar lines of code are better than a premature abstraction built to avoid them.

### 3. Surface Assumptions

When a requirement is ambiguous, state the assumption being made — in the implementation plan or the output notes, not silently — instead of guessing and moving on without saying so. A wrong assumption that's visible can be corrected in one round-trip; a wrong assumption baked in silently surfaces as a bug report later.

### 4. Verifiable Success Criteria

Before writing code, know how its correctness will be checked: a specific test, a manual run with a concrete expected output, or a log line that proves the path was exercised. Don't declare a task done on the strength of "the code looks right" — if there's no way to verify it, that's a sign the task isn't actually scoped yet.

### 5. Trust Boundaries

Validate input only at system boundaries — user input, external API responses, data crossing a trust boundary. Don't add defensive checks, fallbacks, or error handling for states that are internally guaranteed not to occur (a value this same function just constructed, a parameter every caller already validates). Defensive code for an impossible case doesn't add safety — it adds a second, less-tested path.

## When Applying This Checklist Conflicts With a Written Contract

Contracts win. If `02-architecture.md`'s API/data-model contract, or an approved implementation plan, calls for something that reads as over-engineered by principle 2, follow the contract and flag the tension in the plan's Risks section rather than silently deviating from an already-approved design.
