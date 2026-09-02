"use client";

import { FormEvent, useEffect, useState } from "react";
import { Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

import {
  allocationPlantColor,
  clampPlanPosition,
  gardenPlanViewport,
  normalizePlanRotation,
  snapToGrid,
  validateGardenPlanDimensions,
  type GardenPlan,
  type GardenPlanViewMode,
  type GardenPlanViewport,
  type GrowingArea,
  type PlanPlacement,
} from "@/lib/gardenWorkspace";

type GardenPlanOverviewProps = {
  plan: GardenPlan;
  growingAreas: GrowingArea[];
  compact?: boolean;
  editable?: boolean;
  onPlanChange?: (plan: GardenPlan) => void;
  onPlacementChange?: (areaId: string, placement: PlanPlacement) => void;
  onEditLayout?: (areaId: string) => void;
};

const CANVAS_PADDING = 34;
const PLAN_ZOOM_LEVELS = [0.75, 1, 1.25, 1.5, 2];

export function GardenPlanOverview({
  plan,
  growingAreas,
  compact = false,
  editable = false,
  onPlanChange,
  onPlacementChange,
  onEditLayout,
}: GardenPlanOverviewProps) {
  const [width, setWidth] = useState(String(plan.widthMeters));
  const [depth, setDepth] = useState(String(plan.depthMeters));
  const [selectedAreaId, setSelectedAreaId] = useState<string>();
  const [selectedAllocationId, setSelectedAllocationId] = useState<string>();
  const [zoom, setZoom] = useState(1);
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

  useEffect(() => {
    if (
      selectedAllocationId &&
      !growingAreas.some((area) => area.layout?.allocations.some(
        (allocation) => allocationKey(area.id, allocation.id) === selectedAllocationId,
      ))
    )
      setSelectedAllocationId(undefined);
  }, [growingAreas, selectedAllocationId]);

  if (compact)
    return (
      <div aria-hidden="true" className="garden-plan-thumbnail">
        <GardenPlanCanvas
          compact
          growingAreas={growingAreas}
          interactive={false}
          onMove={() => undefined}
          onSelect={() => undefined}
          plan={plan}
          viewMode="growing-areas"
          zoom={1}
        />
      </div>
    );

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
        x: (event.target.x() - CANVAS_PADDING) / (pixelsPerMeter(plan) * zoom),
        y: (event.target.y() - CANVAS_PADDING) / (pixelsPerMeter(plan) * zoom),
      },
      plan,
    );
    const area = growingAreas.find((candidate) => candidate.id === areaId);
    if (!area) return;
    onPlacementChange(areaId, { ...area.planPlacement, ...point });
    setSelectedAreaId(areaId);
    setMessage("Planting area snapped to the 0.1 metre grid.");
  };

  const changeZoom = (direction: -1 | 1) => {
    const currentIndex = PLAN_ZOOM_LEVELS.indexOf(zoom);
    const nextIndex = Math.max(0, Math.min(PLAN_ZOOM_LEVELS.length - 1, currentIndex + direction));
    setZoom(PLAN_ZOOM_LEVELS[nextIndex]);
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
        <div className="plan-view">
          <div aria-label="Garden Plan zoom" className="plan-zoom-controls">
            <button
              aria-label="Zoom out"
              className="plan-zoom-icon"
              disabled={zoom === PLAN_ZOOM_LEVELS[0]}
              onClick={() => changeZoom(-1)}
              type="button"
            >
              −
            </button>
            <button className="secondary-button" onClick={() => setZoom(1)} type="button">
              Fit plan
            </button>
            <button
              aria-label="Zoom in"
              className="plan-zoom-icon"
              disabled={zoom === PLAN_ZOOM_LEVELS[PLAN_ZOOM_LEVELS.length - 1]}
              onClick={() => changeZoom(1)}
              type="button"
            >
              +
            </button>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <div className="plan-canvas-wrap">
            <GardenPlanCanvas
              compact={false}
              growingAreas={growingAreas}
              interactive={editable}
              onEditLayout={onEditLayout}
              onMove={moveArea}
              onSelect={setSelectedAreaId}
              onSelectAllocation={setSelectedAllocationId}
              plan={plan}
              selectedAllocationId={selectedAllocationId}
              viewMode="full"
              zoom={zoom}
            />
          </div>
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
  compact: boolean;
  interactive: boolean;
  onMove: (areaId: string, event: KonvaEventObject<DragEvent>) => void;
  onSelect: (areaId: string) => void;
  onSelectAllocation?: (allocationId: string) => void;
  onEditLayout?: (areaId: string) => void;
  selectedAllocationId?: string;
  viewMode: GardenPlanViewMode;
  zoom: number;
};

