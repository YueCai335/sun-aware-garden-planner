# Sun And Shadow Algorithm

## Goal

Estimate how many hours of direct sun each part of a yard receives.

## Inputs

- Latitude and longitude.
- Date or date range.
- Aerial image scale and orientation.
- Yard boundary polygon.
- Obstacle polygons:
  - House footprint.
  - Tree canopy.
  - Fence.
  - Shed.
  - Trellis.
- Obstacle heights.

## Solar Position

For each timestamp, compute:

- Solar azimuth: compass direction of the sun.
- Solar elevation: sun angle above the horizon.

Open-source options:

- `astral` for Python.
- `suncalc` for JavaScript.
- NOAA/NREL-style formulas.

## Shadow Length

Basic formula:

```text
shadow_length = obstacle_height / tan(solar_elevation)
```

When solar elevation is low, shadows are long. When elevation is high, shadows are short.

## Shadow Direction

The shadow points away from the sun:

```text
shadow_direction = solar_azimuth + 180 degrees
```

## Shadow Projection

For each obstacle polygon:

1. Compute shadow vector using shadow length and direction.
2. Translate the obstacle polygon by that vector.
3. Create a projected shadow polygon between the original obstacle and translated polygon.
4. Clip the shadow polygon to the yard boundary.

## Sun-Hours Accumulation

1. Divide the yard into a grid, such as 20 cm or 50 cm cells.
2. For each timestamp, mark cells as shaded or sunlit.
3. Add time interval length to sunlit cells.
4. Render accumulated hours as a heatmap.

Example categories:

- 8+ hours: full sun.
- 6-8 hours: full sun.
- 4-6 hours: part sun.
- 2-4 hours: part shade.
- <2 hours: shade.

## Tree Handling

Trees are harder than buildings because canopies are irregular and partly transparent.

MVP approximation:

- User draws tree canopy as a circle or polygon.
- User enters tree height.
- App applies an opacity factor, such as 60-90% shade.

Later improvements:

- User calibrates tree shadow from photos.
- Vision model segments tree canopy.
- LiDAR or DSM data estimates tree height.

## Photo Calibration

Photos can help validate and adjust the model.

Workflow:

1. User takes photos at known times on a sunny day.
2. User marks real shadow boundaries.
3. App compares simulated shadow boundaries with observed boundaries.
4. App suggests adjustments to obstacle height or shape.

Important limitation:

Do not rely on photos alone to infer a full 3D model in MVP. Use photos to calibrate a user-marked model.

