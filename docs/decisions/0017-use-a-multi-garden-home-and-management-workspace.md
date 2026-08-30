# ADR-0017: Use a Visual Multi-Garden Home and Dedicated Management Workspace

- Status: Accepted
- Date: 2026-08-30
- Related: [ADR-0013](0013-prioritize-garden-operations-and-ai-planning.md), [ADR-0014](0014-use-metric-planting-layouts-with-grid-snapping.md), [ADR-0015](0015-use-a-metric-garden-plan-overview.md), and [ADR-0016](0016-separate-planting-records-from-layout-allocations.md)

## Context

Gardeners need an immediate visual understanding of the garden they are
currently working on. The first Garden Plan implementation placed plan
dimensions, positioning controls, area lists, planting records, and garden
setup together on the home screen. This hides the spatial view behind editor
controls and repeats information already visible on the plan.

Users may also manage independent sites with different plans and histories,
such as a home garden and a community plot. A home garden can include front,
back, side, and patio planting areas in one shared plan. Each independent site
needs its own selected garden, plan dimensions, planting areas, and records.

## Decision

Use a visual Garden Plan as the home screen for one selected garden and move
structural editing into a dedicated Garden Management workspace.

- The home screen renders the selected garden's plan as the primary content.
- Home controls support selecting a garden and entering Garden Management.
- The plan shows measured planting-area shapes, names, and layout allocations
  that have coordinates. Planting records without a layout location remain
  available in Garden Management and care workflows.
- Garden Management owns garden creation, selection, renaming, deletion, plan
  dimensions, planting-area creation, planting-area name and type changes,
  removal, layout editing, and planting-record management.
- A garden is one independently managed physical site with one metric plan.
  A planting area is a measured growing space inside that garden, including a
  raised bed, in-ground area, container group, or greenhouse shelf.
- The user interface uses the term `Planting area`. Existing code may retain
  `GrowingArea` as an internal type during a gradual migration.

## Why This Option

- The default view answers the gardener's first question: what is currently
  growing, and where is it arranged?
- Editor controls stay available in a dedicated workflow without competing for
  space with the plan.
- The garden and planting-area hierarchy matches real usage across home sites,
  community plots, containers, and in-ground beds.
- Separate gardens establish a clean ownership boundary for care history,
  crop rotation, future sharing, and backend persistence.
- The model fits the planned FastAPI and PostgreSQL schema without adding map
  dependencies or property-boundary claims.

## Alternatives Considered

### One Global Garden With Labels for Every Site

Labels can describe front, back, patio, and community locations. They mix
independent dimensions, histories, and future permissions into a single plan.

### Editor Controls on the Home Screen

Direct controls provide quick access during early prototyping. They crowd the
home screen and weaken its role as an at-a-glance garden view.

### Separate Detail Page for Every Planting Record

Individual pages would support large record collections. The first operations
workflow benefits from group-level management within the selected garden, and
it keeps basic edits efficient.

### Automatic Map-Derived Garden Setup

Map imagery, parcel data, and automatic extraction require source licensing,
coverage, calibration, and accuracy controls. The manual metric plan remains
the trustworthy spatial source for the current phase.

## Consequences

- Browser storage migrates from one garden workspace to a multi-garden
  workspace with a selected garden identifier.
- Garden and planting-area deletion require clear confirmation because they
  remove dependent records in the browser prototype.
- Tests cover selection, migration, garden switching, renaming, and the
  distinction between home and management workflows.
- The home plan needs a visual treatment for layout allocations and a clear
  indication when records exist without exact spatial placement.
- Care, plant health, community, and exchange workflows remain future modules
  until they have working user flows and acceptance criteria.

## Revisit When

Revisit this decision when users need shared ownership, a garden with multiple
coordinate-system layers, map-aligned plans, imported survey geometry,
cross-garden crop rotation, or server-side organization and permissions.
