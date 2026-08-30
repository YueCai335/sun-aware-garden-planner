"use client";

import { useEffect, useState } from "react";

import { Toolbar } from "@/components/Toolbar";
import { GardenMap } from "@/components/GardenMap";
import { YardCanvas } from "@/components/YardCanvas";
import { validateBoundary } from "@/lib/yardGeometry";
import type { DrawingTool, LegacyYardElement, LegacyYardProject, Point, YardObject, YardObjectKind, YardProject } from "@/lib/types";

export const V1_STORAGE_KEY = "sun-aware-garden-planner:yard-project:v1";
export const V2_STORAGE_KEY = "sun-aware-garden-planner:yard-project:v2";
const MIN_SIZE = 0.25;
const defaults: Record<YardObjectKind, Omit<YardObject, "id" | "kind" | "x" | "y">> = {
  house: { width: 6, depth: 5, obstacleHeightMeters: 6 }, tree: { width: 2.5, depth: 2.5, obstacleHeightMeters: 7 },
  fence: { width: 6, depth: 0.4, obstacleHeightMeters: 1.8 }, "planting-bed": { width: 3, depth: 1.2 }
};

export function YardEditor() {
  const [project, setProject] = useState<YardProject>(() => createNewProject());
  const [legacyProject, setLegacyProject] = useState<LegacyYardProject>();
  const [setupWidth, setSetupWidth] = useState("20");
  const [setupDepth, setSetupDepth] = useState("15");
  const [tool, setTool] = useState<DrawingTool>("select");
  const [selectedId, setSelectedId] = useState<string>();
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number>();
  const [message, setMessage] = useState("Your yard changes save in this browser.");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const restored = readSavedProject();
    if (restored.v2) { setProject(restored.v2); setMessage("Saved V2 yard restored."); }
    else if (restored.v1) { setLegacyProject(restored.v1); setMessage("Set up the saved yard with its real reference-grid dimensions."); }
    else if (restored.hadSavedData) setMessage("Saved yard data could not be read. A new yard is ready.");
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded && !legacyProject) window.localStorage.setItem(V2_STORAGE_KEY, JSON.stringify(project));
  }, [isLoaded, legacyProject, project]);

  const selectedObject = project.objects.find((object) => object.id === selectedId);
  const updateProject = (updater: (current: YardProject) => YardProject) => setProject(updater);

  const addObject = (kind: YardObjectKind, point: Point) => {
    const object = clampObject({ id: newId(), kind, ...defaults[kind], x: point.x - defaults[kind].width / 2, y: point.y - defaults[kind].depth / 2 }, project.referenceGrid);
    updateProject((current) => ({ ...current, objects: [...current.objects, object] }));
    setSelectedId(object.id); setSelectedVertexIndex(undefined);
    setMessage(`${labelFor(kind)} added. Drag it, use its corner controls, or enter exact metre values.`);
  };
  const moveObject = (id: string, point: Point) => {
    updateProject((current) => ({ ...current, objects: current.objects.map((object) => object.id === id ? clampObject({ ...object, ...point }, current.referenceGrid) : object) }));
    setMessage("Object position updated.");
  };
  const resizeObject = (id: string, corner: "nw" | "ne" | "se" | "sw", point: Point) => {
    updateProject((current) => {
      const object = current.objects.find((item) => item.id === id);
      if (!object) return current;
      const right = object.x + object.width, bottom = object.y + object.depth;
      const left = corner === "nw" || corner === "sw" ? clamp(point.x, 0, right - MIN_SIZE) : object.x;
      const top = corner === "nw" || corner === "ne" ? clamp(point.y, 0, bottom - MIN_SIZE) : object.y;
      const nextRight = corner === "ne" || corner === "se" ? clamp(point.x, object.x + MIN_SIZE, current.referenceGrid.widthMeters) : right;
      const nextBottom = corner === "se" || corner === "sw" ? clamp(point.y, object.y + MIN_SIZE, current.referenceGrid.depthMeters) : bottom;
      const next = { ...object, x: round(left), y: round(top), width: round(nextRight - left), depth: round(nextBottom - top) };
      return { ...current, objects: current.objects.map((item) => item.id === id ? next : item) };
    });
    setMessage("Object size updated.");
  };
  const updateSelectedNumber = (field: "x" | "y" | "width" | "depth" | "obstacleHeightMeters", rawValue: string) => {
    const value = Number(rawValue);
    if (!selectedId || rawValue === "" || !Number.isFinite(value)) { setMessage("Enter a number to update the selected object."); return; }
    if (field === "obstacleHeightMeters" && value <= 0) { setMessage("Obstacle height must be greater than zero."); return; }
    updateProject((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedId ? clampObject({ ...object, [field]: value }, current.referenceGrid) : object) }));
    setMessage(`${selectedObject ? labelFor(selectedObject.kind) : "Object"} updated.`);
  };
  const updateGrid = (field: "widthMeters" | "depthMeters", rawValue: string) => {
    const value = Number(rawValue);
    if (rawValue === "" || !Number.isFinite(value) || value < 1) { setMessage("Reference-grid dimensions must be at least 1 metre."); return; }
    updateProject((current) => {
      const previous = current.referenceGrid, nextGrid = { ...previous, [field]: round(value) };
      const xScale = nextGrid.widthMeters / previous.widthMeters, yScale = nextGrid.depthMeters / previous.depthMeters;
      return { ...current, referenceGrid: nextGrid, boundary: current.boundary.map((point) => ({ x: round(point.x * xScale), y: round(point.y * yScale) })), objects: current.objects.map((object) => clampObject({ ...object, x: round(object.x * xScale), y: round(object.y * yScale), width: round(object.width * xScale), depth: round(object.depth * yScale) }, nextGrid)) };
    });
    setMessage("Reference grid updated and existing geometry was scaled with it.");
  };
  const updateNorthBearing = (rawValue: string) => {
    const value = Number(rawValue);
    if (rawValue === "" || !Number.isFinite(value)) return;
    updateProject((current) => ({ ...current, northBearingDegrees: round(((value % 360) + 360) % 360) }));
    setMessage("North orientation updated.");
  };
  const moveBoundaryVertex = (index: number, point: Point) => {
    const nextBoundary = project.boundary.map((vertex, vertexIndex) => vertexIndex === index ? { x: round(point.x), y: round(point.y) } : vertex);
    const error = validateBoundary(nextBoundary, project.referenceGrid);
    if (error) { setMessage(error); return; }
    updateProject((current) => ({ ...current, boundary: nextBoundary })); setMessage("Yard boundary updated.");
  };
  const addBoundaryVertex = () => {
    const index = longestBoundaryEdge(project.boundary), start = project.boundary[index], end = project.boundary[(index + 1) % project.boundary.length];
    const vertex = { x: round((start.x + end.x) / 2), y: round((start.y + end.y) / 2) };
    updateProject((current) => ({ ...current, boundary: [...current.boundary.slice(0, index + 1), vertex, ...current.boundary.slice(index + 1)] }));
    setSelectedVertexIndex(index + 1); setSelectedId(undefined); setMessage("Boundary vertex added. Drag it to shape the yard.");
  };
  const removeBoundaryVertex = () => {
    if (selectedVertexIndex === undefined || project.boundary.length <= 3) { setMessage("A yard boundary needs at least three vertices."); return; }
    updateProject((current) => ({ ...current, boundary: current.boundary.filter((_, index) => index !== selectedVertexIndex) })); setSelectedVertexIndex(undefined); setMessage("Boundary vertex removed.");
  };
  const deleteObject = (id: string) => {
    const object = project.objects.find((item) => item.id === id);
    if (!object) return;
    updateProject((current) => ({ ...current, objects: current.objects.filter((item) => item.id !== id) })); setSelectedId(undefined); setMessage(`${labelFor(object.kind)} deleted.`);
  };
  const deleteSelected = () => { if (selectedId) deleteObject(selectedId); };
  const finishLegacySetup = () => {
    const width = Number(setupWidth), depth = Number(setupDepth);
    if (!legacyProject || !Number.isFinite(width) || !Number.isFinite(depth) || width < 1 || depth < 1) { setMessage("Enter reference-grid width and depth in metres to continue."); return; }
    setProject(convertLegacyProject(legacyProject, width, depth)); setLegacyProject(undefined); window.localStorage.removeItem(V1_STORAGE_KEY); setMessage("Saved yard converted to the V2 metric reference grid.");
  };

  if (legacyProject) return <section className="panel migration-panel" aria-labelledby="legacy-setup-heading">
    <h1 id="legacy-setup-heading">Set up your saved yard</h1>
    <p>Your earlier layout used screen percentages, so it has no physical scale. Enter the real width and depth of the reference grid once. The layout will keep its relative placement and save as a metre-based V2 project.</p>
    <div className="geometry-grid">
      <div className="field"><label htmlFor="legacy-grid-width">Reference-grid width (m)</label><input id="legacy-grid-width" min="1" onChange={(event) => setSetupWidth(event.target.value)} step="0.1" type="number" value={setupWidth} /></div>
      <div className="field"><label htmlFor="legacy-grid-depth">Reference-grid depth (m)</label><input id="legacy-grid-depth" min="1" onChange={(event) => setSetupDepth(event.target.value)} step="0.1" type="number" value={setupDepth} /></div>
    </div>
    <button className="primary-button" onClick={finishLegacySetup} type="button">Save V2 reference grid</button>
    <p aria-live="polite" className="editor-message" role="status">{message}</p>
  </section>;

  return <>
    <Toolbar boundaryVertexCount={project.boundary.length} date={project.date} gridDepth={project.referenceGrid.depthMeters} gridWidth={project.referenceGrid.widthMeters} hasObjects={project.objects.length > 0} location={project.location} message={message} northBearingDegrees={project.northBearingDegrees} onAddBoundaryVertex={addBoundaryVertex} onClear={() => { updateProject((current) => ({ ...current, objects: [] })); setSelectedId(undefined); setMessage("All yard objects were cleared. Your grid and boundary remain available."); }} onDateChange={(date) => updateProject((current) => ({ ...current, date }))} onDelete={deleteSelected} onGridChange={updateGrid} onLoadDemo={() => { setProject(createDemoProject()); setSelectedId(undefined); setSelectedVertexIndex(undefined); setTool("select"); setMessage("Demo yard loaded."); }} onLocationChange={(location) => updateProject((current) => ({ ...current, location }))} onNorthBearingChange={updateNorthBearing} onRemoveBoundaryVertex={removeBoundaryVertex} onSelectedNumberChange={updateSelectedNumber} onToolChange={setTool} selectedObject={selectedObject} selectedVertexIndex={selectedVertexIndex} tool={tool} />
    <div className="editor-center">
      <GardenMap />
      <YardCanvas boundary={project.boundary} grid={project.referenceGrid} northBearingDegrees={project.northBearingDegrees} objects={project.objects} onAdd={addObject} onDelete={deleteObject} onMove={moveObject} onMoveBoundaryVertex={moveBoundaryVertex} onResize={resizeObject} onSelect={(id) => { setSelectedId(id); setSelectedVertexIndex(undefined); }} onSelectVertex={(index) => { setSelectedVertexIndex(index); setSelectedId(undefined); }} selectedId={selectedId} selectedVertexIndex={selectedVertexIndex} tool={tool} />
    </div>
  </>;
}

