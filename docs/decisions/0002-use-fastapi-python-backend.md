# ADR-0002: Use FastAPI for the Application Backend

- Status: Accepted for backend phase
- Date: 2026-08-15

## Context

The backend will validate garden data, run solar and geometry calculations,
store analysis results, and later support image processing and RAG. The project
also needs a backend stack that can be tested and explained clearly in junior
backend and applied-AI interviews.

## Decision

Use Python with FastAPI, Pydantic, and pytest for the application backend.

## Why This Option

- Python has mature libraries for solar calculations, geometry, image
  processing, data analysis, and AI integration.
- FastAPI provides typed request validation and generated API documentation
  without a large framework footprint.
- Pydantic models make API contracts explicit and testable.

## Alternatives Not Selected

### Next.js Route Handlers as the Only Backend

This would simplify deployment and keep one language, but Python is a better fit
for the planned scientific and computer-vision work. Keeping all logic in the
web framework would also make backend ownership less visible in the portfolio.

### Node.js with Express or NestJS

Node.js would share TypeScript with the frontend. It was not selected because
the project's differentiating workloads are better supported by Python, and
adding a second backend implementation would create duplication without a user
benefit.

### Django

Django is mature and includes more built-in product features, but its larger
surface is unnecessary for the first API-focused backend. It can be reconsidered
if the product later needs a tightly integrated admin-heavy platform.

## Consequences

- Frontend and backend use different languages and require an explicit API
  contract.
- Scientific and AI libraries can be integrated without a separate service.
- Deployment includes two application processes instead of one.

## Revisit When

Reconsider if operations show that a single-language deployment would provide a
meaningful maintenance benefit, or if backend requirements become dominated by
features better served by another framework.
