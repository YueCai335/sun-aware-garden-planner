# ADR-0035: Use Reviewable Plant Health Records

- Status: Accepted
- Date: 2026-09-01
- Related: [ADR-0032](0032-use-local-first-ai-providers-for-care-notes.md) and [ADR-0034](0034-use-workspace-and-garden-care-targets.md)

## Context

Gardeners need to preserve symptom observations and photo evidence for a
specific garden, planting area, or plant group. Free-form notes alone make it
hard to compare a concern over time. Plant-health suggestions also carry a
safety risk when an AI model presents uncertain observations as a diagnosis or
treatment plan.

The first portfolio implementation uses the local `qwen3:4b` Ollama model. It
accepts text and structured JSON, while it does not inspect uploaded photos.

## Decision

Add a dedicated Plant Health workflow with reviewable records.

- A record belongs to one garden, one planting area, or one plant group.
- Users can attach up to three JPEG, PNG, or WebP images as local evidence.
- Docker stores the image files in a named local volume and PostgreSQL stores
  relative upload paths with the structured record.
- The configured AI provider receives the written observation, concern level,
  photo count, and garden context.
- The AI response contains a summary, possible issues, confidence, low-risk
  next steps, and follow-up questions.
- Users review and edit the response before saving it to health history.
- The assessment avoids certainty, chemical product recommendations, doses,
  and automated treatment actions.

## Why This Option

- Symptom, target, evidence, and assessment remain connected in one durable
  record.
- The workflow provides a real local AI integration with structured output and
  clear safety limits for a portfolio demonstration.
- Review before persistence keeps the gardener responsible for the final
  record and supports correction of local-model mistakes.
- Local Docker storage fits the private Mac-local development phase without
  introducing cloud storage cost or account setup.

## Alternatives Considered

### Automatic Diagnosis and Treatment

The available evidence and local model quality do not support a reliable
diagnosis or a safe treatment recommendation.

### Image-Only Diagnosis

Image inference needs a vision-capable model, image evaluation work, and a
separate accuracy and safety review. Written observations provide a useful
first workflow with the installed local model.

### Browser-Only Image URLs

Browser URLs do not provide durable evidence after reloads or across sessions.

### Cloud Object Storage Now

Cloud storage requires authentication, access controls, cost management, and
deployment configuration before the project needs them.

## Consequences

- Workspace schema version 10 adds health records to each garden.
- Developers restart Docker Compose after this feature so Alembic can create
  the health-record table and Docker can mount the photo volume.
- Image evidence is local to the development environment and public access is
  acceptable only for the current private local workflow.
- Removing a photo before saving the record can leave an unused local upload;
  lifecycle cleanup is deferred until record editing and deletion are added.
- A future hosted deployment needs authenticated storage, authorization,
  retention rules, and observability for AI quality and safety.

## Revisit When

Revisit when the project uses a vision-capable model, deploys for external
users, adds record editing and deletion, or has source-grounded guidance that
can support carefully scoped care recommendations.
