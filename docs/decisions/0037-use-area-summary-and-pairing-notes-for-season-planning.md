# ADR-0037: Use Area Summaries and Pairing Notes for Season Planning

- Status: Superseded by ADR-0039
- Date: 2026-09-02
- Related: [ADR-0025](0025-use-three-season-crop-rotation-warnings.md) and [ADR-0026](0026-use-a-next-season-planning-workspace.md)

## Context

Gardeners often begin a new season by reviewing available beds, containers,
seeds, and household needs. Requiring a complete crop list before showing
rotation guidance creates unnecessary work and hides useful information.

The existing planner already stores planting history by growing area and crop
family. It needs a concise overview that supports exploration, followed by
optional plant-level guidance once a gardener starts building a plan.

## Decision

Use one growing area as the default rotation unit for raised beds, in-ground
areas, and container groups.

- The first view shows every selected growing area with three concise lines:
  last season's plants, crop families to avoid when practical, and crop
  families with no record in the preceding three seasons.
- The `Avoid if possible` line includes crop families recorded in the prior
  three calendar seasons. The result remains advisory for every area kind.
- A gardener opens `Choose a plant` only after reviewing an area's summary.
  The existing Plant Record form saves an adopted choice with a next-season
  planting date.
- The planner shows source-backed pairing notes for selected next-season
  plants in the same area. Initial notes cover tomato with basil, tomato with
  lettuce, and repeated crop-family caution.
- Pairing notes identify a practical benefit or caution and link to their
  source. The planner does not present unsupported companion-planting claims
  as rules.
- The initial container rule assumes its growing medium remains in use. A
  future growing-medium replacement record can revise the recommendation.

## Why This Option

- Users can explore feasible areas before deciding which seeds or crops to
  use.
- The summary turns stored history into an immediately useful planning view.
- Reusing Plant Records avoids a separate draft schema while preserving the
  user's selected next-season plants.
- Pairing notes complement rotation without confusing last-season soil history
  with same-season layout choices.
- A small curated rule set remains understandable, testable, and suitable for
  expansion as evidence is added.

## Alternatives Considered

### Require a Complete Desired-Crop List First

This creates a data-entry task before users can discover which areas fit their
available options.

### Generate Exact Crop Recommendations Automatically

Rotation history alone cannot determine a crop's suitability for sunlight,
soil, climate, seed availability, or household preferences.

### Treat Companion Charts as Universal Rules

Many popular pairings lack consistent research support. The product keeps
only reviewed notes with clear scope.

### Exclude Containers From Rotation Guidance

Container medium can be replaced, though gardeners also commonly reuse it.
An advisory result preserves useful history until medium replacement is
modeled.

## Consequences

- The seasonal overview is useful with no upfront crop-list entry.
- Future-dated Plant Records represent adopted next-season choices.
- Container recommendations can be conservative until medium replacement
  becomes a tracked event.
- The companion rule set requires source review and test coverage for each new
  entry.

## Revisit When

Revisit when the product adds persistent plan drafts, a curated plant catalog,
location-aware suitability data, user seed inventory, growing-medium
replacement records, or a larger evidence-reviewed pairing library.
