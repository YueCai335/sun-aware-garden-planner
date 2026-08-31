# ADR-0021: Use Dashboard Garden Setup and Direct Editing

- Status: Accepted
- Date: 2026-08-30
- Supersedes: [ADR-0018](0018-use-a-multi-garden-thumbnail-dashboard.md)
- Related: [ADR-0016](0016-separate-planting-records-from-layout-allocations.md) and [ADR-0020](0020-support-garden-area-and-plant-group-care-targets.md)

## Context

The dashboard already provides compact plan thumbnails for several gardens.
Its header currently spends space on a garden count, and a separate Planting
Records action exposes implementation terminology instead of a coherent
editing workflow. Creating a garden requires several related details: name,
plan, planting areas, and plants.

Gardeners need a fast path from a recognizable thumbnail to detailed editing.
They also need an obvious way to start a new garden without returning to a
separate setup surface.

## Decision

Use the dashboard as the entry point for creating and editing gardens.

- The dashboard header provides an `Add garden` action.
- `Add garden` opens a guided Garden Setup flow for the garden name, plan,
  planting areas, and plants.
- A single click on a thumbnail selects that garden for dashboard actions.
- A double click on a thumbnail opens `Edit garden` for detailed editing.
- An explicit `Edit garden` action supports touch and keyboard workflows.
- `Edit garden` owns garden dimensions and name, planting-area management,
  plant management, and layout editing.
- The dashboard retains the separate Care Log action because it represents a
  frequent operational history view.

## Why This Option

- The header action uses dashboard space for a high-value workflow.
- Guided setup keeps the first garden complete enough to be useful while
  allowing users to add further areas and plants in the same flow.
- Thumbnail selection supports visual comparison across gardens.
- Direct editing matches the gardener's expectation that a garden card opens
  its detailed workspace.
- Plant records remain visible where gardeners manage the garden, while their
  structured data continues to support rotation, history, and future AI
  planning.

## Alternatives Considered

### Keep a Separate Planting Records Dashboard Action

This adds a second entry point for information that belongs in the detailed
garden workflow and leaves the dashboard with less room for common actions.

### Open Editing on Every Single Card Click

Single-click editing prevents quick selection and comparison across several
gardens. Double click plus an explicit action keeps both workflows available.

### Create a Garden From One Minimal Name Field

A name-only flow creates an empty plan and immediately requires more setup.
Guided setup keeps the related first-use decisions together.

### Place Editing Controls Directly on Every Thumbnail

Repeated controls crowd a multi-garden dashboard and reduce the value of the
visual plan overview.

## Consequences

- Dashboard routing gains a setup view and a direct edit transition.
- Tests cover setup completion, thumbnail double-click editing, keyboard or
  button editing, and plant management inside the garden workspace.
- The selected-garden state remains the scope for Care Log operations.
- A future cross-garden review can aggregate care and planting history without
  changing the editing workflow.

## Revisit When

Revisit this decision when users regularly manage many gardens, need bulk
garden setup templates, share gardens with collaborators, require cross-garden
care schedules, or need a mobile-native navigation model.
