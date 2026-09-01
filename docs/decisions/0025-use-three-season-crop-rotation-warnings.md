# ADR-0025: Use Three-Season Crop Rotation Warnings

- Status: Accepted
- Date: 2026-09-01
- Related: [ADR-0013](0013-prioritize-garden-operations-and-ai-planning.md),
  [ADR-0016](0016-separate-planting-records-from-layout-allocations.md), and
  [ADR-0024](0024-use-explicit-local-garden-import-for-postgresql.md)

## Context

The Garden Operations workflow records a planting's growing area, controlled
crop family, planting date, and active status. The persisted planting history
can now support a useful planning workflow without relying on an external
plant catalogue or an AI recommendation.

Users need to understand when a planned crop repeats a recent crop family in
the same planting area. The first rule set must be simple enough to explain,
test, and revise as the product gains crop-specific knowledge.

## Decision

Use a deterministic three-season crop rotation check.

- A planting date's calendar year identifies its growing season.
- When a user adds or edits a planting, inspect the same growing area's three
  preceding calendar years.
- A matching crop family creates a visible warning that identifies the prior
  plantings and seasons.
- Warnings inform the user and never block saving a planting.
- `Other or unknown` receives no automatic compatibility conclusion.
- Raised beds and in-ground areas receive rotation warnings in the first
  release.
- Container groups and greenhouse shelves show their planting history without
  an automated warning.
- The interface lists crop families absent from the preceding three seasons as
  rotation-friendly family candidates. It does not claim crop-level
  suitability.

The application backend owns the rotation evaluation and exposes a validated
API response. The frontend renders the result while the user reviews a
planting. Tests cover the domain rules and API behavior.

## Why This Option

- Existing structured planting data supplies the inputs without adding a
  catalogue, paid service, or migration.
- Three seasons give users a memorable default and create a bounded,
  deterministic rule set for testing.
- A warning preserves gardener judgment for succession planting, limited
  space, and personal growing practices.
- Limiting automated warnings to raised beds and in-ground areas matches the
  initial focus on soil-based rotation decisions. Containers and greenhouse
  shelves can have different soil replacement practices.
- Backend-owned rules create a clear full-stack domain boundary that is useful
  in interviews and supports future planning workflows.

## Alternatives Considered

### Use a Four-Year Rule

Four-year rotations can suit particular crops and disease risks. The current
product has no crop-level knowledge base or regional disease model to justify a
more prescriptive default.

### Block Conflicting Plantings

Gardeners may intentionally repeat a crop because of succession timing,
available space, container media, or personal priorities. An advisory result
keeps the workflow practical.

### Evaluate Every Growing-Area Type Identically

Containers and greenhouse shelves can be managed with replacement growing
media. Their history remains visible while the first release focuses warnings
on soil-based growing areas.

### Add AI Recommendations First

AI planning needs explicit constraints and dependable source data. Deterministic
rotation warnings establish the reliable planning layer for later AI-assisted
explanations.

## Consequences

- A user can see recent crop-family repetition before saving a planting.
- The backend gains a focused planning endpoint and pure domain-rule tests.
- The first release provides family-level guidance rather than botanical,
  regional, pest, or disease-specific advice.
- Users can still create a planting after receiving a warning.
- Later planning features can add crop-specific intervals, climate data,
  amendment history, and reviewable AI explanations.

## Revisit When

Revisit this decision when the product adds a curated plant catalogue,
regional growing guidance, disease history, user-configurable rotation
policies, container soil-replacement records, or evidence that a different
season window produces better recommendations.
