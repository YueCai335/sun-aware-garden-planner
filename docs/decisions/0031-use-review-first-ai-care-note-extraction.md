# ADR-0031: Use Review-First AI Care Note Extraction

- Status: Superseded by [ADR-0032](0032-use-local-first-ai-providers-for-care-notes.md)
- Date: 2026-09-01

## Context

Gardeners often write care notes in Chinese or English after completing work.
Those notes can include dates, care actions, fertilizer details, and a garden
target. The Garden Operations workflow already stores reviewed care events in
PostgreSQL, so extracted fields must preserve its validation and history rules.

The feature needs a real applied-AI integration that is useful, testable, and
safe to explain in an interview. API credentials and external-service errors
also need a clear operational boundary.

## Decision

Use an OpenAI Responses API call from FastAPI to create one structured care
draft from one free-text garden note.

- The API key stays in the ignored root `.env.local` file and is available only
  to the Docker API service.
- The default model is `gpt-5.6-luna`, configurable through `OPENAI_MODEL`.
- The request uses strict JSON Schema structured output and `store: false`.
- The model receives only the selected garden name, planting-area names, plant
  group names, today's date, and the submitted note.
- Pydantic validates the model response. The backend resolves an AI-provided
  target only when it uniquely matches a known garden item.
- The frontend exposes every field for user review and edits. Saving creates a
  standard Care History event through the existing PostgreSQL workspace sync.
- Tests use fixed fake extractor responses for Chinese and English note cases.

## Why This Option

- Gardeners can enter natural notes quickly while retaining control over the
  durable record.
- Strict structured output keeps the API contract narrow and testable.
- Backend-only credentials avoid exposing an OpenAI key in the browser bundle.
- Reusing Care History preserves the existing edit, deletion, and
  target-history behavior.

## Alternatives Considered

### Rule-Based Text Parsing

Rules can support a small command syntax, but mixed Chinese and English notes
with varied fertilizer wording require a large and brittle parser.

### Frontend OpenAI Calls

Browser requests would expose the API key and remove the backend validation
boundary.

### Immediate Database Writes

An extraction can omit or misread a date, target, or amount. The review screen
keeps the gardener responsible for the final record.

### RAG, Tool Calling, and Multi-Step Agents

Care-note extraction needs a constrained structured response. Retrieval and
tools will be evaluated with source-based plant-care questions in a later
phase.

## Consequences

- Local users add an `OPENAI_API_KEY` to `.env.local` and rebuild the API
  container before using the feature.
- AI requests incur provider cost and can return service errors. The UI keeps
  the original note available for another attempt.
- A missing date or care type requires a user selection during review.
- The feature has deterministic API-boundary tests. Live provider evaluation
  begins after a key is configured and representative notes are collected.

## Revisit When

Revisit when the product adds authenticated users, shared gardens, a source
library for horticultural questions, batch note ingestion, or measured quality
evidence that supports a different model or extraction approach.
