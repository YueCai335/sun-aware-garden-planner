# Project Strategy

## Purpose

Sun-Aware Garden Planner is the primary portfolio project for a junior
backend/full-stack developer path, with applied AI as the differentiator.

The product helps gardeners maintain a reliable record of their gardens and
make season-by-season planning decisions. It should provide practical value,
demonstrate full-stack engineering, and remain explainable in interviews.

## Career Positioning

Canonical employment positioning:

> Production-grade full-stack and applied AI platform, with TypeScript/React,
> Python/FastAPI, PostgreSQL, and AWS as the core stack.

The project provides credible evidence for junior full-stack, backend, cloud
application, and applied-AI roles. Technology coverage comes from working
features, tests, deployment, and documented tradeoffs.

Target roles:

- Junior Backend Developer.
- Junior Full-stack Developer.
- Python Developer.
- Applied AI Application Developer.
- Software Developer Intern or New Grad Software Developer.

The project story is:

> I built an AI-assisted garden operations platform with a Next.js interface,
> FastAPI services, PostgreSQL persistence, deterministic crop-rotation rules,
> and reviewable AI workflows for structured garden records and planning.

## Product Direction

### 1. Garden Operations Memory

Help users maintain a durable record across a growing season.

Core capabilities:

- Create gardens and named growing areas, such as an in-ground zone, raised
  bed, container group, or greenhouse shelf.
- Record seed starting, planting, transplanting, watering, fertilizing,
  pruning, harvests, pests, and diseases.
- Store fertilizer type, amount, application area, and photos where useful.
- Track current plants and year-by-year crop history by growing area.
- Maintain planned and completed care tasks.
- Visualize measured growing-area layouts and planned plant spacing.

### 2. Garden Planning and Applied AI

Help users turn reliable garden data into explainable planning support.

Core capabilities:

- Apply deterministic crop-family and rotation constraints to historic plant
  records.
- Generate task suggestions from known dates, user preferences, and garden
  state.
- Convert free-text notes into a structured draft for user review.
- Answer plant and care questions with retrieved sources, citations, and clear
  uncertainty handling.
- Explain recommendations using stored garden facts and explicit constraints.

### 3. Local Garden Community

Support neighborhood-level exchange and local discovery after the operations
foundation is stable.

Possible future capabilities:

- Listings for seedlings, seeds, cuttings, tools, and compost.
- Group-buy interest tracking for fertilizer and soil amendments.
- Local nursery, garden-supply, and flower-shop discount discovery.
- Search and filters by region, category, availability, and pickup distance.
- Listing moderation, reports, and safety controls.

### 4. Deferred Sun Intelligence Research

The project retains a future sun-analysis direction. Yard-wide heatmaps require
licensed map or image inputs, confirmed geometry, obstacle heights,
deterministic simulation, and tested accuracy boundaries. The current roadmap
defers this work until the garden operations platform is stable.

React-Konva supports metric planting layouts in the Garden Operations workflow
and remains available for later map-backed garden layout and sun-analysis
exploration. Address-first parcel candidates, point sky capture, image
understanding, and heatmap rendering belong to this future module.

## Target Technology Stack and Project Use

