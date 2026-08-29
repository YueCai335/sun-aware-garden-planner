# Project Strategy

## Purpose

Sun-Aware Garden Planner is the primary portfolio project for a junior
backend/full-stack developer path, with applied AI as the differentiator.

The project should prove practical software engineering ability first:

- Build a usable product, not a static demo.
- Keep the core sun and shadow logic deterministic and testable.
- Use AI where language, retrieval, planning, and explanation add value.
- Grow toward a real public application without over-engineering the early MVP.

## Career Positioning

Canonical employment positioning:

> Production-grade full-stack and applied AI platform, with TypeScript/React,
> Python/FastAPI, PostgreSQL, and AWS as the core stack.

The project is designed to provide credible evidence for junior full-stack,
backend, cloud application, and applied-AI roles. Technology coverage must come
from working features, tests, deployment, and documented tradeoffs.

Target roles:

- Junior Backend Developer.
- Junior Full-stack Developer.
- Python Developer.
- Applied AI Application Developer.
- Software Developer Intern or New Grad Software Developer.

The project should support this story:

> I built an AI-assisted geospatial garden planning platform that combines a
> Next.js annotation UI, Python backend services, PostgreSQL persistence,
> deterministic sun/shadow simulation, and RAG-grounded planting advice.

This is stronger than presenting it as a simple gardening app. The product
domain is gardening, but the engineering surface includes full-stack product
development, geospatial UI, algorithms, data modeling, backend APIs, tests,
deployment, and applied AI.

## Product Direction

The long-term product has three major pillars.

### 1. Sun Intelligence

Help users understand where sunlight actually reaches their yard.

Core capabilities:

- Upload or select an aerial yard image.
- Draw yard boundaries, houses, trees, fences, and planting beds.
- Enter obstacle heights, location, and date.
- Simulate shadows over time.
- Generate a sun-hours heatmap.
- Classify areas as full sun, part sun, part shade, or shade.

Sun analysis uses a hybrid approach:

#### Stage A: Aerial Model and Yard-Wide Heatmap

- The user marks yard geometry and obstacle heights on an aerial image.
- Deterministic solar geometry projects shadows at regular time intervals.
- The app aggregates direct-sun minutes into a heatmap for the whole yard.
- This is the first implementation target and must work without AI.

#### Stage B: Panoramic Photo Calibration

- The user selects several important points, such as planting beds or patios.
- At each point, the user captures a guided sky panorama with location and
  orientation metadata.
- Computer vision creates a sky-versus-obstacle mask, with manual correction.
- Calculated solar paths are tested against the mask to estimate direct-sun
  hours at that point.
- Point measurements calibrate the aerial model instead of replacing it.

Photos taken at several times of day may be used as validation evidence, but
two or three ordinary photos are not treated as enough information to infer a
complete yard model.

Why this matters for hiring:

- Shows algorithmic thinking beyond CRUD.
- Creates a visual, interview-friendly demo.
- Gives a clear reason for backend geometry and testing.

### 2. Garden Operations Memory

Help users remember what happened in the garden and plan future seasons.

Core capabilities:

- Record seed starting dates.
- Track planting and transplanting dates.
- Log watering, fertilizing, pruning, harvests, pests, and diseases.
- Record fertilizer type, amount, and application area.
- Store yearly bed usage and crop history.
- Recommend crop rotation constraints for future plans.
- Generate monthly care tasks from garden state.

Why this matters for hiring:

- Adds realistic product depth and database modeling.
- Creates a natural reason for background jobs, reminders, and structured logs.
- Supports strong backend interview discussion around schema design and
  temporal data.

### 3. Local Garden Community

Support neighborhood-level gardening exchange and local discovery.

Possible future capabilities:

- Location-based listings for seedlings, seeds, cuttings, tools, and compost.
- Local group-buy interest tracking for fertilizer or soil amendments.
- Local flower shop, nursery, or garden supply discount feed.
- Search and filters by region, category, availability, and pickup distance.
- User profiles, listing moderation, reports, and safety controls.

Why this matters for hiring:

- Shows product thinking beyond a personal tool.
- Adds marketplace-style backend features.
- Creates a future path toward a public app.

This pillar should come after the core planning and backend foundation are
stable. Adding community features too early would turn the MVP into a broad
but shallow app.

## Target Technology Stack and Project Use

