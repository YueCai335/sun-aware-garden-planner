# ADR-0013: Prioritize Garden Operations and AI Planning

- Status: Accepted
- Date: 2026-08-29
- Related: [ADR-0004](0004-keep-physics-deterministic.md), [ADR-0006](0006-adopt-employment-oriented-production-stack.md), [ADR-0008](0008-use-metric-reference-grid-and-polygon-yard-boundary.md), [ADR-0009](0009-use-address-guided-map-initialization-and-point-sky-calibration.md), [ADR-0010](0010-use-mapbox-for-address-guided-map-initialization.md), and [ADR-0012](0012-use-address-first-parcel-candidates-with-user-confirmation.md)

## Context

The initial product direction centered on a yard-wide sun-hours heatmap. A
credible implementation requires current geometry, dimensions, obstacle
heights, image and map-data permissions, a deterministic shadow model, and a
clear accuracy boundary. Each dependency creates significant product and
engineering work before a gardener receives a dependable result.

Gardeners also need help throughout a growing season: recording activities,
remembering care, planning crop rotation, and turning natural-language notes
into reliable garden data. These workflows create a strong, testable foundation
for full-stack and applied-AI portfolio evidence.

## Decision

Prioritize Garden Operations and AI Planning as the product core.

1. The primary workflow records gardens, named growing areas, plants, care
   events, and future tasks.
2. Crop history and deterministic rotation rules provide planning support
   across seasons.
3. An AI assistant converts free-text garden notes into structured drafts and
   explains grounded planning suggestions. Users review every AI-generated
   record before it is saved.
4. A yard-wide sun-hours heatmap, map-assisted parcel workflow, point sky
   capture, and image-understanding proposals remain deferred research
   capabilities.
5. The existing Mapbox and React-Konva prototypes remain available as product
   exploration and can support a future garden-layout workflow.

## Why This Option

- Garden records and task planning solve recurring user problems with inputs
  that users can provide reliably.
- The workflow naturally demonstrates relational data modeling, temporal
  product logic, API design, validation, tests, background work, and cloud
  operations.
- Structured extraction, retrieval, citations, evaluations, and user review
  create an applied-AI capability with clear correctness boundaries.
- The deferred sun module can resume after the application has a stable data
  model, clearer user demand, and an evidence-based accuracy plan.

## Alternatives Considered

### Complete the Yard-Wide Heatmap Before Garden Operations

The heatmap remains a valuable differentiator. Its input-quality, licensing,
and simulation requirements would delay the product's first reliable
end-to-end workflow.

### Build a General Gardening Chatbot First

A chat-only experience would provide limited evidence of durable product data,
workflow design, and AI reliability. Garden operations supplies the structured
context that makes an assistant useful and testable.

### Build the Local Community Marketplace First

Listings, user reporting, moderation, search, and safety controls require a
stable account and garden foundation. Community features remain a later
product expansion.

## Consequences

- The roadmap begins with garden operations, persistence, crop history, and
  AI-assisted structured records.
- The FastAPI, PostgreSQL, API-contract, authentication, testing, Docker,
  CI/CD, and AWS phases gain direct product requirements.
- Current sun-analysis and map decisions remain valid for their deferred
  module, with no commitment to implement them in the near-term roadmap.
- The user-facing narrative shifts from a sun-map generator to a garden
  operations and planning platform.

## Revisit When

Revisit this decision after the core operations workflow is deployed and has a
demonstrable end-to-end data flow, when users validate a need for sun analysis,
or when licensed input data and accuracy testing support a bounded sun module.
