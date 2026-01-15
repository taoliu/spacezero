# Tickets README

This directory contains **atomic, ordered implementation tickets** for the project.
Tickets represent short-term executable tasks derived from milestones and architecture.

All coding agents must follow the rules in `AGENTS.md` and `docs/architecture.md`.

---

## 1. Ticket philosophy

- One ticket = one focused change set
- Tickets must be **independently reviewable**
- Tickets must have **clear acceptance criteria**
- Prefer small tickets over large ones
- Avoid mixing refactors with feature work unless explicitly stated

Tickets are the **only source of truth** for what should be implemented next.

---

## 2. Ticket naming convention

Tickets must follow this naming scheme:

```

ticket-XXX.md

```

Where `XXX` is a zero-padded incremental number.

Example:
```

ticket-001.md
ticket-012.md
ticket-027.md

```

Do **not** reuse numbers.
Do **not** rename existing tickets.

---

## 3. Ticket structure (required)

Every ticket must use the following template.

### Ticket template

```markdown
# Ticket XXX: <short descriptive title>

## Context
Explain **why** this ticket exists.
Reference:
- architecture sections
- previous tickets
- milestone goals

Avoid restating implementation details here.

## Goal
Describe what this ticket should achieve at a high level.

## Scope
What is explicitly **included**:
- features
- files
- systems

What is explicitly **excluded**:
- future work
- nice-to-haves
- refactors not required for this ticket

## Tasks
Concrete steps the agent should perform.
Use bullet points.
Keep tasks ordered when order matters.

## Acceptance criteria
Clear, testable conditions.
Examples:
- Feature works on mobile browser
- No runtime errors
- Performance does not regress
- System integrates with event bus
- Data validated on load

Acceptance criteria must be verifiable by a human.

## Testing notes
How to manually or programmatically verify:
- steps to test
- debug overlays to enable
- sample data or scenarios

## Affected files (expected)
List files likely to be touched.
This is not binding, but helps review.

## Follow-ups
Optional.
List future tickets or improvements **not** included here.
```

---

## 4. Ticket dependencies

* Tickets are implicitly ordered by number.
* A ticket may depend on earlier tickets.
* Do **not** depend on future tickets.

If a dependency is unclear, clarify it in the **Context** section.

---

## 5. Architecture alignment rules

When implementing a ticket:

* Do not violate ECS boundaries
* Do not add gameplay logic to rendering
* Use event bus instead of direct system calls
* Add tuning parameters to `tuning.ts` or content files
* Update schemas if content format changes

If deviation is necessary:

* Explain it in the ticket PR description
* Propose a follow-up ticket to correct it

---

## 6. Performance requirements

Each ticket must consider:

* allocations in hot paths
* mobile CPU/GPU limits
* entity counts and pooling
* AI tick rates

If performance is impacted, document:

* why
* mitigation
* follow-up actions

---

## 7. Documentation updates

A ticket **must update documentation** if it changes:

* architecture assumptions
* data schemas
* extension points
* tuning parameters

Relevant docs:

* `docs/architecture.md`
* `AGENTS.md`
* content schema comments

---

## 8. When to split a ticket

Split a ticket if:

* it touches multiple systems heavily
* it mixes infrastructure and gameplay
* acceptance criteria become ambiguous
* code review would be large or risky

Smaller tickets are preferred.

---

## 9. Definition of done (ticket-level)

A ticket is complete when:

* acceptance criteria are met
* code follows AGENTS rules
* no obvious performance regressions
* docs updated if needed
* basic testing performed

---

## 10. What tickets are NOT

Tickets are not:

* long-term vision documents
* milestone summaries
* brainstorming notes
* vague feature ideas

Those belong in:

* `docs/architecture.md`
* milestone documents
* design notes

---

## 11. Agent reminder

If anything in a ticket conflicts with:

* `docs/architecture.md`
* `AGENTS.md`

Stop and ask for clarification **before coding**.