| Layer | Selected technology | Actual project use |
| --- | --- | --- |
| Web frontend | Next.js, React, TypeScript | Garden dashboard, journals, planning workflows, AI review screens, and accessible responsive UI |
| UI system | Tailwind CSS, shadcn/ui | Reusable forms, dialogs, navigation, tables, and consistent visual states |
| Spatial layout editor | React-Konva | Metric growing-area layouts, grid snapping, and plant-allocation placement circles |
| Application backend | Python, FastAPI, Pydantic | REST APIs, validation, garden operations, planning orchestration, and AI integration |
| API contract | REST, OpenAPI | Typed frontend-backend communication, generated documentation, and integration testing |
| Primary database | PostgreSQL, SQLAlchemy, Alembic | Users, gardens, growing areas, plants, events, tasks, crop history, and schema migrations |
| Geospatial data | PostGIS | Garden locations and future regional community search; deferred map and yard geometry support |
| Maps and place search | Mapbox GL JS, Mapbox Search JS | Existing address-map prototype and future map-backed garden layout |
| Vector search | pgvector | Retrieval over plant, climate, and horticultural knowledge for grounded AI responses |
| Cache and background work | Redis, added when a measured workflow requires it | Cached retrieval, scheduled task generation, and long-running AI job status |
| AI application layer | OpenAI API, RAG, structured outputs, tool calling | Garden-log extraction, care planning, rotation assistance, and grounded questions |
| AI quality | Evaluation datasets, citations, fallbacks, guardrails | Repeatable checks for extracted records, grounded answers, constraint compliance, and failure behavior |
| Image storage | Amazon S3 | Garden photos and future authorized map or calibration assets |
| Cloud backend | AWS ECS Fargate, RDS, CloudWatch | Container hosting, managed PostgreSQL, logs, metrics, and production operations |
| Web deployment | Vercel | Next.js preview deployments and the public web application |
| Local environment | Docker, Docker Compose | Reproducible frontend, backend, PostgreSQL, and optional Redis environments |
| CI/CD | GitHub Actions | Linting, type checks, tests, builds, security checks, and deployment gates |
| Infrastructure | Terraform | Version-controlled AWS resources once cloud deployment begins |
| Frontend tests | Vitest, React Testing Library, Playwright | Component behavior, interaction flows, and end-to-end user journeys |
| Backend tests | pytest | Domain rules, APIs, persistence, crop rotation, and AI integration boundaries |
| Observability | Structured logging, OpenTelemetry, CloudWatch | Error diagnosis, request tracing, performance evidence, and production monitoring |
| Security | OAuth, authorization, rate limiting, secret management | Account access, private garden data, public-community controls, and protected external APIs |

### Adoption Rules

- Add a technology when the current phase contains a working feature that uses
  it.
- Require code, tests, and operational evidence before listing a technology as
  implemented.
- Introduce PostgreSQL with the first persisted garden workflow.
- Introduce PostGIS with location-aware persistence or regional search.
- Introduce pgvector with the RAG phase and evaluate retrieval quality.
- Keep Redis conditional until caching, scheduled processing, or background
  task measurements justify it.
- Introduce Terraform with AWS deployment so the infrastructure it manages is
  real and reviewable.
- Keep Kubernetes, Kafka, and independently deployed microservices outside the
  roadmap until scale or reliability evidence creates a concrete requirement.
- Keep crop-rotation constraints and other explicit garden rules deterministic.
- Defer yard-wide sun physics until its data sources and accuracy boundary have
  a dedicated, tested implementation plan.

This stack baseline is recorded in
[ADR-0006](decisions/0006-adopt-employment-oriented-production-stack.md).

## Architecture Principle

Use a modular monolith first. Internal modules will include:

- `garden-operations`
- `garden-planning`
- `crop-rotation`
- `plant-knowledge`
- `ai-assistant`
- `local-community`
- `sun-analysis` as a deferred module

## AI Principle

AI augments user workflows that benefit from language understanding,
retrieval, and explanation. Users review AI-created structured records before
persistence.

Use deterministic code for:

- Crop-family classification and rotation rules.
- Date and interval calculations for scheduled tasks.
- Explicit plant filtering constraints.
- Authorization, validation, and persistence rules.

Use AI for:

- Extracting structured fields from a garden note.
- Explaining source-grounded recommendations.
- Suggesting care tasks from known garden state.
- Answering horticultural questions with retrieved evidence.
- Summarizing history for seasonal planning.

## Execution and Acceptance Standard

Every feature task must define user value, scope, exclusions, acceptance
criteria, and verification before implementation begins. A feature is complete
when the agreed workflow works end to end, relevant tests pass, applicable
build and type checks pass, and the handoff explains limitations.

An implementation claim requires working code and evidence. Planned
technologies and future capabilities remain documented as planned until that
evidence exists.

