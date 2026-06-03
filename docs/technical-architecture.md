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

## Suggested Stack

Frontend:

- Next.js.
- TypeScript.
- React.
- Tailwind CSS.
- shadcn/ui.
- Leaflet or Mapbox.
- Canvas/SVG annotation layer.

Backend:

- FastAPI with Python, or Node.js with TypeScript.
- Python may be better for geometry and solar calculations.

Data:

- PostgreSQL.
- pgvector for plant knowledge retrieval.
- PostGIS later if geospatial queries become important.

Geometry:

- Shapely on backend.
- Turf.js on frontend if client-side geometry is needed.

Solar:

- Python astral or pvlib.
- JavaScript suncalc for lightweight browser preview.

AI:

- OpenAI API for structured outputs, RAG answer generation, and planning assistant.
- Avoid relying on AI for the core shadow math.

Deployment:

- Vercel for frontend.
- Render or Fly.io for backend.
- Supabase for PostgreSQL and pgvector.
- Docker for reproducible local development.
- GitHub Actions for tests and linting.

## Why Not AWS First

AWS can be added later, but it is not required for the MVP. For a student project, a deployed full-stack app with Docker, CI, PostgreSQL, vector search, and a clear demo is higher ROI than spending early time wiring cloud infrastructure.

AWS extensions for later:

- S3 for image storage.
- RDS for PostgreSQL.
- Lambda for async analysis jobs.
- ECS/Fargate for backend.

