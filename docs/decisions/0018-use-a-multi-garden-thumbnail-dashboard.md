# ADR-0018: Use a Multi-Garden Thumbnail Dashboard and Selected-Garden Operations

- Status: Accepted
- Date: 2026-08-30
- Related: [ADR-0013](0013-prioritize-garden-operations-and-ai-planning.md), [ADR-0016](0016-separate-planting-records-from-layout-allocations.md), and [ADR-0017](0017-use-a-multi-garden-home-and-management-workspace.md)

## Context

The multi-garden model supports independent gardens such as a home garden and
a community plot. The first management workspace exposed a selected-garden
dropdown and a large metric Garden Plan on the home screen. This makes users
switch context before they can compare their gardens and consumes home-screen
space with design-editor detail.

The home screen needs fast visual recognition and prominent access to frequent
garden operations. Exact dimensions, coordinate grids, area names, and plant
labels serve editing workflows, while they make a dashboard thumbnail harder
to scan.

## Decision

Use a multi-garden thumbnail dashboard as the default home screen.

- The dashboard renders every garden as a responsive visual thumbnail card.
- A thumbnail shows planting-area shapes and layout allocation circles. It
  omits the metre grid, coordinate labels, and individual allocation labels.
- A user selects a garden by clicking its thumbnail card. The selected state
  remains stored in the workspace and provides the target for garden actions.
- The dashboard presents prominent actions for the selected garden: Planting
  Records and Garden Management.
- Planting Records opens the selected garden's planting workflow. A planting
  record stays linked to a planting area within that garden.
- Garden Management retains the full metric plan, dimensions, coordinates,
  planting-area management, and layout editing tools.

## Why This Option

- Multiple garden thumbnails support quick visual comparison across home,
  community, container, and other independent sites.
- Compact plans use the home screen for orientation while preserving precise
  spatial controls in the workflow where they are needed.
- Selected-garden actions keep planting data attached to the correct plan and
  prevent accidental cross-garden assignment.
- The selected garden identifier already exists in the browser model and maps
  cleanly to a future API route, database foreign key, and authorization scope.

## Alternatives Considered

### One Large Plan With a Garden Dropdown

A detailed plan supports direct placement, though it hides other gardens and
requires a context change before comparison.

### Independent Action Buttons on Every Thumbnail

Per-card controls allow direct operations, while several action groups create
a crowded dashboard when a user has many gardens.

### An Unselected Global Planting Inbox

A cross-garden record list helps seasonal review. Creating a planting still
requires a garden and planting area, so the first operations action uses the
explicit selected garden.

### Full Metric Grids in Every Thumbnail

Metric grids make sense in an editor. Repeating them inside compact cards
competes with the garden shapes that users need to recognize quickly.

## Consequences

- The home component needs a compact, non-editable plan rendering mode and a
  responsive garden-card layout.
- The existing selected garden state remains essential even though the
  dropdown control leaves the home screen.
- Tests cover rendering multiple cards, selecting a thumbnail, compact visual
  content, and action routing for the selected garden.
- A future cross-garden seasonal review can aggregate planting and care
  records without replacing selected-garden editing.

## Revisit When

Revisit this decision when users regularly manage many gardens, need a
cross-garden calendar, want drag-and-drop ordering of garden cards, require
shared garden access, or use map-backed garden views.
