"use client";

import { useEffect, useState } from "react";

import type { DrawingTool, YardObject, YardObjectKind } from "@/lib/types";

const toolLabels: Record<DrawingTool, string> = { select: "Select and edit", house: "House", tree: "Tree", fence: "Fence", "planting-bed": "Planting bed" };
const objectTools: YardObjectKind[] = ["house", "tree", "fence", "planting-bed"];
type NumberFieldName = "x" | "y" | "width" | "depth" | "obstacleHeightMeters";

type ToolbarProps = {
  location: string; date: string; gridWidth: number; gridDepth: number; northBearingDegrees: number; tool: DrawingTool;
  selectedObject?: YardObject; selectedVertexIndex?: number; boundaryVertexCount: number; message: string; hasObjects: boolean;
  onLocationChange: (value: string) => void; onDateChange: (value: string) => void;
  onGridChange: (field: "widthMeters" | "depthMeters", value: string) => void; onNorthBearingChange: (value: string) => void;
  onToolChange: (tool: DrawingTool) => void; onSelectedNumberChange: (field: NumberFieldName, value: string) => void;
  onDelete: () => void; onAddBoundaryVertex: () => void; onRemoveBoundaryVertex: () => void; onClear: () => void; onLoadDemo: () => void;
};

export function Toolbar(props: ToolbarProps) {
  const { location, date, gridWidth, gridDepth, northBearingDegrees, tool, selectedObject, selectedVertexIndex, boundaryVertexCount, message, hasObjects, onLocationChange, onDateChange, onGridChange, onNorthBearingChange, onToolChange, onSelectedNumberChange, onDelete, onAddBoundaryVertex, onRemoveBoundaryVertex, onClear, onLoadDemo } = props;
  const isObstacle = selectedObject && selectedObject.kind !== "planting-bed";
  return <aside className="panel toolbar-panel">
    <h1>Garden Planner</h1>
    <p>Set a reference grid in metres, then draw the usable yard and its obstacles.</p>
    <div className="geometry-grid">
      <NumberInput label="Grid width (m)" min={1} value={gridWidth} onChange={(value) => onGridChange("widthMeters", value)} />
      <NumberInput label="Grid depth (m)" min={1} value={gridDepth} onChange={(value) => onGridChange("depthMeters", value)} />
    </div>
    <div className="field"><label htmlFor="north-bearing">North bearing (degrees)</label><input id="north-bearing" inputMode="decimal" max="359.9" min="0" onChange={(event) => onNorthBearingChange(event.target.value)} step="1" type="number" value={northBearingDegrees} /></div>
    <div className="field"><label htmlFor="location">Location</label><input id="location" onChange={(event) => onLocationChange(event.target.value)} placeholder="Latitude, longitude" value={location} /></div>
    <div className="field"><label htmlFor="date">Date</label><input id="date" onChange={(event) => onDateChange(event.target.value)} type="date" value={date} /></div>
    <section className="editor-fields object-tools" aria-labelledby="add-objects-heading">
      <h2 id="add-objects-heading">Add objects</h2>
      <div className="object-tool-grid">
        {objectTools.map((objectTool) => <button aria-pressed={tool === objectTool} className={tool === objectTool ? "tool-button tool-button-active" : "tool-button"} key={objectTool} onClick={() => onToolChange(objectTool)} type="button">Add {toolLabels[objectTool]}</button>)}
      </div>
      <button aria-pressed={tool === "select"} className={tool === "select" ? "secondary-button full-width-button tool-button-active" : "secondary-button full-width-button"} onClick={() => onToolChange("select")} type="button">Select and edit</button>
    </section>
    <section className="editor-fields" aria-labelledby="boundary-heading">
      <h2 id="boundary-heading">Yard boundary</h2><p className="selection-hint">Drag its vertices to shape your yard. The outline must stay a simple polygon.</p>
      <button className="secondary-button full-width-button" onClick={onAddBoundaryVertex} type="button">Add boundary vertex</button>
      {selectedVertexIndex !== undefined ? <button className="danger-button full-width-button" disabled={boundaryVertexCount <= 3} onClick={onRemoveBoundaryVertex} type="button">Remove selected vertex</button> : null}
    </section>
    {selectedObject ? <section className="editor-fields" aria-labelledby="selected-object-heading">
      <h2 id="selected-object-heading">Selected {toolLabels[selectedObject.kind]}</h2>
      <div className="geometry-grid">
        <NumberInput label="X position (m)" min={0} value={selectedObject.x} onChange={(value) => onSelectedNumberChange("x", value)} />
        <NumberInput label="Y position (m)" min={0} value={selectedObject.y} onChange={(value) => onSelectedNumberChange("y", value)} />
        <NumberInput label="Width (m)" min={0.25} value={selectedObject.width} onChange={(value) => onSelectedNumberChange("width", value)} />
        <NumberInput label="Depth (m)" min={0.25} value={selectedObject.depth} onChange={(value) => onSelectedNumberChange("depth", value)} />
      </div>
      {isObstacle ? <NumberInput label="Obstacle height (m)" min={0.1} value={selectedObject.obstacleHeightMeters ?? 0} onChange={(value) => onSelectedNumberChange("obstacleHeightMeters", value)} /> : null}
      <button className="danger-button full-width-button" onClick={onDelete} type="button">Delete selected</button>
    </section> : <p className="selection-hint">Select an object to move, resize, edit, or delete it.</p>}
    <div className="button-row"><button className="primary-button" onClick={onLoadDemo} type="button">Load demo</button><button className="secondary-button" disabled={!hasObjects} onClick={onClear} type="button">Clear objects</button></div>
    <p aria-live="polite" className="editor-message" role="status">{message}</p>
  </aside>;
}

function NumberInput({ label, min, value, onChange }: { label: string; min: number; value: number; onChange: (value: string) => void }) {
  const [rawValue, setRawValue] = useState(String(value));
  useEffect(() => setRawValue(String(value)), [value]);
  return <div className="field"><label htmlFor={label}>{label}</label><input id={label} inputMode="decimal" min={min} onBlur={() => { if (rawValue === "" || !Number.isFinite(Number(rawValue))) setRawValue(String(value)); }} onChange={(event) => { setRawValue(event.target.value); if (event.target.value !== "" && Number.isFinite(Number(event.target.value))) onChange(event.target.value); }} step="0.1" type="number" value={rawValue} /></div>;
}