export function createNewProject(widthMeters = 20, depthMeters = 15): YardProject { return { version: 2, location: "", date: "", referenceGrid: { widthMeters, depthMeters }, northBearingDegrees: 0, boundary: [{ x: 0, y: 0 }, { x: widthMeters, y: 0 }, { x: widthMeters, y: depthMeters }, { x: 0, y: depthMeters }], objects: [] }; }
function createDemoProject(): YardProject { const project = createNewProject(20, 15); return { ...project, northBearingDegrees: 18, objects: [{ id: "demo-house", kind: "house", x: 2, y: 2, width: 6, depth: 5, obstacleHeightMeters: 6 }, { id: "demo-tree", kind: "tree", x: 14, y: 2, width: 2.5, depth: 2.5, obstacleHeightMeters: 7 }, { id: "demo-fence", kind: "fence", x: 11, y: 11, width: 6, depth: 0.4, obstacleHeightMeters: 1.8 }, { id: "demo-bed", kind: "planting-bed", x: 11, y: 8.5, width: 4, depth: 2 }] }; }

export function convertLegacyProject(legacy: LegacyYardProject, widthMeters: number, depthMeters: number): YardProject {
  const scalePoint = (point: Point) => ({ x: round((point.x / 100) * widthMeters), y: round((point.y / 100) * depthMeters) });
  const legacyYard = legacy.elements.find((element) => element.kind === "yard");
  const boundary = legacyYard ? [scalePoint({ x: legacyYard.x, y: legacyYard.y }), scalePoint({ x: legacyYard.x + legacyYard.width, y: legacyYard.y }), scalePoint({ x: legacyYard.x + legacyYard.width, y: legacyYard.y + legacyYard.height }), scalePoint({ x: legacyYard.x, y: legacyYard.y + legacyYard.height })] : createNewProject(widthMeters, depthMeters).boundary;
  return { version: 2, location: legacy.location, date: legacy.date, referenceGrid: { widthMeters, depthMeters }, northBearingDegrees: 0, boundary, objects: legacy.elements.filter((element) => element.kind !== "yard").map((element) => legacyElementToObject(element, widthMeters, depthMeters)) };
}
function legacyElementToObject(element: LegacyYardElement, widthMeters: number, depthMeters: number): YardObject { return { id: element.id, kind: element.kind as YardObjectKind, x: round((element.x / 100) * widthMeters), y: round((element.y / 100) * depthMeters), width: round((element.width / 100) * widthMeters), depth: round((element.height / 100) * depthMeters), ...(element.obstacleHeightMeters === undefined ? {} : { obstacleHeightMeters: element.obstacleHeightMeters }) }; }
function readSavedProject(): { v2?: YardProject; v1?: LegacyYardProject; hadSavedData: boolean } { const v2 = window.localStorage.getItem(V2_STORAGE_KEY); if (v2) { try { const parsed = JSON.parse(v2); if (isV2Project(parsed)) return { v2: parsed, hadSavedData: true }; } catch {} } const v1 = window.localStorage.getItem(V1_STORAGE_KEY); if (v1) { try { const parsed = JSON.parse(v1); if (isLegacyProject(parsed)) return { v1: parsed, hadSavedData: true }; } catch {} } return { hadSavedData: Boolean(v1 || v2) }; }
function isV2Project(value: unknown): value is YardProject { if (!value || typeof value !== "object") return false; const project = value as Partial<YardProject>; return project.version === 2 && typeof project.location === "string" && typeof project.date === "string" && isGrid(project.referenceGrid) && typeof project.northBearingDegrees === "number" && Number.isFinite(project.northBearingDegrees) && Array.isArray(project.boundary) && project.boundary.every(isPoint) && !validateBoundary(project.boundary, project.referenceGrid) && Array.isArray(project.objects) && project.objects.every(isYardObject); }
function isLegacyProject(value: unknown): value is LegacyYardProject { if (!value || typeof value !== "object") return false; const project = value as Partial<LegacyYardProject>; return typeof project.location === "string" && typeof project.date === "string" && Array.isArray(project.elements) && project.elements.every((element) => element && typeof element === "object" && typeof element.id === "string" && ["yard", "house", "tree", "fence", "planting-bed"].includes(element.kind) && [element.x, element.y, element.width, element.height].every((item) => typeof item === "number" && Number.isFinite(item))); }
function isGrid(value: unknown): value is YardProject["referenceGrid"] { return Boolean(value && typeof value === "object" && typeof (value as YardProject["referenceGrid"]).widthMeters === "number" && typeof (value as YardProject["referenceGrid"]).depthMeters === "number" && (value as YardProject["referenceGrid"]).widthMeters > 0 && (value as YardProject["referenceGrid"]).depthMeters > 0); }
function isPoint(value: unknown): value is Point { return Boolean(value && typeof value === "object" && typeof (value as Point).x === "number" && typeof (value as Point).y === "number"); }
function isYardObject(value: unknown): value is YardObject { return Boolean(value && typeof value === "object" && typeof (value as YardObject).id === "string" && ["house", "tree", "fence", "planting-bed"].includes((value as YardObject).kind) && [(value as YardObject).x, (value as YardObject).y, (value as YardObject).width, (value as YardObject).depth].every((item) => typeof item === "number" && Number.isFinite(item))); }
function clampObject(object: YardObject, grid: YardProject["referenceGrid"]): YardObject { const width = clamp(object.width, MIN_SIZE, grid.widthMeters), depth = clamp(object.depth, MIN_SIZE, grid.depthMeters); return { ...object, x: round(clamp(object.x, 0, grid.widthMeters - width)), y: round(clamp(object.y, 0, grid.depthMeters - depth)), width: round(width), depth: round(depth) }; }
function longestBoundaryEdge(boundary: Point[]) { return boundary.reduce((longest, point, index) => { const next = boundary[(index + 1) % boundary.length], longestPoint = boundary[longest], longestNext = boundary[(longest + 1) % boundary.length]; return Math.hypot(next.x - point.x, next.y - point.y) > Math.hypot(longestNext.x - longestPoint.x, longestNext.y - longestPoint.y) ? index : longest; }, 0); }
function newId() { return globalThis.crypto?.randomUUID?.() ?? `yard-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function labelFor(kind: YardObjectKind) { return kind === "planting-bed" ? "Planting bed" : kind[0].toUpperCase() + kind.slice(1); }
function clamp(value: number, min: number, max: number) { return Math.min(Math.max(value, min), max); }
function round(value: number) { return Math.round(value * 100) / 100; }
