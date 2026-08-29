# ADR-0007: Use Metric Yard Coordinates and a React-Konva Editor

- Status: Accepted
- Date: 2026-08-29

## Context

The Phase 1 yard editor needs to collect inputs for a deterministic sun and
shadow model. Relative screen percentages cannot express the physical size of
the yard, an obstacle footprint, or its relationship to cardinal direction.
The first editor also requires direct manipulation that lets a user select,
move, resize, and remove objects without relying on numeric fields for every
change.

The project is a Next.js and React web application that may become a public
product. It needs an editor foundation with a permissive license, stable React
support, and a small enough scope to remain focused on sun-aware garden
planning.

## Decision

Use a yard-local metric coordinate system and React-Konva for the editable
browser layer.

- A yard project records its width and depth in metres.
- Every yard object records position, width, and depth in metres. Houses,
  trees, and fences also record obstacle height in metres.
- A project records `northBearingDegrees`: the clockwise angle from the top of
  the editor to true north. A visible compass communicates this orientation.
- React-Konva renders editable geometry, a selected-object deletion control,
  direct drag movement, and corner resize handles. Numeric fields remain for
  exact values.
- Object rotation, CAD constraints, multi-selection, snapping, and GIS map
  editing remain outside this feature.
- A future aerial-image layer and raster heatmap layer may render below or
  above the editable objects without changing the domain coordinate system.

## Why This Option

- Metres and north bearing provide the inputs required by solar geometry and
  shadow projection.
- A single physical model supports rendering at any screen size, accurate
  labels, future image calibration, and later backend persistence.
- Konva provides maintained canvas primitives, pointer handling, selection,
  drag behavior, and transformation controls through the MIT-licensed React
  integration.
- The product keeps ownership of its garden model, validation, persistence,
  solar calculations, and user workflow instead of inheriting a full planning
  application.

## Alternatives Considered

### Keep Relative Percentages and Numeric Fields

This keeps the first implementation small but leaves the sun model without
physical units and makes visual editing difficult to use.

### Build Custom SVG Selection and Resize Behavior

SVG can represent the shapes clearly. A custom implementation would require
the project to maintain pointer capture, hit testing, resize handles, bounds,
and touch behavior before those mechanisms add garden-specific value.

### Use Fabric.js

Fabric.js provides a capable object model and transformation controls. Its
imperative canvas lifecycle and broader editor surface add more abstraction
than the current rectangle, ellipse, image, and heatmap workflow requires.

### Use a GIS Editor Immediately

Leaflet-Geoman and MapLibre editing tools are appropriate after the product
uses geographic map tiles and GeoJSON. The current manual yard workspace needs
metres within one bounded property, not a full geographic map stack.

### Reuse an Open-Source Garden Planner

Open Garden Planner offers useful product research, but it is a GPL-3.0
Python desktop application. This project will independently implement its web
product and will not reuse its source code, assets, or product identity.

## Consequences

- The existing local project format requires a versioned migration from
  percentage coordinates to metric coordinates.
- The editor gains `konva` and `react-konva` dependencies and focused tests for
  coordinate conversion, bounds, direct movement, resize, deletion, local
  restore, and compass persistence.
- The React-Konva editor is client-side interaction code. Server-rendered pages
  keep product metadata and non-editor UI outside this rendering boundary.
- Future shadow calculations can consume metric dimensions and north bearing
  directly.

## Revisit When

Reconsider the editing engine when a real map workflow requires geographic
coordinates, many complex polygons, collaborative editing, or performance
measurements show that the selected layer cannot meet product needs.
