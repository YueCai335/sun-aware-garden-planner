# Architecture Decision Records

This directory records important product and engineering decisions so they can
be explained, challenged, and revisited.

## What Must Be Recorded

Create or update a decision record when a choice materially affects:

- Product scope or user workflow.
- Architecture or module boundaries.
- Data ownership, persistence, privacy, or security.
- Accuracy, reliability, or explainability.
- External services, licensing, cost, or deployment.
- A technology that an interviewer may reasonably ask about.

Small implementation details remain in code, tests, issues, and commit history.
Recording every variable name or visual adjustment here would hide the
decisions that matter.

## Required Content

Each record must state:

1. The context and constraints.
2. The selected option.
3. Why it was selected.
4. Which alternatives were considered and why they were not selected.
5. Positive and negative consequences.
6. Conditions that would justify revisiting the decision.

Do not rewrite an accepted record to make history look cleaner. If a decision
changes, mark the old record as superseded and add a new record.

## Status Values

- `Proposed`: under discussion and not authorized for implementation.
- `Accepted`: current direction.
- `Superseded`: replaced by a newer record.
- `Rejected`: evaluated but not selected.

## Decision Index

| ID | Decision | Status |
| --- | --- | --- |
| [ADR-0001](0001-use-nextjs-and-typescript.md) | Use Next.js and TypeScript for the web frontend | Accepted |
| [ADR-0002](0002-use-fastapi-python-backend.md) | Use FastAPI for the application backend | Accepted for backend phase |
| [ADR-0003](0003-start-with-modular-monolith.md) | Start with a modular monolith | Accepted |
| [ADR-0004](0004-keep-physics-deterministic.md) | Keep solar physics deterministic and constrain AI | Accepted |
| [ADR-0005](0005-use-hybrid-sun-analysis.md) | Combine an aerial yard model with panoramic calibration | Superseded |
| [ADR-0006](0006-adopt-employment-oriented-production-stack.md) | Adopt an employment-oriented production stack | Accepted |
| [ADR-0007](0007-use-metric-yard-coordinates-and-react-konva-editor.md) | Use metric yard coordinates and a React-Konva editor | Superseded |
| [ADR-0008](0008-use-metric-reference-grid-and-polygon-yard-boundary.md) | Use a metric reference grid and polygon yard boundary | Accepted |
| [ADR-0009](0009-use-address-guided-map-initialization-and-point-sky-calibration.md) | Use address-guided map initialization and point sky calibration | Accepted |
| [ADR-0010](0010-use-mapbox-for-address-guided-map-initialization.md) | Use Mapbox for address-guided map initialization | Accepted |
| [ADR-0011](0011-pin-secure-postcss-for-nextjs-15.md) | Pin secure PostCSS for Next.js 15 | Accepted |
| [ADR-0012](0012-use-address-first-parcel-candidates-with-user-confirmation.md) | Use address-first parcel candidates with user confirmation | Accepted |
| [ADR-0013](0013-prioritize-garden-operations-and-ai-planning.md) | Prioritize garden operations and AI planning | Accepted |
| [ADR-0014](0014-use-metric-planting-layouts-with-grid-snapping.md) | Use metric planting layouts with grid snapping | Accepted |
| [ADR-0015](0015-use-a-metric-garden-plan-overview.md) | Use a metric garden plan overview | Superseded by ADR-0017 |
| [ADR-0016](0016-separate-planting-records-from-layout-allocations.md) | Separate planting records from layout allocations | Accepted |
| [ADR-0017](0017-use-a-multi-garden-home-and-management-workspace.md) | Use a visual multi-garden home and dedicated management workspace | Superseded by ADR-0018 |
| [ADR-0018](0018-use-a-multi-garden-thumbnail-dashboard.md) | Use a multi-garden thumbnail dashboard and selected-garden operations | Accepted |
| [ADR-0019](0019-use-targeted-care-events-for-watering-and-fertilizing.md) | Use targeted care events for watering and fertilizing | Accepted |

## Interview Use

These records are evidence of engineering judgment. Interview answers should
describe the constraint, tradeoff, selected option, downside, and trigger for
reconsideration rather than claiming one technology is always best.
