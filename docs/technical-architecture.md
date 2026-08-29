# Technical Architecture

## High-Level Components

Frontend:

- Image upload.
- Yard annotation canvas.
- Map/geospatial view.
- Heatmap rendering.
- Plant recommendation UI.
- Garden assistant chat.

Backend:

- User project storage.
- Geocoding and coordinate handling.
- Solar position service.
- Shadow simulation service.
- Plant recommendation API.
- RAG retrieval API.
- Garden memory and logs.

Database:

- Users.
- Gardens.
- Aerial images.
- Annotated shapes.
- Obstacles and heights.
- Planting zones.
- Sun exposure results.
- Plant knowledge base.
- Garden logs.

## Target Stack

Frontend:

- Next.js.
- TypeScript.
- React.
- Tailwind CSS.
- shadcn/ui.
- React-Konva for editable yard geometry, direct manipulation, and image layers.
- Canvas for raster heatmaps.
- MapLibre or Leaflet only when a geographic map workflow is introduced.

Backend:

- FastAPI with Python.
- Pydantic for API validation and pytest for backend tests.
- See [ADR-0002](decisions/0002-use-fastapi-python-backend.md) for the
  decision and rejected alternatives.

Data:

- PostgreSQL.
- pgvector for plant knowledge retrieval.
- PostGIS for persisted yard geometry, regional search, and distance queries.

Geometry:

- Yard-local metric coordinates and north bearing on the frontend and backend
  project model.
- Shapely on backend.
- Turf.js on frontend if client-side geometry is needed.

Solar:

- Python astral or pvlib.
- JavaScript suncalc for lightweight browser preview.

AI:

- OpenAI API for structured outputs, RAG answer generation, tool calling, and
  planning assistance.
- Evaluation datasets, citations, fallbacks, and guardrails for AI quality.
- Avoid relying on AI for the core shadow math.

Deployment:

- Vercel for frontend.
- AWS ECS Fargate for the FastAPI container.
- Amazon RDS for PostgreSQL, PostGIS, and pgvector.
- Amazon S3 for user images and derived assets.
- CloudWatch for backend logs and metrics.
- Docker for reproducible local development.
- GitHub Actions for tests and linting.
- Terraform for version-controlled AWS infrastructure.

## Staged Cloud Adoption

- Phase 1 keeps the deterministic sun-map workflow local and deploys the web
  demo when it is usable.
- Phase 2 introduces FastAPI, PostgreSQL, Docker Compose, and CI before the AWS
  production environment.
- The first AWS deployment uses S3, RDS, ECS Fargate, and CloudWatch.
- Terraform begins when those resources exist and can be validated.
- Redis is introduced with a measured caching or background-job requirement.

The employment-oriented production baseline and its boundaries are recorded in
[ADR-0006](decisions/0006-adopt-employment-oriented-production-stack.md).
Metric geometry and the browser editing layer are recorded in
[ADR-0007](decisions/0007-use-metric-yard-coordinates-and-react-konva-editor.md).

## Architecture Decisions

Decisions that affect architecture, product correctness, cost, security, or
long-term maintainability are recorded in
[Architecture Decision Records](decisions/README.md). Each record includes the
selected approach, rejected alternatives, consequences, and conditions for
reconsideration.
