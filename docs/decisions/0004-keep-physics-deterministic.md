# ADR-0004: Keep Solar Physics Deterministic and Constrain AI

- Status: Accepted
- Date: 2026-08-15

## Context

Sun position, shadow projection, direct-sun duration, and crop-rotation rules
must be reproducible and testable. AI is useful for interpreting images and
natural language, but generated answers are probabilistic and can be wrong.

## Decision

Use deterministic code and structured data for physical calculations and hard
constraints. Use AI only for tasks such as assisted image segmentation,
retrieval-grounded explanations, structured note extraction, and planning
suggestions that the user can inspect or correct.

## Why This Option

- The same inputs produce the same core result.
- Physics and business rules can have unit tests and known error tolerances.
- AI adds usability where ambiguity exists without becoming the source of
  physical truth.

## Alternatives Not Selected

### Ask a Multimodal Model to Estimate Sunlight Directly

This could produce a quick demo, but it cannot guarantee geometric consistency,
repeatability, or calibrated uncertainty. It would be difficult to defend when
users make planting decisions from the result.

### Remove AI Entirely

This would maximize determinism but lose useful assistance for image masks,
garden notes, knowledge retrieval, and explanations. The problem is not AI
itself; it is assigning AI authority over facts that code can calculate.

## Consequences

- The system must expose which results are calculated and which are generated.
- AI outputs need schemas, source grounding, evaluation, and user correction.
- The core MVP can operate before an AI provider is connected.

## Revisit When

Individual AI tasks may gain more autonomy only after a measured evaluation set
shows acceptable accuracy and a fallback or correction path exists.
