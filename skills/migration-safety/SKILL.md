---
description: Safety checklist for schema and data migrations. Resolves expand/contract sequencing, lock duration, backfill restartability, reversibility, and what a code rollback does to data already written in the new shape — before the migration is designed and again before the rollback plan is written.
---

# Migration Safety

Shared reference for `architect-agent` and `release-planner-agent`.

A migration is the one change that a code rollback cannot undo. Reverting a deploy restores the previous binary; it does not restore a dropped column, un-rewrite a backfilled row, or release a lock that already blocked production for four minutes. These questions are cheap while the data model is still on paper, and they are the difference between a rollback plan that works and one that reads well.

Invoked conditionally: when the design does not change the schema and writes no data migration, this costs nothing. Answer the applicable sections and record each resolution — `N/A — [reason]` included — so the deployment runbook can cite them rather than re-derive them.

---

## 1. Shape of the Change

- Is this change **additive** (new table, new nullable column, new index), **destructive** (drop, rename, narrow a type, add NOT NULL), or a **rewrite** (backfill, re-encode, re-partition)?
- A destructive change to a column the currently-deployed code still reads or writes is an outage, not a migration. Which currently-running code touches it?

## 2. Expand / Contract Sequencing

For anything not purely additive, the safe shape is three releases, not one:

- **Expand** — add the new structure alongside the old; new code writes both, reads the old.
- **Migrate** — backfill; flip reads to the new structure.
- **Contract** — stop writing the old; drop it, in a later release.

Questions to resolve:
- Which of the three does *this* change perform? Naming it prevents a contract step from riding along with an expand step.
- During the window when both old and new code are running (rolling deploy, canary, a straggler pod), is every combination safe — old code reading new-shaped data, new code reading not-yet-backfilled data?
- Can the contract step be deferred to a separate release, and is it tracked somewhere that it will actually happen?

## 3. Lock Duration and Table Size

- Roughly how many rows does the target table hold **in production**, not in development?
- Which statements in this migration take a lock that blocks reads or writes, and for how long at that row count? (Adding a NOT NULL column with a default, rewriting a type, and building an index without the concurrent variant are the usual offenders — the exact behaviour is engine- and version-specific, so state which engine you are assuming.)
- Is there a lock timeout and a retry, so a migration that cannot acquire its lock fails fast instead of queueing every query behind it?
- Does the deployment have a maintenance window, or must this run against live traffic?

## 4. Backfill

- Is the backfill **batched**, with a bounded batch size — or a single statement over the whole table?
- Is it **idempotent**: does re-running it over rows it already processed produce the same result?
- Is it **restartable**: if it dies at 60%, does the next run resume rather than start over?
- Does it write at a rate the replicas can follow, or will it build replication lag?
- Is the backfill part of the migration transaction, or a separate job? (Coupling a long backfill to the schema change usually means holding a lock for its whole duration.)

## 5. Reversibility

- Is there a `down` migration, and has it actually been run against a copy of production-shaped data — or does it merely exist?
- Is this change reversible **without data loss**? A dropped column is not; a renamed one is only if nothing wrote to it in between.
- If it is not reversible, say so explicitly in the runbook. A rollback plan that implies reversibility it doesn't have is worse than one that states the limit.

## 6. What a Code Rollback Does to New-Shaped Data

The question most often missed. After the migration ran and the application wrote records in the new shape:

- If the application is rolled back to the previous version, what does the old code do with those records — ignore them, crash, or silently corrupt them?
- Are records written during the window recoverable, or are they lost to the old code's view?
- Is the correct recovery "roll forward with a fix" rather than "roll back"? If so, the runbook should say that instead of listing a rollback that must not be used.

## 7. Ordering Against the Code Deploy

- Does the migration run **before** the code deploy, **after** it, or between two code deploys?
- Is that ordering enforced by the pipeline, or by whoever runs it remembering the right sequence?
- If the migration succeeds and the code deploy then fails, what state is the system in — and is that state serviceable?
