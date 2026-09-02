# ADR-0038: Link Current Plantings to Layout Positions

- Status: Accepted
- Date: 2026-09-02
- Related: [ADR-0016](0016-separate-planting-records-from-layout-allocations.md), [ADR-0025](0025-use-three-season-crop-rotation-warnings.md), and [ADR-0037](0037-use-area-summary-and-pairing-notes-for-season-planning.md)

## Context

Gardeners use the current layout editor to describe plants that are already
growing in a real garden. Crop rotation, care targeting, and season planning
need the same plants as dated operational records. A separate follow-up entry
step creates duplicate work and leaves the planner without the current
season's history.

Spatial data and operational data still have different responsibilities. A
planting can exist without a measured position, while a future season may use
its own planning data. The product needs one current-season workflow that
keeps these representations connected.

## Decision

Treat a newly added layout plant as a current-season planting by default.

- Each layout allocation can reference one Planting Record.
- Adding a plant in the current layout creates a linked active Planting Record
  in the same update.
- Existing layout allocations receive linked current-season records during
  workspace restoration when an equivalent active record does not already
  exist. The generated record uses the current date and an inferred crop
  family when known; otherwise it uses `Other or unknown`.
- Existing active records with the same growing area and plant type are linked
  before a generated record is created.
- Planting Records remain available for direct sowing, informal planting, and
  records without a measured position.
- The Next Season Planner reads the current workspace's linked records as its
  immediate data source, including records that are waiting to be saved to
  PostgreSQL.
- A future seasonal-plan mode must use an explicit future-season record or
  plan entity. It must not silently reinterpret a current planting as a
  future draft.

## Why This Option

- Adding a real plant captures its visible location and its operational facts
  in one user action.
- The planner immediately reflects the plants already shown in a garden.
- Linking preserves the flexibility needed for unpositioned planting records
  and later future-season planning.
- The restoration path protects existing gardens while supplying the minimum
  seasonal data needed for rotation guidance.

## Alternatives Considered

### Require a Separate Record-From-Layout Action

This adds an extra step after a gardener has already described the plant and
creates an avoidable empty state in the planner.

### Use Layout Allocations as the Only Planting History

Some real plantings have no measured circle, and historical records need
dates, crop families, quantities, and care targets beyond spatial geometry.

### Treat Every Layout Allocation as a Future Draft

The current editor is used to record plants that are already growing. Future
planning needs a visible and deliberate mode of its own.

## Consequences

- Workspace validation accepts an optional planting-record reference on each
  allocation.
- Existing layouts gain current-season records automatically when restored.
- A generated planting date reflects when the record was created, so users can
  edit it later when they know the original planting date.
- Current layout placement and Planting Records stay separately queryable for
  their specialized uses.

## Revisit When

Revisit when the product adds seasonal plan drafts, batch planting flows,
individual-specimen histories, transplant events, or a planting-date accuracy
state.
