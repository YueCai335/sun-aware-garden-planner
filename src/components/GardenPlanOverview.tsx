"use client";

import { FormEvent, useEffect, useState } from "react";
import { Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

import {
  clampPlanPosition,
  normalizePlanRotation,
  snapToGrid,
  validateGardenPlanDimensions,
  type GardenPlan,
  type GrowingArea,
  type PlanPlacement
} from "@/lib/gardenWorkspace";

type GardenPlanOverviewProps = {
  plan: GardenPlan;
  growingAreas: GrowingArea[];
  onPlanChange: (plan: GardenPlan) => void;
  onPlacementChange: (areaId: string, placement: PlanPlacement) => void;
  onEditLayout: (areaId: string) => void;
};

const CANVAS_PADDING = 34;

export function GardenPlanOverview({ plan, growingAreas, onPlanChange, onPlacementChange, onEditLayout }: GardenPlanOverviewProps) {
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
    if (selectedAreaId && !growingAreas.some((area) => area.id === selectedAreaId)) setSelectedAreaId(undefined);
  }, [growingAreas, selectedAreaId]);

  const savePlanDimensions = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const widthMeters = Number(width), depthMeters = Number(depth);
    if (!validateGardenPlanDimensions(widthMeters, depthMeters)) {
      setMessage("Enter plan dimensions of at least 0.1 metres.");
      return;
    }
    onPlanChange({ widthMeters: snapToGrid(widthMeters), depthMeters: snapToGrid(depthMeters) });
    setMessage("Garden Plan dimensions saved.");
  };

  const updateSelectedPlacement = (field: keyof PlanPlacement, rawValue: string) => {
    if (!selectedArea || rawValue === "") return;
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      setMessage("Enter a valid numeric value.");
      return;
    }
    const placement = field === "rotationDegrees"
      ? { ...selectedArea.planPlacement, rotationDegrees: normalizePlanRotation(value) }
      : { ...selectedArea.planPlacement, ...clampPlanPosition({ ...selectedArea.planPlacement, [field]: value }, plan) };
    onPlacementChange(selectedArea.id, placement);
    setMessage(`${selectedArea.name} updated.`);
  };

  const moveArea = (areaId: string, event: KonvaEventObject<DragEvent>) => {
    const point = clampPlanPosition({ x: (event.target.x() - CANVAS_PADDING) / pixelsPerMeter(plan), y: (event.target.y() - CANVAS_PADDING) / pixelsPerMeter(plan) }, plan);
    onPlacementChange(areaId, { ...growingAreas.find((area) => area.id === areaId)!.planPlacement, ...point });
    setSelectedAreaId(areaId);
    setMessage("Growing area snapped to the 0.1 metre grid.");
  };

  return <section className="garden-plan" aria-labelledby="garden-plan-heading">
    <div className="section-header"><div><p className="section-eyebrow">Garden overview</p><h2 id="garden-plan-heading">Garden Plan</h2></div><p className="plan-count">{growingAreas.length} growing {growingAreas.length === 1 ? "area" : "areas"}</p></div>
    <p className="plan-intro">Arrange measured growing areas on a shared metre grid.</p>
    <form className="plan-dimensions" onSubmit={savePlanDimensions}>
      <div className="field"><label htmlFor="plan-width">Plan width (X, m)</label><input id="plan-width" min="0.1" onChange={(event) => setWidth(event.target.value)} step="0.1" type="number" value={width} /></div>
      <div className="field"><label htmlFor="plan-depth">Plan depth (Y, m)</label><input id="plan-depth" min="0.1" onChange={(event) => setDepth(event.target.value)} step="0.1" type="number" value={depth} /></div>
      <button className="secondary-button" type="submit">Save plan dimensions</button>
    </form>
    <div className="garden-plan-grid">
      <div className="plan-canvas-wrap">
        <GardenPlanCanvas growingAreas={growingAreas} onEditLayout={onEditLayout} onMove={moveArea} onSelect={setSelectedAreaId} plan={plan} />
      </div>
      <aside className="plan-controls" aria-label="Garden Plan controls">
        <h3>Growing areas</h3>
        {growingAreas.length ? <ul className="plan-area-list">{growingAreas.map((area) => <li key={area.id}><button aria-pressed={selectedAreaId === area.id} className="plan-area-select" onClick={() => setSelectedAreaId(area.id)} type="button">Select {area.name}</button></li>)}</ul> : <p className="sidebar-note">Add a growing area to begin arranging your plan.</p>}
        {selectedArea ? <div className="selected-plan-area"><h3>{selectedArea.name}</h3><div className="selected-fields"><div className="field"><label htmlFor="plan-area-x">Area X position (m)</label><input id="plan-area-x" min="0" onChange={(event) => updateSelectedPlacement("x", event.target.value)} step="0.1" type="number" value={selectedArea.planPlacement.x} /></div><div className="field"><label htmlFor="plan-area-y">Area Y position (m)</label><input id="plan-area-y" min="0" onChange={(event) => updateSelectedPlacement("y", event.target.value)} step="0.1" type="number" value={selectedArea.planPlacement.y} /></div><div className="field"><label htmlFor="plan-area-rotation">Area rotation (degrees)</label><input id="plan-area-rotation" onChange={(event) => updateSelectedPlacement("rotationDegrees", event.target.value)} step="0.1" type="number" value={selectedArea.planPlacement.rotationDegrees} /></div></div><button className="secondary-button" onClick={() => onEditLayout(selectedArea.id)} type="button">Edit layout</button></div> : null}
      </aside>
    </div>
    <p aria-live="polite" className="workspace-message" role="status">{message}</p>
  </section>;
}

