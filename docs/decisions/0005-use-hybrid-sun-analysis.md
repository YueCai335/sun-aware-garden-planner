# ADR-0005: Combine an Aerial Yard Model with Panoramic Calibration

- Status: Accepted
- Date: 2026-08-15

## Context

The product needs a yard-wide sun-hours heatmap. A few ordinary photos only show
lighting at particular moments and do not uniquely describe the height and shape
of every obstacle. A full automatic 3D reconstruction would require more capture
guidance, data, computation, and validation than the MVP can support.

## Decision

Use two complementary stages:

1. Build the yard-wide heatmap from an aerial image, user-marked obstacles,
   approximate heights, and deterministic solar geometry.
2. Later collect guided sky panoramas at selected yard points and use
   sky-versus-obstacle masks to calibrate the model.

## Why This Option

- Manual geometry provides enough explicit information for an explainable MVP.
- The aerial model produces a result for the whole yard, not just one camera
  position.
- Panoramas provide real obstruction evidence at important points and can reveal
  errors in user-entered heights or shapes.
- Each stage has an independent testable output.

## Alternatives Not Selected

### Two or Three Time-Specific Photos

These images can validate shadows at the captured moments, but they do not
contain enough information to infer a complete yard model or reliable annual
sun exposure.

### Photo-Only Panoramic Measurement

A panorama can estimate sun access at its capture point, but several panoramas
would be needed for spatial coverage and would still not naturally produce a
continuous yard-wide heatmap.

### Automatic 3D Reconstruction, LiDAR, or NeRF First

These approaches may eventually reduce manual input, but they add capture,
hardware, processing, and validation complexity before the core product value
has been demonstrated.

### Open Geospatial 3D Data Only

Public building and canopy data can help later, but coverage, height accuracy,
and freshness vary by location. User correction is still necessary at garden
scale.

## Consequences

- The MVP asks users for approximate geometry and height information.
- Results must show assumptions and confidence limitations.
- Photo calibration is deferred until the deterministic heatmap works.
- The later vision feature supplements the model instead of silently replacing
  user data.

## Revisit When

Reconsider the capture strategy after testing real yards. Adopt more automatic
3D inputs only if they reduce user effort while meeting documented accuracy,
coverage, licensing, cost, and privacy requirements.
