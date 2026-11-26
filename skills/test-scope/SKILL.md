---
description: How much of the test suite to run at each stop (test files, related tests, or the whole suite), which stage owns the full run, how a targeted run reports coverage, and how to write tests that are cheap to run. Shared by both implementers, the test verifier and the Layered Mode lead.
---

# Test Scope

Shared reference for `implementer-tdd-agent`, `implementer-coder-agent`, `test-verifier-agent` and `implementer-lead-agent`.

A whole suite is the right check once, on settled code. Run at every stop it is the largest cost of a run: a project with a 25 minute suite waited for it three to five times. Pick the cheapest rung that can still catch what you are checking, and say which one you picked.

## 1. The three rungs

1. **Files**: only the test files this change adds or touches (the runner's path or name filter).
2. **Related**: the files above plus the tests that exercise the production files the change touched. Resolve them as in section 3.
3. **Full**: the whole suite, with coverage.

## 2. Who runs the full suite

The full suite has one owner per stage. Everything else runs the files or the related rung.

| Agent | Full | Narrower |
|-------|------|----------|
| `implementer-tdd-agent` | the last planned wave (`wave` equals `total_waves`; a plan with one wave has one) | an earlier planned wave: files. Any other pass (a review loop iteration, a fix pass after the gate, a re-run after Request changes): related |
| `implementer-coder-agent` | only when a trigger below forces it: on this path the Test Verifier owns the full run, so a second one here repeats it | always related (files, when the change adds only tests) |
| Test Verifier | its first run when it has no full run to reuse (the coder path, or a TDD run without a clean `coverage_summary`) and any run with `final_pass: true` | every other recheck: related, over the files the pass wrote, read from the `## Files Written` rows of the latest pass in `03-implementation.md` |
| Layered Mode lead | the `close` of the last planned wave of the first pass (`wave` equals `total_waves`; a plan with one wave has one) | every other `verify` and `close`: related. That covers `verify` of the first pass, an earlier wave's `close`, a fix round, a review loop iteration and a post-gate fix pass |

`code-reviewer-agent` runs no tests, as before.

**Always the full suite, whatever the table says,** when any of these holds:
- the change touches a file no test imports directly: a manifest or lockfile, a build or test configuration (`tsconfig`, `jest.config.*`, `vitest.config.*`, `pytest.ini`, `conftest.py`, `go.mod`), a shared test helper, fixture or setup file, a migration or a schema file;
- the runner has no related selection and you cannot match the tests to the changed files by import or by name;
- `test-changed` is `off` (section 4).

When you cannot tell which rung applies, run the full suite. A wrong narrow run costs a defect that ships; a wrong full run costs minutes.

## 3. Resolving the related rung

Take the first that works:

1. The project's `test-changed` command (section 4), with `{files}` replaced by the changed files, production and test, separated by spaces.
2. The runner's own selection. These come from the runners' documentation and were not run while writing this skill: confirm the first one that matters to you with `--help` before relying on it.

| Runner | Related run |
|--------|-------------|
| Jest | `npx jest --findRelatedTests <files>` |
| Vitest | `npx vitest related <files> --run` |
| pytest | no built-in selection: run the test modules that import or name the changed modules (search for the module name in the test folders) |
| Go | `go test <the packages that contain the changed files>`, plus the packages that import them when an exported identifier changed |
| .NET and others | the touched test files plus the test classes whose name or imports match the changed types |

3. A search of the test folders for the changed module's name, import path or exported names.

A related run that finds **no** test for a changed production file is a result: no test reaches that file. Report it. Never write it as a pass and never widen to the full suite just to hide it.

## 4. The `test-changed` setting

One line in the project's `.kairos-cfg/config`:

```
test-changed: npm test -- --findRelatedTests {files}
```

The value is the project's own command for running the tests related to some files, with `{files}` standing for them, or the word `off`, which makes every stop run the full suite.

Read only the project file, never the home folder, and never ask for it:

```bash
grep -i '^test-changed:' .kairos-cfg/config 2>/dev/null | head -n 1 | sed 's/^[^:]*:[[:space:]]*//; s/[[:space:]]*$//' | tr -d '\r'
```

An empty result means section 3 decides. A value without `{files}` that is not `off` is unusable: say so in one line and fall back to section 3. The orchestrator ignores this key, so you are the reader.

## 5. Coverage on a targeted run

A related run measures part of the code, so its percentages say nothing about the whole. Never judge coverage from one, and never write a partial number into `coverage_summary`.

- `implementer-tdd-agent`: a pass that is not the last planned wave reports no coverage of its own. The last planned wave reports it, as before. `implementer-coder-agent` reports none.
- `implementer-lead-agent`: the same rule. A `verify` or `close` that is not the full run leaves `coverage` out of `tests:` and judges no coverage target; the full run at the last wave's `close` measures it and judges it. A `close` after a fix round writes the numbers of that full run into `03-implementation.md`, marked as carried over.
- Test Verifier: on a targeted run copy `coverage_summary` from the latest full run on record (the newest `05-test-verification*.md`, else `03-implementation.md`), set `execution.scope: targeted`, and write in `## Test Execution` one line naming the file the numbers came from and why this run was narrower. If there is no full run on record, this is a full run, not a targeted one.
- The review loop's final pass is `final_pass: true` and runs full, so what it measures replaces the carried numbers.

## 6. Say what you ran

One line in the report, in the section that already lists the run: `scope: full (last wave of the first pass)`, `scope: related (4 files, jest --findRelatedTests)`, `scope: files (2 test files)`. A reader must be able to tell a narrow run from a full one without opening the log.

## 7. Tests that are cheap to run

Most of a long suite is not the number of tests but how each is written. When you write or change a test:

- **Lowest level that can see the outcome.** A rule about a calculation is a unit test, not a test that starts the application. Use integration only for what crosses a boundary, end-to-end only for what nothing below it can see.
- **Expensive setup once.** Build the application, the database schema or a large fixture once per file or per suite and reset state between tests; never once per test.
- **No real waiting.** No sleep, no real timer, no real network or third-party call. Fake the clock, fake the call, or inject the dependency.
- **Parameterize, do not copy.** One test over a table of inputs, not a copy per input.
- **One behaviour at one level.** The same rule asserted in a unit test, an API test and a UI test costs three runs and protects once.
- **Independent and order-free.** A test that needs another to run first cannot be run alone, and the narrow rungs above depend on running one test alone.

## 8. Is the environment ready to run them

Before a run that needs something outside the code (a database, a service, a container, a port), probe that one thing with the cheapest command that can fail the same way, and run the tests only when it passes. A database the test configuration points at and nothing answers on is not a test result: a full run against it produced 522 failures in 13 minutes in a real run, all one connection error. Name what you probed and what it said. If the probe fails, do not run the suite and do not narrow the run to dodge it: report the missing piece and let a person fix it (`implementer-lead-agent` writes it as a `## Needs Human` row opening with `Environment:`; any other agent says it in its report's notes). Probe once per stage, not per command, and never probe by starting the missing thing yourself.
