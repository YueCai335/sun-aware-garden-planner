# Sun-Aware Garden Planner

An AI-assisted garden operations and planning app for tracking gardens across
seasons, organizing care, and creating reviewable planning guidance.

## Core Idea

Garden information is often spread across memory, paper notes, photos, plant
labels, and calendar reminders. This makes it hard to remember what happened,
plan care, or rotate crops across growing areas and seasons.

This app helps users answer:

- What did I plant, water, fertilize, or harvest in each growing area?
- Which care tasks are due soon?
- Which crops grew in this area last season?
- What can I plant next while respecting rotation constraints?

## Product Goal

Input:

- Gardens and named growing areas.
- Plants, crop families, planting dates, and seasonal history.
- Watering, fertilizer, transplanting, harvest, pest, and observation records.
- Planned care tasks and free-text garden notes.

Output:

- Searchable garden history and upcoming care tasks.
- Crop-rotation warnings and planning suggestions.
- Reviewable structured records extracted from a garden note.
- RAG-grounded plant and care guidance with citations.

## MVP Scope

The first version focuses on a reliable seasonal workflow:

1. Create a garden and named growing areas.
2. Add plants and record garden activity.
3. Create and complete future care tasks.
4. Preserve the browser-saved garden through refreshes.
5. Add crop rotation and AI-assisted record extraction after the operations
   workflow is stable.

## Why This Is A Strong CS Project

This project combines:

- Full-stack product engineering.
- Temporal product and workflow design.
- Relational data modeling.
- API validation and authorization.
- Deterministic crop-rotation rules.
- RAG-grounded recommendations.
- Agentic planning workflow.
- Structured garden memory.
- Explainable AI output.

## Target Production Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui.
- Backend: Python, FastAPI, Pydantic, REST, OpenAPI.
- Data: PostgreSQL, PostGIS, pgvector, SQLAlchemy, Alembic.
- AI: OpenAI API, RAG, structured outputs, tool calling, evaluations.
- Cloud: AWS ECS Fargate, RDS, S3, CloudWatch, plus Vercel for the web
  application.
- Delivery: Docker, Docker Compose, GitHub Actions, Terraform.
- Quality: Vitest, React Testing Library, Playwright, pytest, structured
  logging, OpenTelemetry, and request tracing.

The canonical employment positioning, technology-to-feature mapping, and
adoption rules are maintained in [Project Strategy](docs/project-strategy.md).

## Project Documents

- [Product Brief](docs/product-brief.md)
- [MVP Roadmap](docs/mvp-roadmap.md)
- [Technical Architecture](docs/technical-architecture.md)
- [Project Strategy](docs/project-strategy.md)
- [Architecture Decision Records](docs/decisions/README.md)
- [Sun And Shadow Algorithm](docs/sun-shadow-algorithm.md)
- [AI And RAG Design](docs/ai-rag-agent-design.md)
- [Resume Positioning](docs/resume-positioning.md)

## Local App Setup

This project currently starts with a small Next.js + TypeScript frontend. The
active implementation target is the Garden Operations MVP.

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

To enable address search and the satellite map, copy `.env.local.example` to
`.env.local` and replace its placeholder with a URL-restricted Mapbox public
token. Keep `.env.local` outside Git.

Current starter structure:

```text
src/app/page.tsx
src/components/Toolbar.tsx
src/components/YardCanvas.tsx
src/components/YardCanvasClient.tsx
src/components/YardEditor.tsx
src/components/HeatmapLegend.tsx
src/lib/types.ts
```

## Current Yard Editor Prototype

The local yard editor is a retained prototype for future map-backed garden
layout and sun-analysis research. It uses a V2 metre-based reference grid, a
simple polygon yard boundary, and a visible north bearing.

Choose house, tree, fence, or planting bed and click the reference grid to add
it. Select an object to drag it, resize it with four corner controls, enter
exact metre values, set obstacle height where it applies, or delete it. Object
bounds stay inside the reference grid. Projects, including the north bearing,
persist in the current browser through refreshes.

Saved V1 drafts use percentage coordinates. On the first V2 visit, the editor
asks for the real reference-grid width and depth before converting and saving
the layout. This preserves the legacy layout without inventing a physical scale.

The browser editor uses React-Konva with Konva 10 for client-side drawing.

The address map uses Mapbox GL JS and Mapbox Search JS. Address results remain
in the current map session. The active product roadmap defers map-based
onboarding and yard-wide sun analysis until Garden Operations is stable.

Run the component tests with:

```bash
npm test
```

## Local Backend Foundation

The FastAPI and PostgreSQL foundation supports an explicit, one-time import of
a browser workspace. Its setup, REST endpoints, and local verification steps
are in [Backend Foundation](backend/README.md).
