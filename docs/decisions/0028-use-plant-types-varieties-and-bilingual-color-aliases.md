# ADR-0028: Use Plant Types, Varieties, and Bilingual Color Aliases

- Status: Accepted
- Date: 2026-09-01
- Related: [ADR-0016](0016-separate-planting-records-from-layout-allocations.md) and [ADR-0027](0027-use-persistent-plant-colors-and-garden-plan-zoom.md)

## Context

Garden layouts need visually distinct, understandable plant markers. A single
free-text name cannot reliably distinguish a plant category from a cultivar:
`Sun Gold` is a tomato variety, while `Tomato` provides the category and a
useful default fruit color. Gardeners also use Chinese and English plant names.

Planting records need the same identity detail for a useful historical record.
Crop family remains a separate controlled value because rotation rules depend
on it and plant type alone cannot safely infer the family for every plant.

## Decision

Store a plant type and optional variety on both layout allocations and planting
records.

- New forms require a plant type and accept an optional variety.
- The familiar display name combines the two fields and remains in the legacy
  `label` or `commonName` field for compatibility with saved data and existing
  workflows.
- A compact local alias catalog recognizes common English and Chinese entries,
  including `Tomato`, `番茄`, `西红柿`, `Sun Gold`, `Eggplant`, and `茄子`.
- A recognized plant type receives a distinct default color. Users retain a
  native color control for cultivar-specific or personal visual choices.
- Existing saved records and allocations may omit the new fields. They retain
  their original labels and use the alias catalog when possible.
- Garden Plan renders a growing-area name above its boundary, outside the
  planted-space rectangle.

## Why This Option

- Plant type gives a stable visual category while variety preserves meaningful
  cultivar detail for gardeners.
- Bilingual aliases support direct entry without an external plant catalog or
  an unreviewed AI classification step.
- Optional additions allow the PostgreSQL and browser models to evolve without
  discarding prior garden data.
- Crop-family rotation keeps deterministic rules explicit and testable.

## Alternatives Considered

### Keep One Free-Text Plant Name

Free text remains available through plant type entry, while it cannot reliably
separate a cultivar such as Sun Gold from its tomato category.

### Require a Complete Botanical Catalog

A complete catalog needs sourced taxonomy, cultivar metadata, matching rules,
and maintenance. The local catalog covers current planning and leaves direct
user input available.

### Use AI to Guess Plant Categories

AI classification would require confidence handling, review, and source-backed
evaluation. Deterministic aliases and explicit user input provide clear,
reviewable defaults for this phase.

## Consequences

- Planting records gain nullable `plant_type` and `variety` database columns
  through an Alembic migration.
- Layout JSON gains optional `plantType` and `variety` properties.
- The alias catalog is intentionally compact and will fall back to a neutral
  color for unknown entries until the gardener chooses a color.
- A future sourced plant-knowledge module can replace or extend aliases while
  retaining stored user choices.

## Revisit When

Revisit when the product adds a sourced botanical knowledge base, photo-based
plant identification, multilingual catalog search, cultivar-specific care, or
shared catalogs across user accounts.
