# Technical Architecture

## High-Level Components

Frontend:

- Garden dashboard, growing-area management, and metric planting layouts.
- React-Konva planting-layout canvas with grid snapping and accessible precise
  controls.
- Plant, activity, and care-task forms.
- Garden journal and seasonal history views.
- Crop-rotation planning and constraint explanations.
- AI-assisted note review and grounded-answer interface.
- Mapbox and place-search prototype retained for deferred map-backed layout
  work.

Backend:

- Authentication and authorization.
- Garden, growing-area, plant, event, task, and crop-history APIs.
- Planning and crop-rotation service.
- AI extraction, retrieval, evaluation, and feedback service.
- Scheduled task generation and notification orchestration when measured need
  supports background processing.

Database:

- Users and gardens.
- Growing areas and seasonal plans.
- Plants, crop families, and plantings.
- Garden events, notes, photos, and attachments.
- Care tasks and completion history.
- Crop rotation history and planning results.
- Retrieved source metadata, AI drafts, reviews, and evaluation data.

## Target Stack

Frontend:

- Next.js, React, and TypeScript.
- Tailwind CSS and shadcn/ui.
- Vitest, React Testing Library, and Playwright.
- React-Konva for measured growing-area layouts, placement circles, grid
  snapping, and direct manipulation.
- Mapbox GL JS and Mapbox Search JS retained for the deferred map-backed
  yard-layout module.

Backend:

- FastAPI with Python.
- Pydantic for API validation and pytest for backend tests.
- REST and OpenAPI for the frontend-backend contract.

Data:

- PostgreSQL with SQLAlchemy and Alembic.
- pgvector for plant-knowledge retrieval.
- PostGIS for garden locations, regional search, and deferred yard geometry.

AI:

- OpenAI API for structured outputs, RAG answer generation, tool calling, and
  planning assistance.
- Evaluation datasets, citations, fallbacks, user review, and guardrails.

Deployment:

- Vercel for frontend previews and production hosting.
- Docker and Docker Compose for a reproducible local environment.
- GitHub Actions for tests, builds, security checks, and deployment gates.
- AWS ECS Fargate, RDS, S3, CloudWatch, and Terraform when the backend is
  deployed.

## Module Boundaries

`garden-operations` owns gardens, measured growing-area boundaries, plant
allocations, plants, events, tasks, and history.

`garden-planning` owns deterministic rotation rules, scheduling calculations,
and plan constraints.

`plant-knowledge` owns curated documents, retrieval metadata, and citations.

`ai-assistant` owns structured extraction, grounded answers, user-review
drafts, evaluations, and observability.

`local-community` owns future listings, availability, reporting, moderation,
and regional search.

`sun-analysis` remains a deferred module. It will own confirmed yard geometry,
authorized source metadata, deterministic solar calculations, and accuracy
evidence when it resumes.

## Data Flow

1. A user creates a garden, named growing areas, and optional measured layouts.
2. The user places plant allocations on a metre-based grid and records a
   planting, care event, note, photo, or future task.
3. The frontend validates local form state and sends a typed request to the
   FastAPI API.
4. The backend validates the request, applies authorization, and persists the
   record in PostgreSQL.
5. Planning services read the stored history to create deterministic rotation
   warnings and task suggestions.
6. The AI assistant may create a structured draft or grounded answer. The user
   reviews the draft before it becomes a persisted garden record.

## Staged Cloud Adoption

- Phase 1 keeps the Garden Operations MVP browser-persisted and deploys the
  web demo once the workflow is usable.
- Phase 2 introduces FastAPI, PostgreSQL, Docker Compose, and GitHub Actions.
- The first AWS deployment uses S3, RDS, ECS Fargate, and CloudWatch.
- Terraform begins when those resources exist and can be validated.
- Redis is introduced when scheduled processing or caching has measurable
  value.

## Deferred Map and Sun Module

The existing map and yard-editor prototypes remain in the repository. Future
work can add address-guided onboarding, parcel candidates, confirmed yard
geometry, and sun analysis after the core garden operations workflow is stable.

The deferred module's earlier geometry, address-map, Mapbox, and parcel
decisions are recorded in [ADR-0008](decisions/0008-use-metric-reference-grid-and-polygon-yard-boundary.md),
[ADR-0009](decisions/0009-use-address-guided-map-initialization-and-point-sky-calibration.md),
[ADR-0010](decisions/0010-use-mapbox-for-address-guided-map-initialization.md),
and [ADR-0012](decisions/0012-use-address-first-parcel-candidates-with-user-confirmation.md).

## Architecture Decisions

Decisions that affect architecture, product correctness, cost, security, or
long-term maintainability are recorded in
[Architecture Decision Records](decisions/README.md). The current product
priority is recorded in
[ADR-0013](decisions/0013-prioritize-garden-operations-and-ai-planning.md)
and [ADR-0014](decisions/0014-use-metric-planting-layouts-with-grid-snapping.md).
