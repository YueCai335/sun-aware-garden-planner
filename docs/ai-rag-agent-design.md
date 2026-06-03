# AI And RAG Design

## Principle

The app should not use AI to guess the physics. Solar position and shadow projection should be deterministic. AI should help with interpretation, planning, retrieval, and user interaction.

## RAG Knowledge Base

Possible documents and structured data:

- Local extension planting guides.
- Vegetable spacing charts.
- Plant sun requirements.
- Hardiness zone data.
- Frost dates and growing season notes.
- Companion planting and rotation guidelines.
- Disease and pest reference notes.

Plant fields:

- Common name.
- Scientific name.
- Sun requirement.
- Height.
- Spacing.
- Water needs.
- Hardiness zone.
- Days to maturity.
- Suitable season.
- Disease notes.

## RAG Query Examples

- "What can I plant in a 4-6 hour sun zone in Quebec in June?"
- "Can basil grow in part sun?"
- "What vegetables tolerate morning sun and afternoon shade?"
- "What should I avoid planting after tomatoes?"

## Agent Workflow

Planning flow:

1. Sun Analysis Agent reads heatmap summary.
2. Plant Matching Agent filters plants by sun, climate, height, and user goals.
3. Layout Agent places plants while respecting spacing and shade constraints.
4. Explanation Agent creates beginner-friendly reasoning with citations.
5. Task Agent creates planting and care tasks.

## Structured Outputs

Use structured JSON outputs for:

- Zone summaries.
- Plant recommendation lists.
- Layout suggestions.
- Monthly tasks.
- Journal entries.

Example zone recommendation:

```json
{
  "zone_id": "backyard_zone_3",
  "sun_hours": 5.2,
  "category": "part_sun",
  "recommended_plants": ["basil", "lettuce", "cilantro", "hydrangea"],
  "avoid": ["tomato", "cucumber"],
  "reason": "This area receives around 5 hours of direct sun and is better for herbs, leafy greens, and part-sun ornamentals."
}
```

## Evaluation

High-quality AI projects need evaluation.

Evaluation ideas:

- Recommendation contains source-backed facts.
- Plant sun category matches zone sun hours.
- Plant height does not block lower plants.
- Plant is compatible with local hardiness/growing season.
- Output includes clear avoid/reason fields.

## Observability

Log:

- User inputs.
- Retrieved documents.
- Agent steps.
- Recommendation outputs.
- User edits and feedback.

This makes the project stronger for interviews because it shows concern for reliability, not just prompt demos.

