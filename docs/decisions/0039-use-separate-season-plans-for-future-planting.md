# ADR-0039: Use Separate Season Plans for Future Planting

- Status: Accepted
- Date: 2026-09-02
- Related: [ADR-0025](0025-use-three-season-crop-rotation-warnings.md), [ADR-0026](0026-use-a-next-season-planning-workspace.md), [ADR-0037](0037-use-area-summary-and-pairing-notes-for-season-planning.md), and [ADR-0038](0038-link-current-plantings-to-layout-positions.md)

## Context

Gardeners review crop rotation before a new season and may select several
possible crops before any seed is started or plant is placed in a growing
area. Current Planting Records support care history, plant health, and
rotation history. Future choices stored in that collection appear alongside
actual plants and can make the current garden record misleading.

The planner also needs a low-effort way to classify familiar plant names.
Gardeners may enter a crop name in English or Chinese, or enter a named
variety such as Sungold.

## Decision

Store upcoming planting choices in a `SeasonPlan` for one garden and one
calendar year. Each plan contains `PlannedPlanting` entries that reference a
growing area and record the selected plant type, optional variety, and crop
family.

- `Plan next season` saves a choice directly to the selected garden's next
  season plan and remains in the planning workspace.
- Current Planting Records contain plants that are already planted or have
  historical planting dates. Layout allocations continue to create or update
  current Planting Records through the ADR-0038 link.
- A workspace restore moves legacy Planting Records dated after the current
  calendar year into the matching season plan.
- The planner infers crop family from known English and Chinese names and
  varieties. `Tomato`, `番茄`, and `Sungold` resolve to `Nightshade`.
- The user can change the inferred crop family before saving a plan item.
- Companion-planting notes use plan entries inside the same growing area.
- Each garden shows one compact plan preview with its growing areas at their
  relative positions. Planned plant types appear as labelled color circles in
  the associated growing area. The preview conveys plant combinations and does
  not represent quantities or planting coordinates.
- Garden thumbnails and season-plan previews focus on the bounds of measured
  growing areas by default, with a full-garden view available in the planner.

## Why This Option

- Current garden screens, care targets, and plant history represent factual
  planting state.
- The planning workspace holds tentative next-season choices in one visible
  place and supports removal or revision without editing current records.
- Crop-family inference avoids repeated manual classification while preserving
  user control for uncommon cultivars.
- Garden and growing-area ownership remains explicit for future planning and
  later reporting.

## Alternatives Considered

### Future-Dated Planting Records

This was the earlier approach. It reused existing persistence and forms, but
future choices appeared in Planting Records and could be mistaken for current
plants.

### Free-Text Seasonal Notes

Free text offers a fast draft but cannot support per-area rotation summaries,
pairing notes, or later conversion into planted records without extra parsing.

### Automatically Marking a Plan Item as Planted

Planting requires a real date, quantity, and confirmation. An explicit future
workflow can promote a plan item when the gardener starts planting.

## Consequences

- The frontend and PostgreSQL workspace schema contain season-plan entities.
- Existing workspaces remain compatible because `seasonPlans` is optional on
  input and defaults to an empty collection.
- Legacy future-dated records are preserved as planned entries during restore.
- A later feature will add a user-confirmed transition from a plan item to a
  current Planting Record.

## Revisit When

Revisit when the product supports multiple planning scenarios for one garden
and year, a seed inventory, multiple hemisphere-specific season calendars, or
an explicit plan-to-planting conversion workflow.