function GardenPlanCanvas({ plan, growingAreas, onMove, onSelect, onEditLayout }: { plan: GardenPlan; growingAreas: GrowingArea[]; onMove: (areaId: string, event: KonvaEventObject<DragEvent>) => void; onSelect: (areaId: string) => void; onEditLayout: (areaId: string) => void }) {
  const scale = pixelsPerMeter(plan), width = plan.widthMeters * scale + CANVAS_PADDING * 2, height = plan.depthMeters * scale + CANVAS_PADDING * 2;
  const verticalGrid = Array.from({ length: Math.floor(plan.widthMeters) + 1 }, (_, index) => index);
  const horizontalGrid = Array.from({ length: Math.floor(plan.depthMeters) + 1 }, (_, index) => index);
  const measuredAreas = growingAreas.filter((area) => area.layout);

  return <Stage aria-label={`Garden Plan, ${plan.widthMeters} metres long by ${plan.depthMeters} metres wide`} height={height} width={width}>
    <Layer>
      <Rect fill="#f8fbf6" height={plan.depthMeters * scale} stroke="#183a2a" strokeWidth={2} width={plan.widthMeters * scale} x={CANVAS_PADDING} y={CANVAS_PADDING} />
      {verticalGrid.map((metre) => <Line key={`vertical-${metre}`} points={[CANVAS_PADDING + metre * scale, CANVAS_PADDING, CANVAS_PADDING + metre * scale, CANVAS_PADDING + plan.depthMeters * scale]} stroke="#cfd7ce" strokeWidth={1} />)}
      {horizontalGrid.map((metre) => <Line key={`horizontal-${metre}`} points={[CANVAS_PADDING, CANVAS_PADDING + metre * scale, CANVAS_PADDING + plan.widthMeters * scale, CANVAS_PADDING + metre * scale]} stroke="#cfd7ce" strokeWidth={1} />)}
      {verticalGrid.map((metre) => <Text fontSize={11} key={`x-label-${metre}`} text={`${metre} m`} x={CANVAS_PADDING + metre * scale - 10} y={12} />)}
      {horizontalGrid.map((metre) => <Text fontSize={11} key={`y-label-${metre}`} text={`${metre} m`} x={3} y={CANVAS_PADDING + metre * scale - 6} />)}
      {measuredAreas.map((area) => <Group aria-label={`Select ${area.name} on Garden Plan`} draggable key={area.id} onClick={() => onSelect(area.id)} onDblClick={() => onEditLayout(area.id)} onDblTap={() => onEditLayout(area.id)} onDragEnd={(event) => onMove(area.id, event)} onTap={() => onSelect(area.id)} rotation={area.planPlacement.rotationDegrees} x={CANVAS_PADDING + area.planPlacement.x * scale} y={CANVAS_PADDING + area.planPlacement.y * scale}>
        <Line closed fill="#dcebdc" points={area.layout!.boundary.flatMap((point) => [point.x * scale, point.y * scale])} stroke="#276445" strokeWidth={2} />
        <Text fill="#183a2a" fontSize={13} fontStyle="bold" listening={false} text={area.name} x={6} y={6} />
      </Group>)}
      {!measuredAreas.length ? <Text fill="#657268" fontSize={14} text="Set up a measured layout to place an area on this plan." x={CANVAS_PADDING + 16} y={CANVAS_PADDING + 16} /> : null}
    </Layer>
  </Stage>;
}

function pixelsPerMeter(plan: GardenPlan) {
  return Math.max(28, Math.min(82, Math.min(760 / plan.widthMeters, 460 / plan.depthMeters)));
}