## Roadmap

### Phase 1: Garden Operations MVP

Goal: a recruiter can open the app and complete a credible seasonal record
workflow.

Required:

- Create one garden and named growing areas.
- Define measured growing-area layouts and place planned plant allocations on a
  metric grid.
- Add current plants with plant name, crop family, and planting date.
- Record watering, fertilizing, planting, transplanting, harvesting, and a
  free-text garden note.
- Create, complete, and view upcoming care tasks.
- Preserve browser state through refreshes.
- Include an understandable empty state and one built-in demo garden.
- Test the core operations and task interactions.

#### Phase 1 Acceptance Scenario

1. Open the built-in garden or create a garden and named growing area.
2. Set a growing area's dimensions, place a labelled allocation circle, and
   observe its snapped metric position.
3. Add a plant and record a fertilizing event with type, amount, and date.
4. Create a future care task and mark a completed task as done.
5. Refresh the browser and recover the saved garden state and layout.
6. Clear a demo or create a new garden and receive an understandable empty
   state.

### Phase 2: Backend and Persistence

Goal: prove backend, database, API, and testing ability.

Required:

- FastAPI backend and OpenAPI contract.
- PostgreSQL with migrations for users, gardens, areas, plants, events, and
  tasks.
- Validated APIs with clear error responses.
- Backend tests, Docker Compose, and GitHub Actions.

### Phase 3: Crop Rotation and Garden Planning

Goal: provide deterministic, explainable multi-season planning value.

Required:

- Crop-family history by growing area and season.
- Rotation warnings and suggested alternatives.
- Planting-plan draft with explicit constraints and user edits.
- Tests for rotation rules and date-based planning logic.

### Phase 4: Applied AI Assistant

Goal: add AI workflows with reviewable and measurable quality.

Required:

- Structured extraction from a free-text garden note into a reviewable draft.
- RAG-grounded plant and care answers with source citations.
- Evaluation dataset with fixed extraction and recommendation cases.
- Fallback behavior, user review, structured logs, and error states.

### Phase 5: Local Garden Community

Goal: extend a trusted garden account into regional discovery and exchange.

Possible scope:

- Seedling, seed, cutting, supply, and local-deal listings.
- Region-based search and availability tracking.
- Listing creation, moderation, reporting, and safety controls.

### Phase 6: Deferred Sun Intelligence Research

Goal: evaluate a bounded sun-analysis workflow after core operations are
stable.

Candidate scope:

- Confirmed yard geometry and obstacle inputs.
- Licensed map or authorized image inputs.
- Deterministic solar and shadow model with explicit accuracy boundaries.
- Point-level observation and calibration before a yard-wide heatmap claim.

### Phase 7: Public App Readiness

Goal: prepare for real users.

Required before public use:

- Authentication and authorization.
- Privacy policy and basic safety rules.
- Image storage and deletion controls.
- Rate limiting, monitoring, logs, and backups.
- Production deployment documentation.

## What Counts as Portfolio Ready

The project is resume-ready when:

- A user can complete a real workflow.
- Input changes produce meaningful output changes.
- Core logic has tests.
- The app has a deployed demo.
- README explains setup, architecture, and limitations.
- The user can explain the data flow and debug a common failure.

Until then, resume bullets should describe only completed functionality.

## Current Priority

Build the Garden Operations MVP in focused slices:

1. Extend the browser-persisted growing-area model with metric layout and
   plant-allocation data.
2. Deliver a grid-snapped planting-layout editor with accessible precise
   controls and browser persistence.
3. Deliver the garden dashboard and journal workflow.
4. Add task completion and date-based views.
5. Introduce FastAPI and PostgreSQL only after the browser workflow provides a
   stable product model.
6. Add crop rotation and the AI assistant after persisted operations data is
   available.

The current priority is recorded in
[ADR-0013](decisions/0013-prioritize-garden-operations-and-ai-planning.md)
and [ADR-0014](decisions/0014-use-metric-planting-layouts-with-grid-snapping.md).
