# ADR-0014: Use Metric Planting Layouts With Grid Snapping

- Status: Accepted
- Date: 2026-08-29
- Related: [ADR-0006](0006-adopt-employment-oriented-production-stack.md), [ADR-0008](0008-use-metric-reference-grid-and-polygon-yard-boundary.md), and [ADR-0013](0013-prioritize-garden-operations-and-ai-planning.md)

## Context

Garden records need a visual planning view that represents physical growing
space. A gardener needs to see the difference between a 1.2 by 3 metre raised
bed, a container group, and a large in-ground area, then place individual
plants according to practical spacing. A decorative board or equal-sized grid
would hide the dimensions that influence planting decisions.

The core product already uses named growing areas and browser persistence. The
next planning slice should add useful spatial data without requiring a plant
database, an AI layout generator, map data, or the deferred sun-analysis
module.

## Decision

Use a local metre-based planting-layout model and a React-Konva editor with a
visible grid.

- Each growing area can store an optional measured layout in metres.
- The stable layout model uses a closed simple polygon boundary. A dimensioned
  rectangle is represented by four vertices and is the first creation flow for
  raised beds, containers, and greenhouse shelves.
- In-ground areas use the same boundary model. Direct polygon-vertex editing
  remains a later interaction slice after rectangular layout planning is
  usable.
- Each plant placement is a labelled circle with a centre coordinate and an
  allocation diameter in metres. The circle communicates planned growing
  space or spacing, not the plant's current visible canopy.
- Placement movement snaps to a 0.1 metre grid. Numeric fields remain
  available for exact dimensions and allocation diameters.
- The editor keeps placement centres inside their selected growing-area
  boundary and preserves the layout through browser refreshes.
- React-Konva renders the canvas, grid, boundaries, selection, dragging, and
  placement circles. Garden-specific geometry, snapping, validation, and
  persistence remain application-owned TypeScript code.

## Why This Option

- Metre-based dimensions make the visual plan useful for real planting
  decisions and later crop-planning constraints.
- Circle allocations make spacing readable for vegetables, flowers, shrubs,
  and individual in-ground plants without claiming a precise botanical canopy
  model.
- One polygon boundary model supports regular beds and irregular in-ground
  areas while keeping the first interaction focused.
- Grid snapping gives quick direct manipulation and stable values for tests,
  persistence, and future backend APIs.
- React-Konva is already installed for the project's existing spatial editor
  work, so this capability gains a direct Garden Operations use with no new
  canvas dependency.

## Alternatives Considered

### Equal-Sized CSS Grid

An equal-sized grid can display a simple crop calendar. It does not express
real area dimensions or plant spacing, so it cannot support an accurate
physical layout.

### Freeform Visual Board Without Measurements

A freeform board would be quick to create, yet it would give the user no
reliable basis for fitting plants into a bed or comparing areas.

### Automatic AI Layout Generation First

Automated layouts depend on dependable plant requirements, user constraints,
and a reviewable plant-knowledge source. Manual placements establish the
spatial model and user workflow that a future assistant can improve.

### Fixed Rectangular Areas Only

Rectangles cover many raised beds and containers. A single polygon model also
accommodates irregular in-ground areas and avoids a later format migration.

## Consequences

- The Garden Operations model gains measurable area boundaries and plant
  placement records in addition to names and area types.
- The first editor needs focused tests for dimension validation, 0.1 metre
  snapping, boundary containment, persistence, and accessible non-canvas
  controls.
- Plant metadata can later supply suggested allocation diameters while users
  retain direct control over the plan.
- Polygon vertex editing, companion planting rules, automated layouts, map
  alignment, and sun analysis remain separate work.

## Revisit When

Revisit this decision when user testing requires a different snap resolution,
holes or multiple disconnected areas, rotated beds, shared layouts, a
backend-supported spatial format, or a sourced plant-knowledge catalogue with
validated spacing rules.
