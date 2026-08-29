# AI And RAG Design

## Principle

AI assists with language understanding, retrieval, and explanation. Garden
records, authorization, validation, date calculations, and crop-rotation rules
remain deterministic. Users review AI-generated record drafts before saving.

## RAG Knowledge Base

Possible documents and structured data:

- Local extension planting guides.
- Vegetable spacing charts.
- Plant water, fertilizer, and care guidance.
- Hardiness-zone, frost-date, and growing-season references.
- Crop-family and rotation guidance.
- Disease and pest reference notes.

Plant fields:

- Common name and scientific name.
- Crop family.
- Spacing, maturity, hardiness, and growing season.
- Water, fertilizer, disease, and pest notes.
- Source URL, publisher, date, and retrieval metadata.

## AI Workflows

### Garden Note Extraction

The user writes a note such as:

> Fertilized the two cherry tomatoes in the north raised bed with fish emulsion today.

The assistant returns a reviewable draft containing the growing area, affected
plants, event type, fertilizer, date, and any missing fields. The user corrects
or confirms the draft before persistence.

### Grounded Garden Questions

Example questions:

- "What should I plant after tomatoes in this raised bed next year?"
- "Which care tasks are due for my basil this week?"
- "Can I use this fertilizer on the plants in my container area?"

The assistant receives the user's garden facts, retrieves relevant horticultural
sources, applies deterministic constraints, and returns an explanation with
citations and uncertainty where needed.

### Planning Assistance

The assistant can prepare a user-editable plan that includes suggested plants,
rotation warnings, task dates, assumptions, and citations. Explicit constraints
such as a growing area, season, available space, and edible-or-ornamental goal
remain visible in the output.

## Structured Outputs

Use structured JSON outputs for:

- Garden-event drafts.
- Missing-field questions.
- Plant and care recommendations.
- Rotation-warning explanations.
- Task suggestions.
- Source citations and confidence notes.

Example garden-event draft:

```json
{
  "event_type": "fertilized",
  "growing_area": "north-raised-bed",
  "affected_plants": ["cherry tomato"],
  "fertilizer": "fish emulsion",
  "date": "2026-08-29",
  "requires_user_review": true
}
```

## Evaluation

High-quality AI features require repeatable evaluation.

Evaluation cases should verify:

- Extracted fields match the supplied note or ask for missing information.
- The assistant does not invent a garden area, plant, or event.
- Recommendations cite retrieved sources.
- Rotation advice respects stored crop history and deterministic constraints.
- Unsafe or uncertain advice communicates its boundary.

## Observability

Record the user input, retrieved sources, structured output, user edits, error
state, latency, and evaluation outcome. Sensitive garden data remains protected
and follows the account's retention and deletion rules.
