# ADR-0019: Use Targeted Care Events for Watering and Fertilizing

- Status: Accepted
- Date: 2026-08-30
- Related: [ADR-0013](0013-prioritize-garden-operations-and-ai-planning.md), [ADR-0016](0016-separate-planting-records-from-layout-allocations.md), and [ADR-0018](0018-use-a-multi-garden-thumbnail-dashboard.md)

## Context

Gardeners need a reliable history of when they watered and fertilized. These
facts support daily garden work, later reminders, fertilizer review, crop
planning, and grounded AI assistance. A care action may apply to an entire
garden or a specific planting area, such as one raised bed or a container
group.

Planting records describe what was planted. They do not provide a durable,
dated history for recurring care. A separate care-event model keeps completed
work clear and supports multiple actions over time.

## Decision

Store watering and fertilizing as dated care events inside each garden.

- A care event belongs to one garden and targets either the whole garden or
  one planting area within that garden.
- The first event types are `watering` and `fertilizing`.
- Every event stores its date and an optional note.
- Fertilizing events also store a fertilizer product name, amount, and unit.
- Users can add, edit, delete, and browse care events for the selected garden.
- The dashboard provides a prominent Care Log action and displays the latest
  relevant watering and fertilizing dates.
- The browser-persisted prototype owns care events until backend persistence
  introduces the database and API model.

## Why This Option

- Whole-garden entries cover common maintenance work without repeated data
  entry.
- Planting-area entries preserve detail for containers, raised beds, and zones
  with different care needs.
- Structured fertilizer fields support later nutrient review and AI
  explanations while keeping watering records quick to enter.
- Completed events create trustworthy history before adding schedule and
  reminder logic.

## Alternatives Considered

### One Free-Text Garden Journal

Free text captures observations and does not support dependable latest-care
summaries, reminder calculations, or fertilizer history.

### Care Fields on Each Planting Record

Watering and fertilizing frequently apply across a planting area or the whole
garden. Storing copies on individual plantings would create redundant entries.

### Mandatory Planting-Area Target

Area-only records add repeated input for garden-wide work. An explicit
garden-wide target keeps the completed action accurate.

### Scheduling and Reminders in the First Slice

Frequency configuration, due dates, postponement, and completion rules form a
separate task-management feature. Care history provides the reliable source
data for that work.

## Consequences

- The garden model gains a care-event collection and migrations from prior
  browser workspace versions preserve existing garden, planting-area, and
  planting data.
- Validation ensures a planting-area target belongs to the event's garden.
- Deleting a planting area needs a policy for dependent care history. The
  first implementation retains the event and shows its former area name when
  the target no longer exists.
- Latest-care summaries define whether a garden-wide event or an area event is
  relevant to a displayed scope.
- Future reminders, crop rotation, task completion, and AI planning can use
  care events as dated factual inputs.

## Revisit When

Revisit this decision when users need multi-area bulk actions, watering volume,
weather integration, fertilizer composition, inventory tracking, recurring
schedules, care templates, photo evidence, shared gardens, or backend
authorization.
