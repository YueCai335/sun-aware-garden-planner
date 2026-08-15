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

## Phase 4: Panoramic Photo Calibration

Goal: use point-based sky observations to calibrate the yard-wide simulation.

Features:

- User selects important measurement points on the yard map.
- At each point, the app guides the user through a sky panorama capture.
- Capture location, direction, and camera orientation metadata.
- Segment the panorama into sky and obstacles, with manual correction.
- Project the calculated solar path onto the sky mask.
- Estimate direct-sun hours for the selected date or month.
- Compare point estimates with the yard-wide heatmap.
- Suggest adjustments to nearby obstacle height or shape when results differ.
- Allow time-specific yard photos as optional validation evidence.

Success criteria:

- Point estimates are explainable and reproducible.
- Calibration improves agreement between observed obstructions and the
  simulated heatmap.
- The feature does not infer a complete 3D yard from two or three ordinary
  photos.

## Phase 5: Advanced Automation

Possible later features:

- Automatic house/tree segmentation from aerial imagery.
- Computer vision support for leaf disease and pest symptoms.
- Weather-aware watering and frost alerts.
- Year-to-year crop rotation memory.
- Optional cloud deployment on AWS if needed for resume or scale.
