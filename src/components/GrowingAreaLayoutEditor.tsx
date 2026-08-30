"use client";

import { FormEvent, useEffect, useState } from "react";
import { Circle, Layer, Line, Rect, Stage, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

import {
  clampAllocationCenter,
  createRectangularLayout,
  findDuplicatePlantPosition,
  snapToGrid,
  validateLayoutDimensions,
  type GrowingArea,
  type GrowingAreaLayout,
  type PlantAllocation
} from "@/lib/gardenWorkspace";

type GrowingAreaLayoutEditorProps = {
  area: GrowingArea;
  onBack: () => void;
  onChange: (layout: GrowingAreaLayout) => void;
};

const CANVAS_PADDING = 38;

export function GrowingAreaLayoutEditor({ area, onBack, onChange }: GrowingAreaLayoutEditorProps) {
  const layout = area.layout;
  const [width, setWidth] = useState(layout ? String(layout.widthMeters) : "");
  const [depth, setDepth] = useState(layout ? String(layout.depthMeters) : "");
  const [allocationLabel, setAllocationLabel] = useState("");
  const [allocationDiameter, setAllocationDiameter] = useState("0.3");
  const [selectedId, setSelectedId] = useState<string>();
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isPlantListOpen, setIsPlantListOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setWidth(layout ? String(layout.widthMeters) : "");
    setDepth(layout ? String(layout.depthMeters) : "");
    setSelectedId(undefined);
    setIsAddFormOpen(false);
    setIsPlantListOpen(false);
    setIsEditOpen(false);
  }, [area.id, layout?.widthMeters, layout?.depthMeters]);

  const selected = layout?.allocations.find((allocation) => allocation.id === selectedId);
  const saveDimensions = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const widthMeters = Number(width), depthMeters = Number(depth);
    if (!validateLayoutDimensions(widthMeters, depthMeters)) {
      setMessage("Enter length and width of at least 0.1 metres.");
      return;
    }
    const next = createRectangularLayout(snapToGrid(widthMeters), snapToGrid(depthMeters));
    onChange({ ...next, allocations: layout?.allocations.map((allocation) => ({ ...allocation, ...clampAllocationCenter(allocation, next) })) ?? [] });
    setMessage(layout ? "Area dimensions updated." : "Metric layout created.");
  };

  const addAllocation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!layout) return;
    const label = allocationLabel.trim(), diameterMeters = Number(allocationDiameter);
    if (!label || !Number.isFinite(diameterMeters) || diameterMeters < 0.1) {
      setMessage("Enter a plant name and spacing of at least 0.1 metres.");
      return;
    }
    const allocation: PlantAllocation = {
      id: createAllocationId(),
      label,
      diameterMeters: snapToGrid(diameterMeters),
      ...clampAllocationCenter({ x: layout.widthMeters / 2, y: layout.depthMeters / 2 }, layout)
    };
    onChange({ ...layout, allocations: [...layout.allocations, allocation] });
    setSelectedId(allocation.id);
    setIsAddFormOpen(false);
    setAllocationLabel("");
    setMessage(`${label} added at the centre of this area.`);
  };

  const updateSelected = (field: "x" | "y" | "diameterMeters", rawValue: string) => {
    if (!layout || !selected || rawValue === "") return;
    const value = Number(rawValue);
    if (!Number.isFinite(value) || (field === "diameterMeters" && value < 0.1)) {
      setMessage(field === "diameterMeters" ? "Plant spacing must be at least 0.1 metres." : "Enter a valid metre position.");
      return;
    }
    const next = field === "diameterMeters"
      ? { ...selected, diameterMeters: snapToGrid(value) }
      : { ...selected, ...clampAllocationCenter({ ...selected, [field]: value }, layout) };
    onChange({ ...layout, allocations: layout.allocations.map((allocation) => allocation.id === selected.id ? next : allocation) });
    setMessage(`${selected.label} updated.`);
  };

  const moveAllocation = (id: string, event: KonvaEventObject<DragEvent>) => {
    if (!layout) return;
    const point = clampAllocationCenter({ x: (event.target.x() - CANVAS_PADDING) / pixelsPerMeter(layout), y: (event.target.y() - CANVAS_PADDING) / pixelsPerMeter(layout) }, layout);
    onChange({ ...layout, allocations: layout.allocations.map((allocation) => allocation.id === id ? { ...allocation, ...point } : allocation) });
    setSelectedId(id);
    setMessage("Plant snapped to the 0.1 metre grid.");
  };

  const selectPlant = (id: string) => {
    setSelectedId(id);
    setIsEditOpen(false);
  };

  const openEdit = (id: string) => {
    setSelectedId(id);
    setIsEditOpen(true);
    setIsAddFormOpen(false);
  };

  const removePlant = (id: string) => {
    if (!layout) return;
    const plant = layout.allocations.find((allocation) => allocation.id === id);
    if (!plant) return;
    onChange({ ...layout, allocations: layout.allocations.filter((allocation) => allocation.id !== id) });
    if (selectedId === id) {
      setSelectedId(undefined);
      setIsEditOpen(false);
    }
    setMessage(`${plant.label} removed.`);
  };

  const duplicateSelected = () => {
    if (!layout || !selected) return;
    const position = findDuplicatePlantPosition(selected, layout);
    if (!position) {
      setMessage("No open 0.1 metre grid position is available for a duplicate.");
      return;
    }
    const duplicate: PlantAllocation = { ...selected, id: createAllocationId(), ...position };
    onChange({ ...layout, allocations: [...layout.allocations, duplicate] });
    setSelectedId(duplicate.id);
    setIsEditOpen(true);
    setMessage(`${duplicate.label} duplicated.`);
  };

  return <section className="layout-editor" aria-labelledby="layout-editor-heading">
    <div className="section-header"><div><p className="section-eyebrow">Planting layout</p><h2 id="layout-editor-heading">{area.name}</h2></div><button className="secondary-button" onClick={onBack} type="button">Back to growing areas</button></div>
    <p className="layout-intro">Plan individual plants on a measured length and width grid.</p>
    <form className="layout-dimensions" onSubmit={saveDimensions}>
      <div className="field"><label htmlFor="layout-length">Length (m)</label><input id="layout-length" min="0.1" onChange={(event) => setWidth(event.target.value)} step="0.1" type="number" value={width} /></div>
      <div className="field"><label htmlFor="layout-width">Width (m)</label><input id="layout-width" min="0.1" onChange={(event) => setDepth(event.target.value)} step="0.1" type="number" value={depth} /></div>
      <button className="primary-button" type="submit">{layout ? "Save dimensions" : "Create metric layout"}</button>
    </form>
    {layout ? <>
      <div className="layout-editor-grid">
        <div className="layout-canvas-wrap"><MetricLayoutCanvas layout={layout} onEdit={openEdit} onMove={moveAllocation} onRemove={removePlant} onSelect={selectPlant} selectedId={selectedId} /></div>
        <aside className="allocation-controls" aria-label="Plant controls">
          <div className="plant-toolbar">
            <button aria-expanded={isAddFormOpen} className="secondary-button" onClick={() => { setIsAddFormOpen(!isAddFormOpen); setIsPlantListOpen(false); }} type="button">Add plant</button>
            <button aria-expanded={isPlantListOpen} className="secondary-button" onClick={() => { setIsPlantListOpen(!isPlantListOpen); setIsAddFormOpen(false); }} type="button">Plant list</button>
          </div>
          {isEditOpen && selected ? <div className="selected-allocation"><h3>Edit {selected.label}</h3><div className="selected-fields"><div className="field"><label htmlFor="allocation-x">X position (m)</label><input id="allocation-x" min="0" onChange={(event) => updateSelected("x", event.target.value)} step="0.1" type="number" value={selected.x} /></div><div className="field"><label htmlFor="allocation-y">Y position (m)</label><input id="allocation-y" min="0" onChange={(event) => updateSelected("y", event.target.value)} step="0.1" type="number" value={selected.y} /></div><div className="field"><label htmlFor="selected-allocation-diameter">Plant spacing (m)</label><input id="selected-allocation-diameter" min="0.1" onChange={(event) => updateSelected("diameterMeters", event.target.value)} step="0.1" type="number" value={selected.diameterMeters} /></div></div><button className="secondary-button" onClick={duplicateSelected} type="button">Duplicate plant</button><button className="remove-button" onClick={() => removePlant(selected.id)} type="button">Remove plant</button></div> : null}
          {isAddFormOpen ? <form className="allocation-form" onSubmit={addAllocation}>
            <h3>Add plant</h3>
            <div className="field"><label htmlFor="allocation-label">Plant name</label><input id="allocation-label" onChange={(event) => setAllocationLabel(event.target.value)} placeholder="e.g. Tomato" required value={allocationLabel} /></div>
            <div className="field"><label htmlFor="allocation-diameter">Plant spacing (m)</label><input id="allocation-diameter" min="0.1" onChange={(event) => setAllocationDiameter(event.target.value)} step="0.1" type="number" value={allocationDiameter} /></div>
            <button className="primary-button" type="submit">Add plant</button>
          </form> : null}
          {isPlantListOpen ? <section className="plant-list-panel" aria-labelledby="plant-list-heading"><h3 id="plant-list-heading">Plants</h3>{layout.allocations.length ? <ul className="allocation-list">{layout.allocations.map((allocation) => <li key={allocation.id}><button aria-pressed={selectedId === allocation.id} className="allocation-select" onClick={() => openEdit(allocation.id)} type="button">{allocation.label} · {allocation.diameterMeters} m</button></li>)}</ul> : <p className="sidebar-note">Add your first plant.</p>}</section> : null}
        </aside>
      </div>
    </> : <div className="empty-areas"><h3>Set the real measurements first</h3><p>Create a rectangular layout using its real length and width.</p></div>}
    <p aria-live="polite" className="workspace-message" role="status">{message}</p>
  </section>;
}

