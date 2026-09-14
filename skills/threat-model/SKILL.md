---
description: Design-time threat modelling checklist. Resolves trust boundaries, attack surface, who can reach what, what an attacker controls, and what crossing a boundary costs — before any contract is finalized and before any code exists to review.
---

# Threat Model

Shared reference for `architect-agent`.

This is a checklist for the **design**, not the code. `security-reviewer-agent` reads an implementation and finds exploitable vulnerabilities in it; by then a structural mistake — a boundary drawn in the wrong place, an identity trusted that shouldn't be, a secret that has to travel — can only be reported, not prevented. The questions below are the ones whose answers are cheap now and expensive later.

Work through each section that applies. Every positive answer becomes a row in the architecture artifact's existing `## Risks` table, with the same columns as any other risk, so it flows through the orchestrator's Risk Disposition Loop like the rest. Do not open a parallel findings table.

A section that genuinely doesn't apply is answered `N/A — [reason]`, not skipped silently: a downstream reviewer needs to tell "considered and dismissed" apart from "never asked."

---

## 1. Trust Boundaries

- Where does data cross from a less-trusted zone to a more-trusted one? (Browser → API, API → database, service → third party, tenant → shared infrastructure.)
- What is the *first* component on the trusted side of each boundary, and is it the one performing validation — or does something downstream assume validation already happened?
- Is any boundary crossed more than once for the same request, and does the trust level change each time?

## 2. Attack Surface Added by This Design

- Which new entry points does this design expose: endpoints, queue consumers, webhooks, file uploads, scheduled jobs, admin operations?
- Which are reachable without authentication, and is that deliberate?
- Does the design widen an existing surface — a new field on an existing endpoint, a new role, a new query parameter that reaches the database?

## 3. Identity and Authority

- For each new operation: who is allowed to perform it, and where is that decided?
- Is authority derived from the authenticated identity server-side, or read from the request payload?
- Does any operation act *on behalf of* another identity (impersonation, service account, delegated token)? What bounds that delegation?
- Can a lower-privileged caller reach a higher-privileged effect indirectly — through a queue, a callback, a cascade, or a shared job runner?

## 4. What the Attacker Controls

For each input the design accepts, assume the attacker fully controls it:

- What is the worst value they can supply, and what does the design do with it? (Identifiers pointing at other tenants' rows, oversized payloads, unexpected types, negative or zero quantities, absent fields.)
- Does any input reach an interpreter — SQL, shell, template, deserializer, path resolver, URL fetcher?
- Can the attacker control *how many times* an operation runs, or how expensive one run is?

## 5. Data Crossing the Boundary

- Which data classes travel across each boundary: credentials, tokens, personal data, financial data, internal identifiers?
- Does a response return more than the caller needs, or more than they are entitled to see?
- Where do secrets live in this design, and what has to be true for them not to be logged, cached, or returned?

## 6. Failure and Abuse

- What does the design do when a dependency is slow, down, or lying? Does failing open grant access it shouldn't?
- Is there an operation whose failure leaves partial state that a second attempt can exploit?
- Which actions must leave an audit trail for an incident to be reconstructable, and does the design produce one?

## 7. Blast Radius

- If one component in this design is fully compromised, what else does the attacker reach?
- Does this design create a new place where a single credential, key, or role grants broad access?
- Is there a boundary that would contain the damage, and is it actually enforced or only conventional?
