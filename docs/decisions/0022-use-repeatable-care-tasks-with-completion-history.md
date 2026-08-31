# ADR-0022: Use Repeatable Care Tasks With Completion History

- Status: Accepted
- Date: 2026-08-31
- Related: [ADR-0020](0020-support-garden-area-and-plant-group-care-targets.md)
  and [ADR-0021](0021-use-dashboard-garden-setup-and-direct-editing.md)

## Context

Care Log records completed watering and fertilizing. Gardeners also need to
plan the next care action, see what is overdue, and maintain a usable cadence
without manually recreating every repeat.

The product already supports one structured target for completed care:
the whole garden, one planting area, or one plant group. Care Tasks should use
the same targets so planned work and completed history refer to the same garden
data.

## Decision

Provide a unified Care workspace with Tasks and History views.

Each Care Task has:

- a care type of Watering or Fertilizing;
- one garden, planting-area, or plant-group target;
- a required due date;
- an optional note; and
- an optional repeat interval in whole days.

Tasks appear as Overdue, Due today, Upcoming, or Completed. A user completes a
task with an actual completion date that defaults to today. Completing a task
creates the matching Care Log event with the same type, target, completion date,
and note.

When a task has a repeat interval, completion creates a new open task whose due
date equals the actual completion date plus that interval. The completed task
remains in task history, and the Care Log retains the completed-action record.

Tasks that reference a deleted planting area or plant group retain their target
name snapshot and display a former-target label. Users can remove an obsolete
task directly.

## Why This Option

- The Care workspace gives daily planning and completed history a clear shared
  entry point.
- Structured targets match the existing Care Log and preserve useful context
  for summaries, rotation planning, and future AI workflows.
- Completion-created history removes duplicate entry work and gives the
  application one reliable record of actual care.
- Completion-based repeat dates match real gardening cadence when care happens
  earlier or later than planned.
- Two initial task types keep the workflow focused on the highest-frequency
  care actions already supported by the application.

## Alternatives Considered

### Separate Tasks And Care Log Pages

Separate pages distribute closely related daily work across two routes and
require users to switch context to confirm what was completed.

### Manual Care Log Entry After Task Completion

Two forms for one completed action increase repeated data entry and create
inconsistent task and history data.

### Calendar And Notification Integrations

External reminders, calendar synchronization, and device notifications require
account, permission, delivery, and reliability infrastructure. They belong in
a later public-product phase.

### Rich Schedule Rules In The First Slice

Weekday, monthly, seasonal, and weather-aware schedules add rule complexity
before the core due-date and repeat-interval workflow has evidence of use.

### Multi-Target Tasks

Multi-target tasks require target join records, completion rules, and
per-target history behavior. One structured target matches the existing care
model and keeps the first workflow easy to review.

## Consequences

- Garden persistence gains versioned task data and migration coverage.
- The Care dashboard gains status grouping, task completion, editing, and
  removal workflows.
- Care-event validation remains the source of truth for completed watering and
  fertilizing history.
- Future task types such as pruning, harvest, and pest treatment can extend
  the task model after the Activity Journal design is accepted.

## Revisit When

Revisit this decision when users need calendar synchronization, notifications,
multi-target care, weather-aware scheduling, shared gardens, inventory-linked
fertilizer tasks, or task types beyond watering and fertilizing.
