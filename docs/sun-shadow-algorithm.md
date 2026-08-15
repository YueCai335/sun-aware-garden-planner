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

- User calibrates important yard points with guided sky panoramas.
- Vision model segments tree canopy.
- LiDAR or DSM data estimates tree height.

## Photo Calibration

Photos can help validate and adjust the model, but they do not replace the
yard geometry model.

Workflow:

1. User selects a measurement point on the yard map.
2. User captures a guided sky panorama from that point.
3. The app records location and camera orientation.
4. A vision model creates a sky-versus-obstacle mask.
5. User corrects segmentation mistakes when necessary.
6. The app projects calculated solar positions onto the mask at regular time
   intervals.
7. Unobstructed intervals are summed into estimated direct-sun hours.
8. The point result is compared with the yard-wide simulation.
9. The app suggests adjustments to nearby obstacle height or shape.

Photos taken at known times can provide additional validation by showing real
shadow boundaries, but they are optional and do not provide enough geometry on
their own.

Important limitation:

Do not rely on photos alone to infer a full 3D model. Use panoramic observations
to calibrate a user-marked model after the deterministic MVP works.
