# ADR-0026: Use a Next-Season Planning Workspace for Crop Rotation

- Status: Superseded by ADR-0039
- Date: 2026-09-01
- Related: [ADR-0025](0025-use-three-season-crop-rotation-warnings.md)

## Context

Crop rotation is commonly reviewed at the start of a growing season. The
planting-area editor remains the correct place to maintain plant records and
layout details, while season-level decisions require a view across the
workspace's gardens and growing areas.

The existing rotation endpoint already provides the prior three seasons,
family-level warnings, and rotation-friendly family candidates for each area.

## Decision

Provide a `Plan next season` action on the Garden Hub. It opens a dedicated
`Next season planner` workspace for all gardens.

- The planner starts with all gardens and supports a garden filter.
- The current version uses May 20 of the next calendar year as the planning
  date that identifies the next growing season.
- The planner presents each growing area with its recent planting history.
- Raised beds and in-ground areas support a planned crop-family selection,
  advisory warnings, and family-level rotation candidates.
- Containers and greenhouse shelves present their history without automated
  rotation guidance.
- A planner action opens the selected growing area's plant-record form and
  carries the selected crop family into that form.
- The plant-record form keeps a short advisory message when a user records a
  crop family that repeats recent history.
- The planner requires PostgreSQL-backed garden data. Browser-only workspaces
  receive a clear import prompt.

## Why This Option

- Seasonal planning becomes discoverable from the dashboard at the moment it
  is useful.
- The garden-level view allows users to compare each planting area without
  opening them individually.
- Plant records remain available for day-to-day maintenance and corrections.
- The existing deterministic backend contract supports both planning and save
  flows without a new data model or external service.

## Alternatives Considered

### Keep Full Rotation Guidance Inside Every Plant Form

Detailed history, alternatives, and selection controls add substantial visual
weight to a form used for routine record keeping.

### Plan the Current Season

The Garden Hub is a concise operational starting point. A next-season planning
entry point matches the annual rotation workflow and keeps day-to-day garden
editing focused on current records.

### Generate Crop-Level Plans with AI

The current project has no curated crop catalogue, regional constraints, or
evaluation set to support reliable crop-specific guidance. Family-level rules
remain the decision source for this phase.

## Consequences

- The Garden Hub gains a high-value seasonal planning entry point.
- The frontend adds a focused planner view while the backend rotation API stays
  stable.
- Rotation results continue to inform users without blocking plant records.
- Future AI planning can use this workspace after the project has catalogued
  plant data, regional context, and evaluation cases.

## Revisit When

Revisit when the product supports multiple active seasonal plans, a curated
crop catalogue, regional growing calendars, disease history, or reviewable AI
recommendations.
