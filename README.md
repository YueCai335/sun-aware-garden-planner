# Sun-Aware Garden Planner

An AI-assisted garden planning app that turns an address and yard imagery into a sun exposure map and planting plan.

## Core Idea

Many beginner gardeners know plant labels such as "full sun", "part sun", and "shade", but they do not know how those categories map to their real yard. They also cannot stand outside for 12 hours to track light and shadows.

This app helps users answer:

- Which parts of my yard receive 6-8+ hours of direct sun?
- Which parts are part sun or mostly shaded?
- How do my house, trees, fence, and garden structures cast shadows through the day?
- What can I plant in each zone?

## Product Goal

Input:

- Address or coordinates.
- Aerial yard image, such as a Google Maps or Apple Maps screenshot.
- Optional guided sky panoramas from important yard locations for later calibration.
- User-marked yard boundary, house, trees, beds, fence, and other obstacles.
- Approximate obstacle heights.

Output:

- Sun exposure heatmap.
- Full sun, part sun, part shade, and shade zones.
- Estimated direct sun hours for each area.
- RAG-grounded plant recommendations for the user's local climate.

## MVP Scope

The first version is intentionally semi-automatic:

1. Upload an aerial yard image.
2. Enter address or coordinates.
3. Draw yard boundary, house footprint, trees, and planting areas.
4. Enter approximate heights for house, fence, trees, and trellises.
5. Simulate shadows every 15 minutes for a selected date or month.
6. Generate a sun-hours heatmap.
7. Recommend plants by sun category and local climate.

The MVP does not need expensive satellite data, LiDAR, or fully automatic 3D reconstruction.

## Why This Is A Strong CS Project

This is not a basic gardening tracker or CRUD app. It combines:

- Full-stack product engineering.
- Geospatial UI.
- Solar geometry.
- Shadow projection.
- Image annotation.
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

This project now starts with a small Next.js + TypeScript frontend. The first
implementation target is a manual sun-map MVP, not the full AI planner.

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

Current starter structure:

```text
src/app/page.tsx
src/components/Toolbar.tsx
src/components/YardCanvas.tsx
src/components/YardEditor.tsx
src/components/HeatmapLegend.tsx
src/lib/types.ts
```

## Current Yard Editor

The starter app includes a locally saved manual yard editor. Choose a drawing
tool and click the canvas to add a yard boundary, house, tree, fence, or
planting bed. Select an element to drag it, adjust its geometry and obstacle
height, or delete it. Clear creates an empty project, and Load demo restores
the built-in example. Location, date, and yard elements persist in the current
browser.

Run the component tests with:

```bash
npm test
```
