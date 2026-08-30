# ADR-0009: Use Address-Guided Map Initialization and Point Sky Calibration

- Status: Accepted
- Date: 2026-08-29
- Supersedes: [ADR-0005](0005-use-hybrid-sun-analysis.md)

## Context

The initial yard editor asks a user to create the site by hand before the app
shows useful context. That workflow places too much effort on the user and
makes a blank drawing plane feel disconnected from the real yard.

An address and licensed satellite imagery can establish a useful visual
starting point. Imagery can reveal some large footprints, while trees,
structures under canopy, property edges, dimensions, and heights still require
review at residential-garden scale.

The product also needs evidence of the actual sky obstruction at important
planting locations. A guided upward-looking sky capture can provide that
evidence at one point. A short sequence of ordinary photos captured at known
times records observed shadows for those moments. Neither input alone provides
a dependable continuous model of the whole yard.

## Decision

Use an address-guided, map-assisted and observation-calibrated sun-analysis
workflow.

1. The first-use workflow begins with an address and a licensed map-provider
   base layer. The provider is selected only when the map integration is built.
2. The user confirms or corrects the property boundary and important solar
   obstacles shown on the base layer. The metric editor remains the correction
   tool for geometry, dimensions, and heights.
3. The yard-wide analysis uses user-confirmed geometry and deterministic solar
   position and shadow calculations. Results expose their assumptions and
   confidence limits.
4. The user can select important ground locations and complete a guided,
   upward-looking sky capture with location and orientation metadata. Computer
   vision derives a sky-versus-obstacle mask, manual correction is available,
   and deterministic solar paths calculate direct-sun windows for that point.
5. A fixed-camera, time-stamped photo sequence can produce an observed-shadow
   timeline for selected times. It supplies validation evidence for the modeled
   result and does not independently claim a continuous yard-wide heatmap.
6. The product stores user-confirmed geometry and capture metadata. Map imagery
   stays subject to the selected provider's display, attribution, retention,
   privacy, and cost terms.

## Why This Option

- Address-guided imagery gives users immediate yard context and reduces blank
  canvas work.
- User confirmation keeps the product accurate when aerial imagery is stale,
  occluded, or incomplete.
- Deterministic solar calculations generalize an observation across dates and
  time windows in a way a few photos cannot.
- Point sky captures observe real tree canopy, buildings, and nearby obstructions
  from the place where a plant will grow.
- The workflow creates an explainable applied-AI surface: computer vision
  proposes and classifies visual evidence, while the product exposes corrections,
  assumptions, and validation evidence.

## Alternatives Considered

### Manual Geometry as the Primary First-Use Workflow

The existing editor remains valuable for correction and detailed work. Requiring
it before any site context creates too much setup effort for a new user.

### Two or Three Ordinary Photos as the Sole Sun Analysis

Time-stamped photos reveal real shadows at the captured moments. They lack
continuous spatial coverage, stable camera geometry, and enough depth evidence
for an annual yard-wide result.

### Automatic 3D Reconstruction as the First Release

Structure-from-Motion, LiDAR, and similar capture workflows need extensive
overlapping imagery, device support, background processing, quality evaluation,
and clear failure handling. They belong in a later applied-vision phase.

### Public Geospatial Data as the Only Source of Geometry

Coverage, height accuracy, freshness, licensing, and canopy visibility vary
across residential locations. User confirmation remains essential.

## Consequences

- A map-provider adapter, geocoding, attribution, privacy review, and cost
  controls become planned product requirements.
- The frontend will need an address-to-map onboarding flow, visible source and
  confidence cues, and a clear transition into the metric correction editor.
- The future backend will store gardens, confirmed geometry, capture metadata,
  analysis results, and user-owned photos separately from provider imagery.
- The sun-analysis module will distinguish modeled yard-wide results, point
  measurements, and observed-shadow validation records.
- The current local editor remains a valid interim workflow while map-backed
  initialization and photo capture are built.

## Revisit When

Reconsider this decision after usability tests on real yards, provider pricing
or licensing changes, privacy requirements, or measured evidence that a guided
3D reconstruction workflow reduces effort while meeting accuracy targets.
