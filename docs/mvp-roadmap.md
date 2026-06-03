# MVP Roadmap

## Phase 1: Manual Sun Map

Goal: generate a usable sun-hours heatmap from user-marked shapes.

Features:

- Upload aerial image.
- Enter address or coordinates.
- Draw yard boundary.
- Draw obstacles: house, trees, fence, shed, trellis.
- Enter obstacle heights.
- Select date or month.
- Run shadow simulation.
- Display sun-hours heatmap.

Success criteria:

- User can visually identify full sun, part sun, and shade zones.
- Output is explainable and adjustable.
- No AI dependency required for the core sun calculation.

## Phase 2: Plant Recommendations

Goal: convert sun zones into useful planting advice.

Features:

- Plant database with sun needs, height, spacing, hardiness, and basic notes.
- Local climate inputs: hardiness zone, frost dates, growing season.
- RAG-grounded recommendation explanations.
- User can click a zone and ask "what can I plant here?"

Success criteria:

- Recommendations cite sources or local database facts.
- App explains why a plant fits or does not fit.

## Phase 3: Agentic Garden Planner

Goal: create planning workflows instead of single-turn answers.

Agents:

- Sun Analysis Agent: summarizes light conditions.
- Plant Matching Agent: filters plants by sun, height, zone, and season.
- Layout Agent: proposes a planting layout.
- Care Task Agent: turns plan into monthly tasks.
- Journal Agent: converts user notes into structured garden memory.

Success criteria:

- Agent output is structured and inspectable.
- User can revise constraints, such as "low maintenance" or "more edible plants".

## Phase 4: Photo Calibration

Goal: use real yard photos to calibrate simulated shadows.

Features:

- Ask user to take photos at 9 AM, 12 PM, 3 PM, and optionally 5 PM on a sunny day.
- User marks observed shadow boundaries.
- System compares simulated shadows with observed shadows.
- App suggests adjusting obstacle height or shape.

Success criteria:

- Simulated shadow map becomes closer to real observed shadow boundaries.

## Phase 5: Advanced Automation

Possible later features:

- Automatic house/tree segmentation from aerial imagery.
- Computer vision support for leaf disease and pest symptoms.
- Weather-aware watering and frost alerts.
- Year-to-year crop rotation memory.
- Optional cloud deployment on AWS if needed for resume or scale.

