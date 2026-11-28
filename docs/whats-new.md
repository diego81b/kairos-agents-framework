# What's new in v10

Version 10 is about how many questions a run asks you, and about one place to configure it. Three new concepts, one cleanup that breaks old folders, and a few rules that got stricter. If you only read one thing, read the first section.

## Fewer questions, all of them traced

A run used to stop at every gate and on every risk row, and in real runs almost every answer was the option already marked `(Recommended)`. v10 adds an **autonomy dial**: KAIROS takes that recommended option for you when the stakes are low, writes down that it did, and lets you undo it.

| Concept | What it is |
|---------|-----------|
| **Dial** | `autonomy: ask`, `shadow`, `balanced` (default) or `trust`, in `.kairos-cfg/config` or as a phrase in the launch prompt (`ask all`, `trust`) |
| **Attention meter** | a score from the size and risk of the issue, raised by each surprise during the run. While it stays under the dial's limit KAIROS decides low-risk rows itself; past it, it asks |
| **Floor** | what is never decided for you at any value: security findings of medium impact or more, scope and product decisions, anything written outside `.kairos/` or posted to a tracker, irreversible steps, failures, every `critical` row |
| **Drift alarm** | if the work grows past what you approved (a file outside the plan, a dropped criterion, an unannounced contract change), KAIROS stops deciding and asks what to do with the extra work |
| **Revert** | `revert R3` at any gate reopens a row KAIROS decided and asks it normally. A second surprise puts the run back to `ask` |
| **Shadow** | asks exactly as before and logs what `balanced` would have decided, so you can see the saving before you turn it on |

The tracking file gains an `Autonomy` line and an `Auto-decisions` section, and the next gate that asks tells you what was decided for you. The limits are first estimates: small fixes had most rows decided in the first real runs, and a large issue with a contract change asked nearly everything. Full description and every case in [Configuring KAIROS](/customizing#fewer-questions-the-autonomy-dial).

## One configuration file

Everything you can set lives in `.kairos-cfg/config`: the models, the dial, the manual QA answer, the QA plan folder and the related-tests command. One `key: value` per line, committed with the project, written by `/kairos:setup` for the model lines. [Configuring KAIROS](/customizing) now opens with the five things most people want to change, lists every key with the place that wins, and ends with a troubleshooting table.

## A plan that says what each file is

Both implementers' plan tables now carry a `Kind` column (`code` or `test`, the same two values as the files each implementer reports as written) on every file they list. KAIROS counts the production files in a plan to tell whether the work grew past the issue, which is how the drift alarm knows. You do not set it; you will see it when you read a plan.

## Stricter than before

- **A criterion with no test is always asked.** A Test Verifier row that names an `AC-n` with no covering test and no `VERIFICATION` row is never accepted automatically, at any dial value, and no longer by the quick-fix shortcut either. It is the only trace of a criterion nobody verified.
- **Declared obligations are asked too.** A row of medium impact or more on a `SECURITY`, `PRIVACY` or `COMPLIANCE` constraint is not accepted by the quick-fix shortcut any more.
- **Checklists get effort presets.** A saved pipeline checklist with no `Auto-fix` line now takes the auto-fix budget of its effort, like every other path.

## Upgrading from 9.x

- **Old folders do not resume.** A feature folder written before v8.5 (`_recap.md`, `ledger/audit-log.md`, or phase files without `ledger/run.md`) is not resumed: KAIROS prints one line telling you to finish it with 9.10 or remove it.
- **Per-setting files are ignored.** `.kairos-cfg/models`, `.kairos/.models`, `~/.kairos-cfg/models`, `.kairos-cfg/manual-qa` and `.kairos-cfg/qa-dir` are no longer read. Move their lines into `.kairos-cfg/config`. Answers KAIROS asked for itself are still kept in `.kairos/`.
- **The default changes.** A run with no setting now behaves as `balanced`. To keep every question, add `autonomy: ask` to the project config.
- **Nothing else moves.** Artifact names, the phases, the gates you already knew and the agent files keep their names.