function GardenPlanCanvas({
  plan,
  growingAreas,
  compact,
  interactive,
  onMove,
  onSelect,
  onSelectAllocation,
  onEditLayout,
  selectedAllocationId,
  viewMode,
  zoom,
}: GardenPlanCanvasProps) {
  const padding = compact ? 14 : CANVAS_PADDING;
  const viewport = gardenPlanViewport(plan, growingAreas, viewMode);
  const scale = pixelsPerMeter(viewport, compact) * zoom;
  const width = viewport.widthMeters * scale + padding * 2;
  const height = viewport.depthMeters * scale + padding * 2;
  const verticalGrid = compact ? [] : Array.from(
    { length: Math.floor(plan.widthMeters) + 1 },
    (_, index) => index,
  );
  const horizontalGrid = compact ? [] : Array.from(
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
          x={padding - viewport.x * scale}
          y={padding - viewport.y * scale}
        />
        {!compact && verticalGrid.map((metre) => (
          <Line
            key={`vertical-${metre}`}
            points={[
              padding + metre * scale,
              padding,
              padding + metre * scale,
              padding + plan.depthMeters * scale,
            ]}
            stroke="#cfd7ce"
            strokeWidth={1}
          />
        ))}
        {!compact && horizontalGrid.map((metre) => (
          <Line
            key={`horizontal-${metre}`}
            points={[
              padding,
              padding + metre * scale,
              padding + plan.widthMeters * scale,
              padding + metre * scale,
            ]}
            stroke="#cfd7ce"
            strokeWidth={1}
          />
        ))}
        {!compact && verticalGrid.map((metre) => (
          <Text
            fontSize={11}
            key={`x-label-${metre}`}
            text={`${metre} m`}
            x={padding + metre * scale - 10}
            y={12}
          />
        ))}
        {!compact && horizontalGrid.map((metre) => (
          <Text
            fontSize={11}
            key={`y-label-${metre}`}
            text={`${metre} m`}
            x={3}
            y={padding + metre * scale - 6}
          />
        ))}
        {measuredAreas.map((area) => (
          <Group
            aria-label={
              compact
                ? undefined
                : interactive
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
            x={padding + (area.planPlacement.x - viewport.x) * scale}
            y={padding + (area.planPlacement.y - viewport.y) * scale}
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
                  aria-label={`${allocation.label} plant on Garden Plan`}
                  fill={allocationPlantColor(allocation, area.layout!.allocations)}
                  opacity={0.9}
                  radius={Math.max(4, (allocation.diameterMeters * scale) / 2)}
                  stroke="#183a2a"
                  strokeWidth={selectedAllocationId === allocationKey(area.id, allocation.id) ? 3 : 1}
                  x={allocation.x * scale}
                  y={allocation.y * scale}
                  onClick={(event) => {
                    event.cancelBubble = true;
                    onSelect(area.id);
                    onSelectAllocation?.(allocationKey(area.id, allocation.id));
                  }}
                  onTap={(event) => {
                    event.cancelBubble = true;
                    onSelect(area.id);
                    onSelectAllocation?.(allocationKey(area.id, allocation.id));
                  }}
                />
                {!compact && (zoom > 1 || selectedAllocationId === allocationKey(area.id, allocation.id)) ? (
                  <Text
                    align="center"
                    fill="#183a2a"
                    fontSize={Math.max(8, Math.min(12, allocation.diameterMeters * scale / 3))}
                    height={Math.max(2, allocation.diameterMeters * scale)}
                    listening={false}
                    text={allocation.label}
                    verticalAlign="middle"
                    width={Math.max(2, allocation.diameterMeters * scale)}
                    wrap="none"
                    x={allocation.x * scale - allocation.diameterMeters * scale / 2}
                    y={allocation.y * scale - allocation.diameterMeters * scale / 2}
                  />
                ) : null}
              </Group>
            ))}
          </Group>
        ))}
        {!compact && measuredAreas.map((area) => {
          const label = areaLabelPosition(area, scale, padding, viewport);
          return (
            <Text
              align="center"
              data-testid={`area-label-${area.id}`}
              ellipsis
              fill="#183a2a"
              fontSize={13}
              fontStyle="bold"
              height={16}
              key={`area-label-${area.id}`}
              listening={false}
              text={area.name}
              width={label.width}
              wrap="none"
              x={label.x}
              y={label.y}
            />
          );
        })}
        {!compact && !measuredAreas.length ? (
          <Text
            fill="#657268"
            fontSize={14}
            text="Set up a measured layout in Garden Management to show it here."
            x={padding + (16 - viewport.x) * scale}
            y={padding + (16 - viewport.y) * scale}
          />
        ) : null}
      </Layer>
    </Stage>
  );
}

function allocationKey(areaId: string, allocationId: string) {
  return `${areaId}:${allocationId}`;
}

function areaLabelPosition(
  area: GrowingArea,
  scale: number,
  padding: number,
  viewport: GardenPlanViewport,
) {
  const angle = (area.planPlacement.rotationDegrees * Math.PI) / 180;
  const origin = {
    x: padding + (area.planPlacement.x - viewport.x) * scale,
    y: padding + (area.planPlacement.y - viewport.y) * scale,
  };
  const points = area.layout!.boundary.map((point) => ({
    x: origin.x + point.x * scale * Math.cos(angle) - point.y * scale * Math.sin(angle),
    y: origin.y + point.x * scale * Math.sin(angle) + point.y * scale * Math.cos(angle),
  }));
  const left = Math.min(...points.map((point) => point.x));
  const right = Math.max(...points.map((point) => point.x));
  const top = Math.min(...points.map((point) => point.y));
  const bottom = Math.max(...points.map((point) => point.y));
  const width = Math.max(80, Math.min(180, right - left + 24));
  const y = top - 20 >= 24 ? top - 20 : bottom + 6;
  return { width, x: (left + right - width) / 2, y };
}

function pixelsPerMeter(
  plan: Pick<GardenPlan, "widthMeters" | "depthMeters">,
  compact = false,
) {
  const maxWidth = compact ? 210 : 760;
  const maxDepth = compact ? 150 : 460;
  const maxScale = compact ? 28 : 82;
  const minScale = compact ? 12 : 28;
  return Math.max(
    minScale,
    Math.min(
      maxScale,
      Math.min(maxWidth / plan.widthMeters, maxDepth / plan.depthMeters),
    ),
  );
}
