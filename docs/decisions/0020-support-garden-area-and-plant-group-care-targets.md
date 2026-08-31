# ADR-0020: Support Garden, Planting-Area, and Plant-Group Care Targets

- Status: Accepted
- Date: 2026-08-30
- Supersedes: [ADR-0019](0019-use-targeted-care-events-for-watering-and-fertilizing.md)
- Related: [ADR-0013](0013-prioritize-garden-operations-and-ai-planning.md) and [ADR-0016](0016-separate-planting-records-from-layout-allocations.md)

## Context

Watering and fertilizing can apply to an entire garden, a planting area, or a
specific plant group. A plant group is the existing planting record, such as
four Sun Gold tomatoes in one raised bed. Gardeners frequently fertilize all
plants in a bed together, while some applications need an entry for one group.

Recording every physical plant would add repetitive work. A single action can
also cover several separate beds or plant groups, which needs a deliberate
multi-target model instead of repeated one-target fields.

## Decision

Store each care event inside one garden and give it exactly one target:

- the whole garden;
- one planting area; or
- one plant group represented by a planting record.

The care form presents these targets in one grouped selector. A user chooses a
larger target when the same completed action applied across several plants.
The first implementation keeps one target per event. It will retain a
snapshot name and show a former-target label when a referenced planting area
or plant group is deleted.

## Why This Option

- Garden and planting-area targets make common batch care fast to record.
- Plant-group targets capture selective feeding without creating a record for
  every physical plant.
- The existing planting-record model supplies a stable identifier, crop
  family, quantity, and growing-area context for future planning and AI use.
- A one-target event keeps browser persistence, validation, later APIs, and
  database constraints straightforward.

## Alternatives Considered

### Garden and Planting-Area Targets Only

These targets cover frequent work and cannot express targeted fertilizing for
one crop group within a shared growing area.

### One Event for Every Physical Plant

Individual records suit a specimen collection. Vegetable gardens and repeated
plantings benefit from group-level workflows.

### Multi-Target Events in the First Slice

Multi-select controls require event-to-target relationships, batch editing,
and deletion rules. The current workflow provides an accurate high-level
target without those extra rules.

### Free-Text Targets

Free text prevents reliable links to crop history, rotation rules, summaries,
and future care recommendations.

## Consequences

- Care-event persistence and validation gain a third target kind with a
  planting-record identifier and name snapshot.
- Existing garden and planting-area records migrate without data loss.
- The dashboard can display a direct label for each recent event target.
- Multi-target fertilizing remains a future enhancement with its own data
  model and user workflow.

## Revisit When

Revisit this decision when users routinely apply one action to multiple
planting areas or plant groups, require dosage per target, share gardens, or
need fertilizer inventory and nutrient analysis.
