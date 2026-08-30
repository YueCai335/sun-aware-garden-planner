"use client";

import { FormEvent, useEffect, useState } from "react";
import { Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

import {
  clampPlanPosition,
  normalizePlanRotation,
  snapToGrid,
  validateGardenPlanDimensions,
  type GardenPlan,
  type GrowingArea,
  type PlanPlacement,
} from "@/lib/gardenWorkspace";

type GardenPlanOverviewProps = {
  plan: GardenPlan;
  growingAreas: GrowingArea[];
  editable?: boolean;
  onPlanChange?: (plan: GardenPlan) => void;
  onPlacementChange?: (areaId: string, placement: PlanPlacement) => void;
  onEditLayout?: (areaId: string) => void;
};

const CANVAS_PADDING = 34;

export function GardenPlanOverview({
  plan,
  growingAreas,
  editable = false,
  onPlanChange,
  onPlacementChange,
  onEditLayout,
}: GardenPlanOverviewProps) {
  const [width, setWidth] = useState(String(plan.widthMeters));
  const [depth, setDepth] = useState(String(plan.depthMeters));
  const [selectedAreaId, setSelectedAreaId] = useState<string>();
  const [message, setMessage] = useState("");
  const selectedArea = growingAreas.find((area) => area.id === selectedAreaId);

  useEffect(() => {
    setWidth(String(plan.widthMeters));
    setDepth(String(plan.depthMeters));
  }, [plan.depthMeters, plan.widthMeters]);

  useEffect(() => {
    if (
      selectedAreaId &&
      !growingAreas.some((area) => area.id === selectedAreaId)
    )
      setSelectedAreaId(undefined);
  }, [growingAreas, selectedAreaId]);

  const savePlanDimensions = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const widthMeters = Number(width);
    const depthMeters = Number(depth);
    if (!validateGardenPlanDimensions(widthMeters, depthMeters)) {
      setMessage("Enter plan dimensions of at least 0.1 metres.");
      return;
    }
    onPlanChange?.({
      widthMeters: snapToGrid(widthMeters),
      depthMeters: snapToGrid(depthMeters),
    });
    setMessage("Garden Plan dimensions saved.");
  };

  const updateSelectedPlacement = (
    field: keyof PlanPlacement,
    rawValue: string,
  ) => {
    if (!selectedArea || rawValue === "") return;
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      setMessage("Enter a valid numeric value.");
      return;
    }
    const placement =
      field === "rotationDegrees"
        ? {
            ...selectedArea.planPlacement,
            rotationDegrees: normalizePlanRotation(value),
          }
        : {
            ...selectedArea.planPlacement,
            ...clampPlanPosition(
              { ...selectedArea.planPlacement, [field]: value },
              plan,
            ),
          };
    onPlacementChange?.(selectedArea.id, placement);
    setMessage(`${selectedArea.name} updated.`);
  };

  const moveArea = (areaId: string, event: KonvaEventObject<DragEvent>) => {
    if (!editable || !onPlacementChange) return;
    const point = clampPlanPosition(
      {
        x: (event.target.x() - CANVAS_PADDING) / pixelsPerMeter(plan),
        y: (event.target.y() - CANVAS_PADDING) / pixelsPerMeter(plan),
      },
      plan,
    );
    const area = growingAreas.find((candidate) => candidate.id === areaId);
    if (!area) return;
    onPlacementChange(areaId, { ...area.planPlacement, ...point });
    setSelectedAreaId(areaId);
    setMessage("Planting area snapped to the 0.1 metre grid.");
  };

  return (
    <section className="garden-plan" aria-labelledby="garden-plan-heading">
      <div className="section-header">
        <div>
          <p className="section-eyebrow">Garden overview</p>
          <h2 id="garden-plan-heading">Garden Plan</h2>
        </div>
        <p className="plan-count">
          {growingAreas.length} planting{" "}
          {growingAreas.length === 1 ? "area" : "areas"}
        </p>
      </div>
      <p className="plan-intro">
        {editable
          ? "Arrange planting areas and use the controls for precise placement."
          : "Measured planting areas and planned layout allocations for this garden."}
      </p>
      {editable ? (
        <form className="plan-dimensions" onSubmit={savePlanDimensions}>
          <div className="field">
            <label htmlFor="plan-width">Plan width (X, m)</label>
            <input
              id="plan-width"
              min="0.1"
              onChange={(event) => setWidth(event.target.value)}
              step="0.1"
              type="number"
              value={width}
            />
          </div>
          <div className="field">
            <label htmlFor="plan-depth">Plan depth (Y, m)</label>
            <input
              id="plan-depth"
              min="0.1"
              onChange={(event) => setDepth(event.target.value)}
              step="0.1"
              type="number"
              value={depth}
            />
          </div>
          <button className="secondary-button" type="submit">
            Save plan dimensions
          </button>
        </form>
      ) : null}
      <div className={editable ? "garden-plan-grid" : "plan-canvas-wrap"}>
        <div className="plan-canvas-wrap">
          <GardenPlanCanvas
            growingAreas={growingAreas}
            interactive={editable}
            onEditLayout={onEditLayout}
            onMove={moveArea}
            onSelect={setSelectedAreaId}
            plan={plan}
          />
        </div>
        {editable ? (
          <aside className="plan-controls" aria-label="Garden Plan controls">
            <h3>Planting areas</h3>
            {growingAreas.length ? (
              <ul className="plan-area-list">
                {growingAreas.map((area) => (
                  <li key={area.id}>
                    <button
                      aria-pressed={selectedAreaId === area.id}
                      className="plan-area-select"
                      onClick={() => setSelectedAreaId(area.id)}
                      type="button"
                    >
                      Select {area.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sidebar-note">
                Add a planting area to begin arranging your plan.
              </p>
            )}
            {selectedArea ? (
              <div className="selected-plan-area">
                <h3>{selectedArea.name}</h3>
                <div className="selected-fields">
                  <div className="field">
                    <label htmlFor="plan-area-x">Area X position (m)</label>
                    <input
                      id="plan-area-x"
                      min="0"
                      onChange={(event) =>
                        updateSelectedPlacement("x", event.target.value)
                      }
                      step="0.1"
                      type="number"
                      value={selectedArea.planPlacement.x}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="plan-area-y">Area Y position (m)</label>
                    <input
                      id="plan-area-y"
                      min="0"
                      onChange={(event) =>
                        updateSelectedPlacement("y", event.target.value)
                      }
                      step="0.1"
                      type="number"
                      value={selectedArea.planPlacement.y}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="plan-area-rotation">
                      Area rotation (degrees)
                    </label>
                    <input
                      id="plan-area-rotation"
                      onChange={(event) =>
                        updateSelectedPlacement(
                          "rotationDegrees",
                          event.target.value,
                        )
                      }
                      step="0.1"
                      type="number"
                      value={selectedArea.planPlacement.rotationDegrees}
                    />
                  </div>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => onEditLayout?.(selectedArea.id)}
                  type="button"
                >
                  Edit layout
                </button>
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>
      {editable ? (
        <p aria-live="polite" className="workspace-message" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}

type GardenPlanCanvasProps = {
  plan: GardenPlan;
  growingAreas: GrowingArea[];
  interactive: boolean;
  onMove: (areaId: string, event: KonvaEventObject<DragEvent>) => void;
  onSelect: (areaId: string) => void;
  onEditLayout?: (areaId: string) => void;
};

function GardenPlanCanvas({
  plan,
  growingAreas,
  interactive,
  onMove,
  onSelect,
  onEditLayout,
}: GardenPlanCanvasProps) {
  const scale = pixelsPerMeter(plan);
  const width = plan.widthMeters * scale + CANVAS_PADDING * 2;
  const height = plan.depthMeters * scale + CANVAS_PADDING * 2;
  const verticalGrid = Array.from(
    { length: Math.floor(plan.widthMeters) + 1 },
    (_, index) => index,
  );
  const horizontalGrid = Array.from(
    { length: Math.floor(plan.depthMeters) + 1 },
    (_, index) => index,
  );
  const measuredAreas = growingAreas.filter((area) => area.layout);

  return (
    <Stage
      aria-label={`Garden Plan, ${plan.widthMeters} metres long by ${plan.depthMeters} metres wide`}
      height={height}
      width={width}
    >
      <Layer>
        <Rect
          fill="#f8fbf6"
          height={plan.depthMeters * scale}
          stroke="#183a2a"
          strokeWidth={2}
          width={plan.widthMeters * scale}
          x={CANVAS_PADDING}
          y={CANVAS_PADDING}
        />
        {verticalGrid.map((metre) => (
          <Line
            key={`vertical-${metre}`}
            points={[
              CANVAS_PADDING + metre * scale,
              CANVAS_PADDING,
              CANVAS_PADDING + metre * scale,
              CANVAS_PADDING + plan.depthMeters * scale,
            ]}
            stroke="#cfd7ce"
            strokeWidth={1}
          />
        ))}
        {horizontalGrid.map((metre) => (
          <Line
            key={`horizontal-${metre}`}
            points={[
              CANVAS_PADDING,
              CANVAS_PADDING + metre * scale,
              CANVAS_PADDING + plan.widthMeters * scale,
              CANVAS_PADDING + metre * scale,
            ]}
            stroke="#cfd7ce"
            strokeWidth={1}
          />
        ))}
        {verticalGrid.map((metre) => (
          <Text
            fontSize={11}
            key={`x-label-${metre}`}
            text={`${metre} m`}
            x={CANVAS_PADDING + metre * scale - 10}
            y={12}
          />
        ))}
        {horizontalGrid.map((metre) => (
          <Text
            fontSize={11}
            key={`y-label-${metre}`}
            text={`${metre} m`}
            x={3}
            y={CANVAS_PADDING + metre * scale - 6}
          />
        ))}
        {measuredAreas.map((area) => (
          <Group
            aria-label={
              interactive
                ? `Select ${area.name} on Garden Plan`
                : `${area.name} on Garden Plan`
            }
            draggable={interactive}
            key={area.id}
            onClick={() => onSelect(area.id)}
            onDblClick={() => onEditLayout?.(area.id)}
            onDblTap={() => onEditLayout?.(area.id)}
            onDragEnd={(event) => onMove(area.id, event)}
            onTap={() => onSelect(area.id)}
            rotation={area.planPlacement.rotationDegrees}
            x={CANVAS_PADDING + area.planPlacement.x * scale}
            y={CANVAS_PADDING + area.planPlacement.y * scale}
          >
            <Line
              closed
              fill="#dcebdc"
              points={area.layout!.boundary.flatMap((point) => [
                point.x * scale,
                point.y * scale,
              ])}
              stroke="#276445"
              strokeWidth={2}
            />
            {area.layout!.allocations.map((allocation) => (
              <Group key={allocation.id}>
                <Circle
                  fill="#f7b955"
                  opacity={0.9}
                  radius={Math.max(4, (allocation.diameterMeters * scale) / 2)}
                  stroke="#8a4f00"
                  strokeWidth={1}
                  x={allocation.x * scale}
                  y={allocation.y * scale}
                />
                <Text
                  fill="#4a2b00"
                  fontSize={11}
                  listening={false}
                  text={allocation.label}
                  x={allocation.x * scale + 5}
                  y={allocation.y * scale + 4}
                />
              </Group>
            ))}
            <Text
              fill="#183a2a"
              fontSize={13}
              fontStyle="bold"
              listening={false}
              text={area.name}
              x={6}
              y={6}
            />
          </Group>
        ))}
        {!measuredAreas.length ? (
          <Text
            fill="#657268"
            fontSize={14}
            text="Set up a measured layout in Garden Management to show it here."
            x={CANVAS_PADDING + 16}
            y={CANVAS_PADDING + 16}
          />
        ) : null}
      </Layer>
    </Stage>
  );
}

function pixelsPerMeter(plan: GardenPlan) {
  return Math.max(
    28,
    Math.min(82, Math.min(760 / plan.widthMeters, 460 / plan.depthMeters)),
  );
}
