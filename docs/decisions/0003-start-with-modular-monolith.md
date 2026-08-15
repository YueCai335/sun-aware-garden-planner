# ADR-0003: Start with a Modular Monolith

- Status: Accepted
- Date: 2026-08-15

## Context

The long-term product includes sun analysis, garden planning, journaling, crop
rotation, community listings, and an AI assistant. These domains need clear
boundaries, but the project currently has one developer, no production traffic,
and no independent scaling evidence.

## Decision

Build one frontend and one backend deployment with domain-oriented internal
modules and explicit interfaces.

## Why This Option

- It preserves understandable boundaries without adding distributed-system
  operations before they solve a real problem.
- Transactions, local development, testing, and deployment remain manageable.
- A module can later be extracted if measurements show an independent scaling
  or reliability need.

## Alternatives Not Selected

### Microservices

Microservices would add service discovery, network failures, distributed
tracing, deployment coordination, and cross-service data ownership. There is no
current load or team structure that justifies those costs.

### Unstructured Monolith

Putting all routes and logic together would be initially fast but would make the
growing product difficult to test and explain. The monolith must still enforce
domain boundaries.

## Consequences

- Modules share a deployment and may share a database while maintaining schema
  ownership conventions.
- Boundaries require discipline and tests because the network does not enforce
  them.
- Future extraction remains possible but is not promised prematurely.

## Revisit When

Consider extracting a module only when it has a measured independent scaling,
security, reliability, release-cadence, or team-ownership requirement.
