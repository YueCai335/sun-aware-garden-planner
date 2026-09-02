# ADR-0016: Separate Planting Records From Layout Allocations

- Status: Superseded by [ADR-0038](0038-link-current-plantings-to-layout-positions.md)
- Date: 2026-08-30
- Related: [ADR-0013](0013-prioritize-garden-operations-and-ai-planning.md), [ADR-0014](0014-use-metric-planting-layouts-with-grid-snapping.md), and [ADR-0015](0015-use-a-metric-garden-plan-overview.md)

## Context

The Garden Plan and growing-area editor already represent planned space: an
allocation circle has a label, a centre position, and a spacing diameter. A
garden operations workflow also needs durable facts about what was actually
planted, when it was planted, and where it belongs. These facts support care
logs, crop-family rotation, seasonal history, and later reviewable AI planning.

One tomato or one row of lettuce may correspond to several planned circles,
one broad in-ground area, or no detailed layout at all. Treating a layout
allocation as the source of operational history would make basic record keeping
depend on a finished canvas plan.

## Decision

Store planned layout allocations and actual planting records as separate
concepts.

- A layout allocation continues to represent planned growing space and spacing
  inside a growing area.
- A planting record represents one crop or plant group actually planted in one
  growing area, such as four Sun Gold tomatoes in a raised bed.
- The first planting-record slice stores a common name, crop family, quantity,
  planting date, growing-area identifier, and active status.
- Crop families use a controlled list with an `Other or unknown` option. This
  preserves usable rotation data while allowing flowers, perennials, and
  uncommon crops.
- A planting record does not require a link to a layout allocation in the
  first slice. A future optional link may connect exact placement to the
  operational record.
- Seed starting, transplanting, watering, fertilizing, harvesting, and notes
  remain dated garden events in later slices. They can target a planting record
  or a broader growing area.

## Why This Option

- Gardeners can record a planting before drawing a detailed layout, which makes
  the operations workflow usable for direct sowing, containers, and informal
  in-ground planting.
- Crop family and planting date establish the facts needed for deterministic
  rotation rules and season history.
- Group-level records match common gardening work, avoid redundant records for
  every seedling, and provide a simple target for later care events.
- The separation keeps layout geometry focused on measurable space and avoids
  forcing spatial assumptions into historical garden data.

## Alternatives Considered

### Use Layout Allocations as Planting Records

Allocation circles describe intended space. They do not consistently describe
what was planted, when it happened, or how many plants belong to the same crop
group.

### Create One Record for Every Physical Plant

Individual records fit a specimen collection or greenhouse inventory. They add
unnecessary data entry for garden rows and repeated vegetables.

### Begin With a Free-Text Journal

Free text is useful for observations, while it cannot reliably power
crop-family history, rotation rules, or targeted care workflows.

### Require a Plant Catalogue or AI Extraction First

An external catalogue and AI extraction require source quality, matching rules,
and user review. Direct structured entry creates dependable product data for a
later catalogue and assistant.

## Consequences

- The browser-persisted model gains a planting-record collection linked to
  growing areas.
- The first UI slice must provide clear empty, validation, edit, and removal
  states for planting records.
- Future garden events and care tasks can target either a planting record or a
  growing area.
- Crop rotation can aggregate historical planting records by growing area,
  season, and controlled crop family.
- A later optional allocation link requires migration and a clear policy for
  records whose layout position has been removed.

## Revisit When

Revisit this decision when users need individual-plant histories, inventory
tracking, a sourced plant catalogue, barcode or photo identification, batch
transplant flows, or a required link between every planting record and a
layout allocation.