function MetricLayoutCanvas({ layout, onMove, onSelect, onEdit, onRemove, selectedId }: { layout: GrowingAreaLayout; onMove: (id: string, event: KonvaEventObject<DragEvent>) => void; onSelect: (id: string) => void; onEdit: (id: string) => void; onRemove: (id: string) => void; selectedId?: string }) {
  const scale = pixelsPerMeter(layout), padding = CANVAS_PADDING, width = layout.widthMeters * scale + padding * 2, height = layout.depthMeters * scale + padding * 2;
  const grid = Array.from({ length: Math.floor(layout.widthMeters) + 1 }, (_, index) => index);
  const horizontalGrid = Array.from({ length: Math.floor(layout.depthMeters) + 1 }, (_, index) => index);
  return <Stage aria-label={`Metric layout, ${layout.widthMeters} metres long by ${layout.depthMeters} metres wide`} height={height} width={width}>
    <Layer>
      <Rect fill="#f8fbf6" height={layout.depthMeters * scale} stroke="#183a2a" strokeWidth={2} width={layout.widthMeters * scale} x={padding} y={padding} />
      {grid.map((metre) => <Line key={`vertical-${metre}`} points={[padding + metre * scale, padding, padding + metre * scale, padding + layout.depthMeters * scale]} stroke="#cfd7ce" strokeWidth={1} />)}
      {horizontalGrid.map((metre) => <Line key={`horizontal-${metre}`} points={[padding, padding + metre * scale, padding + layout.widthMeters * scale, padding + metre * scale]} stroke="#cfd7ce" strokeWidth={1} />)}
      {grid.map((metre) => <Text fontSize={11} key={`x-label-${metre}`} text={`${metre} m`} x={padding + metre * scale - 10} y={12} />)}
      {horizontalGrid.map((metre) => <Text fontSize={11} key={`y-label-${metre}`} text={`${metre} m`} x={3} y={padding + metre * scale - 6} />)}
      {layout.allocations.map((allocation) => <Circle aria-label={`${allocation.label} plant`} draggable fill={allocation.id === selectedId ? "#d8883b" : "#5e9a6d"} key={allocation.id} onClick={() => onSelect(allocation.id)} onDblClick={() => onEdit(allocation.id)} onDblTap={() => onEdit(allocation.id)} onDragEnd={(event) => onMove(allocation.id, event)} onTap={() => onSelect(allocation.id)} radius={allocationRadius(allocation, scale)} stroke="#183a2a" strokeWidth={allocation.id === selectedId ? 3 : 1} x={padding + allocation.x * scale} y={padding + allocation.y * scale} />)}
      {layout.allocations.map((allocation) => { const radius = allocationRadius(allocation, scale), x = padding + allocation.x * scale, y = padding + allocation.y * scale, inset = 2; return <Text align="center" data-testid={`allocation-label-${allocation.id}`} ellipsis fill="#ffffff" fontSize={Math.max(6, Math.min(12, radius * 0.6))} height={Math.max(2, radius * 2 - inset * 2)} key={`label-${allocation.id}`} listening={false} text={allocation.label} verticalAlign="middle" width={Math.max(2, radius * 2 - inset * 2)} wrap="none" x={x - radius + inset} y={y - radius + inset} />; })}
      {layout.allocations.map((allocation) => allocation.id === selectedId ? <Circle aria-label={`Remove ${allocation.label}`} fill="#ba3f36" key={`remove-${allocation.id}`} onClick={(event) => { event.cancelBubble = true; onRemove(allocation.id); }} radius={10} stroke="#ffffff" strokeWidth={1} x={padding + allocation.x * scale + allocationRadius(allocation, scale) * 0.65} y={padding + allocation.y * scale - allocationRadius(allocation, scale) * 0.65} /> : null)}
      {layout.allocations.map((allocation) => allocation.id === selectedId ? <Text align="center" fill="#ffffff" fontSize={16} fontStyle="bold" height={20} key={`remove-label-${allocation.id}`} listening={false} text="×" verticalAlign="middle" width={20} x={padding + allocation.x * scale + allocationRadius(allocation, scale) * 0.65 - 10} y={padding + allocation.y * scale - allocationRadius(allocation, scale) * 0.65 - 10} /> : null)}
    </Layer>
  </Stage>;
}

function pixelsPerMeter(layout: Pick<GrowingAreaLayout, "widthMeters" | "depthMeters">) {
  return Math.max(45, Math.min(160, 620 / Math.max(layout.widthMeters, layout.depthMeters)));
}

function allocationRadius(allocation: PlantAllocation, scale: number) {
  return Math.max(6, allocation.diameterMeters * scale / 2);
}

function createAllocationId() {
  return globalThis.crypto?.randomUUID?.() ?? `allocation-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
