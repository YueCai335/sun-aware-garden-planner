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

## Recommended Tech Stack

Frontend:

- Next.js.
- React.
- TypeScript.
- Canvas or SVG annotation layer.
- Playwright for end-to-end checks.

Backend:

- Python.
- FastAPI.
- Pydantic validation.
- pytest for backend tests.

Data:

- PostgreSQL.
- SQLAlchemy or SQLModel.
- Alembic migrations.
- pgvector later for plant knowledge retrieval.

AI:

- OpenAI API for structured outputs and explanations.
- RAG over plant and climate knowledge.
- Agent-style workflows only after the data model and deterministic rules are
  stable.

DevOps and quality:

- Docker Compose for local frontend, backend, and database.
- GitHub Actions for type checks, tests, and builds.
- Basic logging and error responses.
- Deployment with Vercel plus Render, Fly.io, or similar.

Avoid for now:

- Kubernetes.
- Premature microservices.
- Complex auth before the core demo works.
- AI-first architecture where the model guesses facts that should come from
  code or data.

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

## Roadmap

### Phase 1: Demonstrable Sun Map MVP

Goal: a recruiter can open the app and complete one realistic workflow.

Required:

- Select or upload a yard image.
- Draw and edit yard, house, tree, fence, and planting bed shapes.
- Enter location, date, and obstacle heights.
- Generate a simplified sun-hours heatmap.
- Include one built-in demo project.
- Store local state in the browser.
- Add tests for the core sun/shadow calculations.
- Update README with screenshots, limitations, and how to run it.

Do not add AI yet unless the sun map already works.

Panoramic photo calibration is deliberately excluded from this phase. The
yard-wide deterministic model must be testable before photo-based calibration
is introduced.

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
