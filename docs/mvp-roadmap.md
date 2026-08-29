# MVP Roadmap

## Phase 1: Garden Operations MVP

Goal: help a gardener keep an accurate, useful seasonal record.

Features:

- Create a garden and named growing areas.
- Define measured growing-area layouts and place planned plant allocations on
  a metric grid.
- Add plants with crop family and planting date.
- Record watering, fertilizing, planting, transplanting, harvesting, and notes.
- Create and complete future care tasks.
- Preserve data in the browser for the initial demo.
- Provide a built-in demo garden and clear empty states.

Success criteria:

- A user can complete a real garden-record workflow in one session.
- Refreshing the app retains the current browser-saved garden.
- The layout preserves real dimensions, allocation diameters, and snapped
  positions after refresh.
- Users can find upcoming and completed care tasks.
- Core interactions have focused tests.

## Phase 2: Backend and Persistence

Goal: establish a production-style application and data foundation.

Features:

- FastAPI REST API with OpenAPI documentation.
- PostgreSQL persistence and Alembic migrations.
- User, garden, growing-area, planting, event, and task APIs.
- Validation, authorization, backend tests, Docker Compose, and GitHub Actions.

## Phase 3: Crop Rotation and Planning

Goal: use stored history to support next-season choices.

Features:

- Crop-family history by growing area and season.
- Deterministic rotation warnings and alternatives.
- Date-based task suggestions.
- User-editable planting-plan drafts.

Success criteria:

- Each warning links to explicit stored history and a deterministic rule.
- Tests cover rotation and planning edge cases.

## Phase 4: Applied AI Assistant

Goal: add reviewable AI workflows on top of reliable garden data.

Features:

- Convert a free-text garden note into a structured record draft.
- Retrieve source-grounded plant and care advice.
- Require user review before saving extracted fields.
- Evaluate fixed extraction and recommendation cases.
- Record citations, fallbacks, errors, and user corrections.

## Phase 5: Local Garden Community

Goal: support regional exchange after trusted account and garden workflows are
stable.

Possible features:

- Listings for seedlings, seeds, cuttings, supplies, and local deals.
- Region-based search and availability status.
- Reporting, moderation, and safety controls.

## Phase 6: Deferred Sun Intelligence Research

Goal: resume sun analysis only with a bounded data and accuracy plan.

Candidate features:

- Confirmed yard geometry and obstacle details.
- Licensed map data or authorized image inputs.
- Deterministic solar calculations with documented limitations.
- Point-level observation before any yard-wide heatmap claim.
