---
description: Pre-implementation checklist for API and database contracts. Resolves entity lifecycle, payload shape, ownership/IDOR risk, idempotency, delete behavior, aggregate update semantics, pagination, versioning, and error shape before any contract is finalized.
---

# Contract Checklist

Shared reference for `architect-agent` and `implementer-lead-agent`.

Resolve all applicable questions **before finalizing any API or database contract**. Unanswered questions are silent drift points between phases — document your resolution even when the answer is "not applicable," so downstream agents can verify rather than guess.

---

## 1. Entity Lifecycle

- Does this entity exist independently, or only as a child of a parent?
- Can it be created without a parent reference?
- What happens on parent deletion: cascade delete, orphan (set null), or block?
- Who creates the entity — only through a parent endpoint, or via a dedicated child endpoint?

## 2. Payload Shape for Master-Detail

- Does the UI edit the parent and its children in one form submission, or independently?
  - One form → nested payload (children array inside the parent body) is natural.
  - Independent management → separate child endpoints are correct.
- If a parent update endpoint accepts child mutations in the same payload, what are the semantics: replace-all, or explicit add/update/delete per child?
- Decision depends on the interaction model — resolve before defining the endpoint.

## 3. Ownership and IDOR Risk

- Which field establishes ownership (e.g. `user_id`, `org_id`, `tenant_id`)?
- On write operations: is ownership enforced server-side from the authenticated identity, or trusted from the payload?
- On nested updates: can the payload change a child's owning parent?
  - A PUT on parent A containing a child currently owned by parent B is an IDOR vector — explicit defense required.
- On bulk or indirect updates: are all child records re-verified to belong to the same owner as the parent before mutation?

## 4. Idempotency and Retry Behavior

- Is this endpoint safe to retry (idempotent)?
- If yes, how is idempotency enforced: idempotency-key header, dedup by business key, or upsert semantics?
- What is the response on a duplicate submission: 200 with the original result, 409 Conflict, or 204 No Content?

## 5. Delete Behavior

- Soft delete (flag + timestamp) or hard delete?
- On soft delete: are soft-deleted records excluded from list and get queries by default?
- On hard delete: which FK constraints cascade? Which block deletion?
- Are cascades explicit in migrations, or enforced in application code?

## 6. Aggregate Update Diff

When a payload updates a collection (e.g. children array inside a parent PUT):

- **Existing children**: carry their `id` field.
- **New children**: no `id` (server assigns on creation).
- **Deleted children**: omitted from the array (replace-all semantics) OR included with `_destroy: true` (explicit delete semantics).

Which semantics does this contract use? **Document it explicitly.** If IDs are absent on existing children, the server cannot distinguish an update from a delete + recreate — this must be resolved before implementation begins.

## 7. Pagination, Filter, and Sort

- Maximum page size? Default page size?
- Which fields are filterable? Any requiring a database index to be viable?
- Which fields are sortable? Default sort order and direction?
- Cursor-based or offset-based pagination?

## 8. Versioning

- Is this endpoint versioned (e.g. `/v1/`, `/v2/`)?
- If extending an existing versioned API: does the addition belong to the current version or require a new version?
- What is the deprecation policy for the version being extended?

## 9. Error Response Shape

- What is the exact JSON shape for all error responses?
- Are validation errors per-field (`[{ field, message }]`) or a single aggregate message?
- What is the error-code vocabulary: string codes (e.g. `validation_error`) or numeric?
- Does the response body structure differ between 4xx client errors and 5xx server errors?
