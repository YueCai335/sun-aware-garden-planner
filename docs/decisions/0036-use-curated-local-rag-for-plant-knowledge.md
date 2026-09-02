# ADR-0036: Use Curated Local RAG for Plant Knowledge

- Status: Accepted
- Date: 2026-09-01
- Related: [ADR-0032](0032-use-local-first-ai-providers-for-care-notes.md) and [ADR-0035](0035-use-reviewable-plant-health-records.md)

## Context

Plant-health records capture what a gardener observed. Gardeners also need a
separate global place to ask a care or plant question and inspect the sources
behind the answer. A general language model can produce fluent responses while
it may lack current horticultural evidence or omit the limits of its knowledge.

The portfolio project needs a RAG workflow that runs on the local Mac without
per-request API cost, supports Chinese and English questions, and remains
small enough to explain in a junior engineering interview.

## Decision

Use a curated, local RAG workflow for the global Plant Knowledge module.

- The project maintains a small set of source cards in version-controlled
  seed data. Each card has an authored summary, source title, publisher, URL,
  topic tags, and review date.
- The first sources come from government agencies and university extension
  programs. The project stores its own short summaries and links to each
  original source page.
- Ollama runs `embeddinggemma` locally to create multilingual text embeddings.
- PostgreSQL stores the knowledge chunks and their vectors through `pgvector`.
- The retrieval path uses exact cosine-distance search for the initial small
  corpus. Database metadata preserves the publisher, URL, and review date for
  every retrieved item.
- Ollama `qwen3:4b` generates an answer only from the retrieved evidence and
  optional selected-garden context.
- The UI always displays the retrieved source cards. Weak retrieval produces a
  clear request for more detail or a recommendation to consult an appropriate
  local resource.
- A fixed evaluation dataset checks expected source retrieval, citations, and
  cautious handling of unsupported questions.

## Why This Option

- The data flow is easy to inspect: source card, embedding, retrieval, answer,
  citation, and evaluation each have a direct owner.
- Local embeddings and generation avoid API cost during the portfolio phase.
- A curated corpus keeps early sources high quality and avoids unreviewed web
  ingestion.
- Source citations make the feature useful to gardeners and demonstrate
  grounded-AI engineering.
- Exact search is simple and deterministic for a small corpus. Approximate
  indexing can follow measured corpus growth.

## Alternatives Considered

### Bulk Web Crawling

Bulk crawling requires site-specific permissions, freshness management,
duplicate handling, and more extensive evaluation. The initial curated corpus
provides a controlled foundation.

### Managed Embedding and Generation APIs

Managed APIs provide a convenient hosted path while they introduce billing and
separate key management during local development.

### A RAG Framework as the First Integration Layer

Frameworks such as LangChain and LlamaIndex can support larger systems. A
small direct FastAPI implementation keeps the retrieval contract, validation,
and tests visible in this portfolio project.

### Answers Without Citations

Answers without visible provenance would make it difficult for gardeners to
check guidance and for the project to evaluate grounding quality.

## Consequences

- Developers download one additional local embedding model before using Plant
  Knowledge.
- Docker Compose uses a PostgreSQL image with `pgvector` available.
- The initial corpus covers selected common garden questions and leaves broad
  diagnoses, chemical treatment, and local regulations outside the answer
  scope.
- Source cards need periodic review as linked guidance changes.
- A future public product needs source licensing review, content governance,
  authorization, rate limits, and quality monitoring.

## Revisit When

Revisit when the corpus grows enough to justify hybrid retrieval or an
approximate index, when external contributors maintain sources, when a hosted
deployment requires a managed embedding provider, or when measured evaluation
results identify retrieval gaps.
