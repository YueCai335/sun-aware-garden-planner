# ADR-0001: Use Next.js and TypeScript for the Web Frontend

- Status: Accepted
- Date: 2026-06-03

## Context

The product needs an interactive annotation interface now and may later need
authenticated pages, server-side integration, image handling, and public
deployment. The frontend should also demonstrate a current, broadly useful web
stack without requiring unnecessary framework assembly.

## Decision

Use Next.js with React and TypeScript.

## Why This Option

- Next.js keeps React while providing routing, build conventions, server
  capabilities, and a clear deployment path in one maintained framework.
- TypeScript gives explicit contracts for yard objects, geometry, API payloads,
  and analysis results.
- The stack supports both the canvas-heavy MVP and later full-stack workflows.

## Alternatives Not Selected

### React with Vite

This would be a good choice for a client-only application, but routing,
server-side features, deployment conventions, and backend integration would
require more separate decisions. It remains a valid fallback if Next.js creates
measurable constraints for the annotation workspace.

### JavaScript Without TypeScript

It would reduce initial syntax, but geometry and API contracts are central to
this product. The reduced setup does not outweigh weaker compile-time checks as
the data model grows.

## Consequences

- The project gains a conventional structure and shared frontend types.
- The developer must understand React concepts as well as Next.js boundaries.
- Features should not use server rendering merely because the framework offers
  it; the annotation canvas will remain primarily client-side.

## Revisit When

Reconsider only if profiling or platform constraints show that Next.js blocks a
core workflow, or if the product becomes a native-first mobile application.
