---
description: Refactoring checklist for simplifying code without changing behavior. Resolves what to simplify, how to verify behavior is preserved, and when to stop — for the REFACTOR step of implementation.
---

# Code Simplification

> Inspired by the [Claude Code Simplifier plugin](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/code-simplifier/agents/code-simplifier.md). Adapted here as a stack-agnostic, process-driven skill.

Shared reference for `implementer-tdd-agent` and `implementer-coder-agent`'s REFACTOR step.

Simplify code by reducing complexity while preserving exact behavior. The goal is not fewer lines — it's code that is easier to read, understand, modify, and debug. Every simplification must pass one test: would a new team member understand this faster than the original?

## When to Use

- The REFACTOR step of implementation, once tests are green (or, on the no-test-suite path, once the implementation is functionally complete)
- Code review flags readability or complexity issues
- Deeply nested logic, long functions, or unclear names surface during implementation

**When NOT to use:**

- Code is already clean — don't simplify for the sake of it
- You don't yet understand what the code does — comprehend before you simplify
- The code is performance-critical and the simpler version would be measurably slower

## The Five Principles

### 1. Preserve Behavior Exactly

Don't change what the code does — only how it expresses it. All inputs, outputs, side effects, error behavior, and edge cases must remain identical.

```
ASK BEFORE EVERY CHANGE:
- Does this produce the same output for every input?
- Does this maintain the same error behavior?
- Does this preserve the same side effects and ordering?
- Do all existing tests still pass without modification?
```

### 2. Follow Project Conventions

Simplification means making code more consistent with the codebase, not imposing external preferences. Before simplifying, read the project's own conventions and study how neighboring code handles similar patterns — import style, function declaration style, naming, error handling, type-annotation depth. Simplification that breaks project consistency is churn, not simplification.

### 3. Prefer Clarity Over Cleverness

Explicit code beats compact code when the compact version requires a mental pause to parse.

```
UNCLEAR: dense ternary chain
  const label = isNew ? 'New' : isUpdated ? 'Updated' : isArchived ? 'Archived' : 'Active'

CLEAR: readable branches
  function getStatusLabel(item) {
    if (item.isNew) return 'New'
    if (item.isUpdated) return 'Updated'
    if (item.isArchived) return 'Archived'
    return 'Active'
  }
```

### 4. Maintain Balance

Over-simplification is a real failure mode. Watch for:

- Inlining too aggressively — removing a helper that gave a concept a name makes the call site harder to read
- Combining unrelated logic — two simple functions merged into one complex function is not simpler
- Removing an abstraction that exists for extensibility or testability, not complexity
- Optimizing for line count instead of comprehension speed

### 5. Scope to What Changed

Default to simplifying recently modified code. Avoid drive-by refactors of unrelated code unless explicitly asked to broaden scope — unscoped simplification creates noise in diffs and risks unintended regressions.

## The Simplification Process

### Step 1: Understand Before Touching (Chesterton's Fence)

Before changing or removing anything, understand why it exists — if you don't understand it, you're not ready to simplify it.

```
BEFORE SIMPLIFYING, ANSWER:
- What is this code's responsibility? What calls it, what does it call?
- What are the edge cases and error paths?
- Do tests define the expected behavior?
- Why might it have been written this way — performance, platform constraint, historical reason?
```

### Step 2: Identify Simplification Opportunities

**Structural complexity:**

| Pattern | Signal | Simplification |
|---------|--------|----------------|
| Deep nesting (3+ levels) | Hard to follow control flow | Extract conditions into guard clauses — e.g. `if (data === null) throw ...; if (!data.isValid()) throw ...;` instead of nested `if/else` |
| Long functions (50+ lines) | Multiple responsibilities | Split into focused functions with descriptive names |
| Nested ternaries | Requires a mental stack to parse | Replace with if/else chains, switch, or a lookup |
| Boolean parameter flags | `doThing(true, false, true)` | Replace with an options object or separate functions |
| Repeated conditionals | Same `if` check in multiple places | Extract to a well-named predicate function |

**Naming and readability:**

| Pattern | Signal | Simplification |
|---------|--------|----------------|
| Generic names | `data`, `result`, `temp`, `val` | Rename to describe the content |
| Misleading names | A `get` function that also mutates state | Rename to reflect actual behavior |
| Comments explaining "what" | `// increment counter` above `count++` | Delete — the code is clear enough |
| Comments explaining "why" | `// retry because the API is flaky under load` | Keep — this carries intent the code can't express |

**Redundancy:**

| Pattern | Signal | Simplification |
|---------|--------|----------------|
| Duplicated logic | Same 5+ lines in multiple places | Extract to a shared function |
| Dead code | Unreachable branches, unused variables | Remove, after confirming it's truly dead |
| Unnecessary abstraction | A wrapper that adds no value | Inline it, call the underlying function directly |
| Over-engineered pattern | Factory-for-a-factory, strategy-with-one-strategy | Replace with the direct approach |

### Step 3: Apply Changes Incrementally

Make one simplification at a time; treat each as its own verified step inside the REFACTOR step, not bundled with feature or bug-fix changes in the same edit.

- **Test-suite path** (`implementer-tdd-agent`): re-run tests after every change. Tests fail → revert and reconsider.
- **No-test-suite path** (`implementer-coder-agent`): re-read the diff for behavior equivalence after every change — there is no test suite to catch a regression, so each change must be individually small enough to verify by inspection.

If a simplification would touch more than ~500 lines, that's a signal to reconsider scope rather than push through by hand.

### Step 4: Verify the Result

Compare before and after: is the simplified version genuinely easier to understand? Did it introduce any pattern inconsistent with the codebase? Would a teammate approve this change? If the "simplified" version is harder to follow, revert — not every attempt succeeds.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It's working, no need to touch it" | Working code that's hard to read will be hard to fix when it breaks. |
| "Fewer lines is always simpler" | A 1-line nested ternary is not simpler than a 5-line if/else. Simplicity is comprehension speed, not line count. |
| "I'll just quickly simplify this unrelated code too" | Unscoped simplification creates noisy diffs and risks regressions in code you weren't asked to touch. |
| "This abstraction might be useful later" | Don't preserve speculative abstractions. Remove it now, re-add when actually needed. |
| "The original author must have had a reason" | Maybe — check history and apply Chesterton's Fence. But accumulated complexity is often just iteration residue, not a reason. |

## Red Flags

- Simplification that requires modifying tests to pass — behavior likely changed
- "Simplified" code that is longer and harder to follow than the original
- Renaming to match personal preference rather than project convention
- Removing error handling because "it makes the code cleaner"
- Simplifying code you don't fully understand
- Batching many unrelated simplifications into one hard-to-review change

## Verification

- [ ] All existing tests pass without modification (test-suite path only — N/A on the no-test-suite path)
- [ ] No error handling was removed or weakened
- [ ] No dead code left behind (unused imports, unreachable branches)
- [ ] Simplified code follows project conventions
- [ ] The diff is clean — no unrelated changes mixed in
