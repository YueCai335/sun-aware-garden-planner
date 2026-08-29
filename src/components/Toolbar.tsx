"use client";

import { useEffect, useState } from "react";

import type { DrawingTool, YardElement } from "@/lib/types";

const toolLabels: Record<DrawingTool, string> = {
  select: "Select and move",
  yard: "Yard boundary",
  house: "House",
  tree: "Tree",
  fence: "Fence",
  "planting-bed": "Planting bed"
};

type ToolbarProps = {
  location: string;
  date: string;
  tool: DrawingTool;
  selectedElement?: YardElement;
  message: string;
  hasElements: boolean;
  onLocationChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onToolChange: (tool: DrawingTool) => void;
  onSelectedNumberChange: (
    field: "x" | "y" | "width" | "height" | "obstacleHeightMeters",
    value: string
  ) => void;
  onDelete: () => void;
  onClear: () => void;
  onLoadDemo: () => void;
};

export function Toolbar({
  location,
  date,
  tool,
  selectedElement,
  message,
  hasElements,
  onLocationChange,
  onDateChange,
  onToolChange,
  onSelectedNumberChange,
  onDelete,
  onClear,
  onLoadDemo
}: ToolbarProps) {
  const isObstacle = selectedElement && selectedElement.kind !== "yard" && selectedElement.kind !== "planting-bed";

  return (
    <aside className="panel">
      <h1>Garden Planner</h1>
      <p>Choose a drawing tool, then click the yard to place an element.</p>

      <div className="field">
        <label htmlFor="location">Location</label>
        <input
          id="location"
          onChange={(event) => onLocationChange(event.target.value)}
          placeholder="Latitude, longitude"
          value={location}
        />
      </div>

      <div className="field">
        <label htmlFor="date">Date</label>
        <input id="date" onChange={(event) => onDateChange(event.target.value)} type="date" value={date} />
      </div>

      <div className="field">
        <label htmlFor="tool">Drawing tool</label>
        <select id="tool" onChange={(event) => onToolChange(event.target.value as DrawingTool)} value={tool}>
          {Object.entries(toolLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {selectedElement ? (
        <section className="editor-fields" aria-labelledby="selected-element-heading">
          <h2 id="selected-element-heading">Selected {toolLabels[selectedElement.kind]}</h2>
          <div className="geometry-grid">
            <NumberField field="x" label="X position" value={selectedElement.x} onChange={onSelectedNumberChange} />
            <NumberField field="y" label="Y position" value={selectedElement.y} onChange={onSelectedNumberChange} />
            <NumberField field="width" label="Width" value={selectedElement.width} onChange={onSelectedNumberChange} />
            <NumberField field="height" label="Depth" value={selectedElement.height} onChange={onSelectedNumberChange} />
          </div>
          {isObstacle ? (
            <NumberField
              field="obstacleHeightMeters"
              label="Obstacle height (m)"
              value={selectedElement.obstacleHeightMeters ?? 0}
              onChange={onSelectedNumberChange}
            />
          ) : null}
          <button className="danger-button full-width-button" onClick={onDelete} type="button">
            Delete selected
          </button>
        </section>
      ) : (
        <p className="selection-hint">Select an element to adjust its geometry or remove it.</p>
      )}

      <div className="button-row">
        <button className="primary-button" onClick={onLoadDemo} type="button">
          Load demo
        </button>
        <button className="secondary-button" disabled={!hasElements} onClick={onClear} type="button">
          Clear
        </button>
      </div>
      <p aria-live="polite" className="editor-message" role="status">
        {message}
      </p>
    </aside>
  );
}

function NumberField({
  field,
  label,
  value,
  onChange
}: {
  field: "x" | "y" | "width" | "height" | "obstacleHeightMeters";
  label: string;
  value: number;
  onChange: ToolbarProps["onSelectedNumberChange"];
}) {
  const [rawValue, setRawValue] = useState(String(value));
  const min = field === "width" || field === "height" ? 2 : field === "obstacleHeightMeters" ? 0.1 : 0;

  useEffect(() => {
    setRawValue(String(value));
  }, [value]);

  const updateValue = (nextValue: string) => {
    setRawValue(nextValue);
    if (nextValue !== "" && Number.isFinite(Number(nextValue))) {
      onChange(field, nextValue);
    }
  };

  return (
    <div className="field">
      <label htmlFor={field}>{label}</label>
      <input
        id={field}
        inputMode="decimal"
        min={min}
        onBlur={() => {
          if (rawValue === "" || !Number.isFinite(Number(rawValue))) {
            onChange(field, rawValue);
            setRawValue(String(value));
          }
        }}
        onChange={(event) => updateValue(event.target.value)}
        step="0.1"
        type="number"
        value={rawValue}
      />
    </div>
  );
}
