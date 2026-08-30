# ADR-0015: Use a Metric Garden Plan Overview

- Status: Accepted
- Date: 2026-08-30
- Related: [ADR-0013](0013-prioritize-garden-operations-and-ai-planning.md) and [ADR-0014](0014-use-metric-planting-layouts-with-grid-snapping.md)

## Context

Gardeners manage several growing areas at once: raised beds, in-ground zones,
container groups, and greenhouse shelves. Opening one area at a time hides
their relative positions and makes the product feel like a list of separate
records. The home screen should make the garden understandable at a glance and
provide an operational entry point for planning and care.

Each growing area already has an optional metre-based local boundary and plant
allocations. The product needs an outer coordinate system that describes where
those areas sit within the user-managed garden plan. Address maps, parcel
alignment, automatic geometry extraction, and sun analysis still require
validated source data and accuracy boundaries, so they remain deferred.

## Decision

Use a user-arranged, metre-based Garden Plan as the primary home-screen view.

- A garden stores an editable plan width and depth in metres.
- Each growing area stores a plan position and rotation in that shared
  coordinate system.
- The overview renders each area's measured boundary at relative scale,
  including rectangles and future polygon-based in-ground areas.
- Users can drag areas with 0.1 metre grid snapping and retain precise numeric
  controls for position and rotation.
- Selecting an area opens its plant layout and operational details. The home
  screen also shows a compact upcoming-care summary.
- The plan represents the user's managed growing spaces. It does not claim a
  surveyed property boundary or a map-aligned yard model.
- The browser-persisted prototype owns this state until the backend and
  PostgreSQL persistence phase introduces the API and database model.

## Why This Option

- A visual overview gives users an immediate understanding of their whole
  garden and provides a fast route to the right growing area.
- Relative scale preserves practical meaning for bed dimensions, spacing, and
  later rotation planning.
- The design extends the existing metric layout model and React-Konva editor
  without a second canvas dependency or a duplicate spatial format.
- User-controlled placement works with gardens that lack survey documents or
  reliable public parcel data.
- The overview creates a natural home for upcoming care work and future
  reviewable AI planning suggestions.

## Alternatives Considered

### Area List With Separate Detail Pages

The current list supports basic management. It does not show how growing areas
relate to each other, so it cannot provide the at-a-glance workflow requested
for the home screen.

### Satellite Map or Property Boundary as the Primary Canvas

This approach depends on licensed imagery, address coverage, verified parcel
data, scale calibration, and a clear accuracy boundary. It belongs to the
deferred map and sun-intelligence research module.

### Freeform Board Without Measurements

A decorative board would allow quick placement, while removing the dimensions
needed for spacing, rotation planning, and a future backend spatial model.

### AI-Generated Arrangement

An automated arrangement requires dependable plant requirements, constraints,
and user preferences. The manual plan establishes reviewable data and a clear
workflow for a later assistant.

## Consequences

- The garden model gains plan dimensions and per-area position and rotation.
- The home screen becomes a visual operations dashboard with an upcoming-care
  summary.
- Focused tests must cover placement snapping, persistence, selection, and
  navigation into a growing area's layout.
- The first slice allows users to arrange areas freely. Overlap warnings,
  nested zones, surveyed boundaries, and map alignment remain later work.
- Backend schema design must preserve metric units, plan coordinates, local
  area geometry, and rotation values.

## Revisit When

Revisit this decision when user testing requires nested zones, overlap rules,
multiple plan layers, property-boundary imports, collaborative planning,
backend-supported spatial formats, or map-aligned layouts.