| Layer | Selected technology | Actual project use |
| --- | --- | --- |
| Web frontend | Next.js, React, TypeScript | Yard editor, heatmap, garden records, community workflows, and accessible responsive UI |
| UI system | Tailwind CSS, shadcn/ui | Reusable forms, dialogs, navigation, tables, and consistent visual states as the interface grows |
| Application backend | Python, FastAPI, Pydantic | REST APIs, validation, sun-analysis orchestration, garden records, and AI integration |
| API contract | REST, OpenAPI | Typed frontend-backend communication, generated documentation, and integration testing |
| Primary database | PostgreSQL, SQLAlchemy, Alembic | Users, gardens, yard objects, analysis results, journals, crop history, and schema migrations |
| Geospatial data | PostGIS | Coordinates, yard geometry, regions, distance queries, and future local-community search |
| Vector search | pgvector | Retrieval over plant, climate, and horticultural knowledge for grounded AI responses |
| Cache and background work | Redis, added when a measured workflow requires it | Cached analysis results, background AI jobs, and task status |
| AI application layer | OpenAI API, RAG, structured outputs, tool calling | Plant recommendations, garden-log extraction, care planning, and crop-rotation assistance |
| AI quality | Evaluation datasets, citations, fallbacks, guardrails | Repeatable checks for grounded answers, constraint compliance, and failure behavior |
| Image storage | Amazon S3 | Aerial images, panoramic calibration photos, and derived image assets |
| Cloud backend | AWS ECS Fargate, RDS, CloudWatch | Container hosting, managed PostgreSQL, logs, metrics, and production operations |
| Web deployment | Vercel | Next.js preview deployments and the public web application |
| Local environment | Docker, Docker Compose | Reproducible frontend, backend, PostgreSQL, and optional Redis environments |
| CI/CD | GitHub Actions | Linting, type checks, tests, builds, security checks, and deployment gates |
| Infrastructure | Terraform | Version-controlled AWS resources once cloud deployment begins |
| Frontend tests | Vitest, React Testing Library, Playwright | Component behavior, interaction flows, and end-to-end user journeys |
| Backend tests | pytest | Domain rules, APIs, persistence, solar calculations, and AI integration boundaries |
| Observability | Structured logging, OpenTelemetry, CloudWatch | Error diagnosis, request tracing, performance evidence, and production monitoring |
| Security | OAuth, authorization, rate limiting, secret management | Account access, private garden data, public-community controls, and protected external APIs |

### Adoption Rules

- Add a technology when the current phase contains a working feature that uses
  it.
- Require code, tests, and operational evidence before listing a technology as
  implemented.
- Keep Redis conditional until caching or background-job measurements justify
  it.
- Introduce PostGIS with geospatial persistence and distance queries.
- Introduce pgvector with the RAG phase and evaluate retrieval quality.
- Introduce Terraform with AWS deployment so the infrastructure it manages is
  real and reviewable.
- Keep Kubernetes, Kafka, and independently deployed microservices outside the
  roadmap until scale or reliability evidence creates a concrete requirement.
- Keep deterministic physics and explicit garden constraints outside model
  inference.

This stack baseline is recorded in
[ADR-0006](decisions/0006-adopt-employment-oriented-production-stack.md).

## Architecture Principle

Use a modular monolith first.

That means one coherent product with clear internal modules:

- `sun-analysis`
- `garden-design`
- `plant-recommendation`
- `garden-journal`
- `crop-rotation`
- `local-community`
- `ai-assistant`

This keeps the project professional without pretending to need distributed
systems before there are real scale requirements.

## AI Principle

AI should not replace the parts that need deterministic correctness.

Use deterministic code for:

- Solar position.
- Shadow projection.
- Sun-hours accumulation.
- Plant filtering by explicit constraints.
- Crop rotation rules.

Use AI for:

- Explaining recommendations in beginner-friendly language.
- Turning garden logs into structured summaries.
- Generating care task suggestions from known facts.
- Answering questions with retrieved plant knowledge.
- Helping users compare layout options.

Interview-ready tradeoff:

> I kept the physics and rule-based constraints deterministic, then used AI for
> explanation and planning. That makes the system easier to test and reduces
> hallucination risk.

## Execution and Acceptance Standard

Every feature task must define its user value, scope, exclusions, acceptance
criteria, and verification before implementation begins. A feature is complete
when the agreed workflow works end to end, relevant tests pass, applicable
build and type checks pass, and the task handoff explains limitations.

