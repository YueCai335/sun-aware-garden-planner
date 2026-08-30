# ADR-0008: Use a Metric Reference Grid and Polygon Yard Boundary

- Status: Accepted
- Date: 2026-08-29
- Supersedes: [ADR-0007](0007-use-metric-yard-coordinates-and-react-konva-editor.md)

## Context

Real residential yards can be rectangular, L-shaped, wedge-shaped, curved, or
otherwise irregular. A rectangular yard model would exclude valid properties
and make the eventual heatmap inaccurate at the edge of the usable area.

The project still needs a stable local coordinate system in metres for object
dimensions, obstacle heights, direct manipulation, and deterministic solar
geometry. The browser editor also needs established support for selection,
dragging, resizing, and an image layer.

## Decision

Use a metric reference grid, a simple polygon for the yard boundary, and a
React-Konva editing layer.

- A project records a reference-grid width and depth in metres. The grid is the
  local coordinate plane for the drawing workspace.
- A yard boundary is a closed, simple polygon whose vertices use metre-based
  coordinates within that grid. New projects start with a rectangular boundary
  that a user can reshape.
- The V2 editor requires at least three boundary vertices and rejects
  self-intersecting polygons. Curves, holes, and multiple separate boundaries
  remain outside V2.
- Yard objects use metre-based position, width, and depth. Houses, trees, and
  fences also record obstacle height in metres.
- A project records `northBearingDegrees`: the clockwise angle from the top of
  the editor to true north. A visible compass communicates this orientation.
- React-Konva renders the editable boundary and objects, direct movement,
  corner resize handles, and a selected-object deletion control. Numeric fields
  remain available for exact values.
- Future heatmap results are calculated and displayed only inside the yard
  boundary. Obstacles can remain in the broader reference grid so nearby
  structures can cast shadows into the yard.

## Why This Option

- The polygon follows the physical yard instead of forcing every property into
  a rectangular outline.
- The reference grid gives every vertex and object a stable metric position.
- This local model works before the project adds aerial imagery and can later
  align with a calibrated image.
- A simple polygon covers common residential boundaries while keeping V2
  focused and testable.
- React-Konva supplies well-supported editing primitives while the project
  keeps ownership of garden-specific geometry, validation, persistence, and
  solar calculations.

## Alternatives Considered

### Rectangular Yard Boundary

A rectangle is quick to implement and remains the default starting shape. It
does not represent many real properties and would force a later storage and
solar-model migration.

### Full CAD Geometry in V2

Curves, holes, multiple polygons, geometric constraints, and CAD-style tools
would expand the editor far beyond the requirements for a useful sun-planning
workflow.

### Geographic Map Coordinates Immediately

Map coordinates and a GIS editor become useful when the product adds map tiles,
geocoding, and GeoJSON persistence. The current workflow needs a property-scale
local metric plane with minimal setup.

### Reuse an Existing Garden Planning Application

Existing garden planners provide useful product research. This project will
independently implement its web application and will not reuse GPL-licensed
source code, assets, or product identity.

## Consequences

- Local saved projects require a versioned migration from the initial editor
  format to a metric reference grid and boundary polygon.
- The editor needs focused tests for polygon validation, vertex editing, object
  bounds, measurement display, persistence, and compass state.
- The solar module gains an explicit polygon for clipping sampled sun-hours and
  an explicit north bearing for rotating solar azimuths into yard coordinates.
- The first V2 interaction layer remains intentionally smaller than a general
  CAD application.

## Revisit When

Reconsider the boundary model when users need holes, multiple disconnected
areas, curved legal property lines, collaboration, or a map-backed GeoJSON
workflow.