An implementation claim requires working code and evidence. Planned
technologies and future capabilities remain documented as planned until that
evidence exists.

## Roadmap

### Phase 1: Demonstrable Sun Map MVP

Goal: a recruiter can open the app and complete one realistic workflow.

Required:

- Select or upload a yard image.
- Create a metric reference grid by entering its width and depth in metres,
  drawing a polygon yard boundary, and setting its north bearing.
- Draw and edit yard, house, tree, fence, and planting bed shapes with direct
  movement, resize handles, visible measurements, and precise numeric fields.
- Enter location, date, and obstacle heights in metres.
- Generate a simplified sun-hours heatmap.
- Include one built-in demo project.
- Store local state in the browser.
- Add tests for the core sun/shadow calculations.
- Update README with screenshots, limitations, and how to run it.

Do not add AI yet unless the sun map already works.

Panoramic photo calibration is deliberately excluded from this phase. The
yard-wide deterministic model must be testable before photo-based calibration
is introduced.

#### Phase 1 Acceptance Scenario

The phase is ready for review when a new user can complete this scenario in the
deployed demo:

1. Open the built-in demo yard or upload a yard image and see its metric
   reference grid and north orientation.
2. Draw or reshape a polygon yard boundary, then draw a house, a tree, a fence,
   and a planting bed using metre-based dimensions.
3. Select an object, move or resize it directly, change its height or geometry,
   and delete it.
4. Enter a location and date, then run the sun analysis.
5. See a sun-hours heatmap that changes after a meaningful obstacle or date
   change.
6. Refresh the browser and recover the saved local project state.
7. Clear the project and receive an understandable empty state.

Phase 1 verification requires:

- Unit tests for solar-position, shadow-projection, and sun-hours accumulation
  functions.
- Interaction coverage for polygon boundaries, drawing, moving, resizing,
  deleting, measuring, saving, and clearing.
- A browser-level test for the acceptance scenario.
- A production build and TypeScript check.
- README instructions, screenshots, known limitations, and expected accuracy
  boundaries.

### Phase 2: Backend and Persistence

Goal: prove backend, database, API, and testing ability.

Required:

- FastAPI backend.
- PostgreSQL database.
- Garden projects, shapes, obstacles, planting beds, and sun-analysis results.
- API validation and clear error responses.
- Backend tests.
- Docker Compose.
- GitHub Actions.

### Phase 3: Plant Recommendation and RAG

Goal: add applied AI in a controlled, explainable way.

Required:

- Structured plant database.
- Deterministic filtering by sun, climate, plant type, spacing, and season.
- RAG-grounded explanation layer.
- Structured output with `recommended`, `avoid`, `reason`, and `sources`.
- Evaluation set with 20-30 fixed questions.

### Phase 4: Garden Operations Memory

Goal: make the product useful across a whole growing season.

Required:

- Garden journal entries.
- Watering and fertilizing logs.
- Seed starting and transplant records.
- Bed history by year.
- Crop rotation warnings and suggestions.
- Monthly task view.

This phase is valuable for backend interviews because it requires real schema
design and time-based product logic.

### Phase 5: Local Garden Community

Goal: grow from a personal planner into a local gardening platform.

Possible scope:

- Listings for seedlings, seeds, cuttings, supplies, and local deals.
- Region-based search.
- Listing creation and status tracking.
- Moderation and report flow.
- Group-buy interest tracking.

This should be built only after the core planner and garden memory are stable.

### Phase 6: Public App Readiness

Goal: prepare for real users.

Required before public use:

- Authentication.
- Privacy policy and basic safety rules.
- Image storage.
- Rate limiting.
- Monitoring and logs.
- Backups.
- Abuse reporting.
- Production deployment documentation.

## What Counts as Portfolio Ready

The project is resume-ready only when:

- A user can complete a real workflow.
- Input changes produce meaningful output changes.
- The core logic has tests.
- The app has a deployed demo.
- README explains setup, architecture, and limitations.
- The user can explain the data flow without reading code.
- The user can modify one small feature and debug a common failure.

Until then, resume bullets should describe only completed functionality.

## Current Priority

Build Phase 1 first.

The next engineering milestone is not AI, marketplace, or crop rotation. It is:

> Make the canvas interaction real: draw, select, edit, and delete yard objects,
> then connect those objects to a simple sun/shadow simulation.

Everything else should be designed so it can attach cleanly later.
