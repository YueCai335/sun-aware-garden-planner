export const GARDEN_WORKSPACE_STORAGE_KEY = "sun-aware-garden-planner:garden-workspace:v1";

export const growingAreaKinds = ["raised-bed", "in-ground", "container", "greenhouse"] as const;

export type GrowingAreaKind = (typeof growingAreaKinds)[number];

export type GrowingArea = {
  id: string;
  name: string;
  kind: GrowingAreaKind;
  layout?: GrowingAreaLayout;
};

export type LayoutPoint = { x: number; y: number };

export type PlantAllocation = {
  id: string;
  label: string;
  x: number;
  y: number;
  diameterMeters: number;
};

export type GrowingAreaLayout = {
  widthMeters: number;
  depthMeters: number;
  boundary: LayoutPoint[];
  allocations: PlantAllocation[];
};

export type GardenWorkspace = {
  version: 1;
  garden: { id: string; name: string };
  growingAreas: GrowingArea[];
};

export const growingAreaKindLabels: Record<GrowingAreaKind, string> = {
  "raised-bed": "Raised bed",
  "in-ground": "In-ground area",
  container: "Container group",
  greenhouse: "Greenhouse shelf"
};

export function createGardenWorkspace(name: string): GardenWorkspace {
  return { version: 1, garden: { id: createId("garden"), name }, growingAreas: [] };
}

export function createDemoGardenWorkspace(): GardenWorkspace {
  return {
    version: 1,
    garden: { id: "demo-garden", name: "Demo Garden" },
    growingAreas: [
      {
        id: "demo-raised-bed",
        name: "Sample raised bed",
        kind: "raised-bed",
        layout: {
          widthMeters: 3,
          depthMeters: 1.2,
          boundary: rectangularBoundary(3, 1.2),
          allocations: [
            { id: "demo-tomato", label: "Tomato", x: 0.6, y: 0.6, diameterMeters: 0.6 }
          ]
        }
      }
    ]
  };
}

export function createRectangularLayout(widthMeters: number, depthMeters: number): GrowingAreaLayout {
  return { widthMeters, depthMeters, boundary: rectangularBoundary(widthMeters, depthMeters), allocations: [] };
}

export function validateLayoutDimensions(widthMeters: number, depthMeters: number) {
  return Number.isFinite(widthMeters) && Number.isFinite(depthMeters) && widthMeters >= 0.1 && depthMeters >= 0.1;
}

export function snapToGrid(value: number) {
  return Math.round(value * 10) / 10;
}

export function clampAllocationCenter(point: LayoutPoint, layout: Pick<GrowingAreaLayout, "widthMeters" | "depthMeters">): LayoutPoint {
  return {
    x: snapToGrid(Math.min(Math.max(point.x, 0), layout.widthMeters)),
    y: snapToGrid(Math.min(Math.max(point.y, 0), layout.depthMeters))
  };
}

export function findDuplicatePlantPosition(source: PlantAllocation, layout: GrowingAreaLayout): LayoutPoint | undefined {
  const sourceColumn = Math.round(snapToGrid(source.x) * 10), sourceRow = Math.round(snapToGrid(source.y) * 10);
  const preferred = { x: snapToGrid(source.x + source.diameterMeters), y: snapToGrid(source.y) };
  const maxColumn = Math.round(layout.widthMeters * 10), maxRow = Math.round(layout.depthMeters * 10);
  const occupied = new Set(layout.allocations.map((allocation) => pointKey(allocation)));
  const candidates = gridPointsAfter(sourceRow, maxRow, maxColumn, preferred);
  const available = candidates.filter((point) => !occupied.has(pointKey(point)));
  const plants = layout.allocations.some((allocation) => allocation.id === source.id) ? layout.allocations : [...layout.allocations, source];

  return available.find((point) => plants.every((plant) => !spacingCirclesOverlap(point, source, plant)));
}

function gridPointsAfter(sourceRow: number, maxRow: number, maxColumn: number, preferred: LayoutPoint): LayoutPoint[] {
  const preferredPoint = { x: Math.round(preferred.x * 10), y: Math.round(preferred.y * 10) };
  const preferredPoints = preferredPoint.x >= 0 && preferredPoint.x <= maxColumn && preferredPoint.y >= 0 && preferredPoint.y <= maxRow ? [{ x: preferredPoint.x / 10, y: preferredPoint.y / 10 }] : [];
  const laterRows: LayoutPoint[] = [], earlierRows: LayoutPoint[] = [], sameRow: LayoutPoint[] = [];
  for (let row = sourceRow + 1; row <= maxRow; row += 1) {
    for (let column = 0; column <= maxColumn; column += 1) laterRows.push({ x: column / 10, y: row / 10 });
  }
  for (let row = sourceRow - 1; row >= 0; row -= 1) {
    for (let column = 0; column <= maxColumn; column += 1) earlierRows.push({ x: column / 10, y: row / 10 });
  }
  for (let column = 0; column <= maxColumn; column += 1) sameRow.push({ x: column / 10, y: sourceRow / 10 });

  const points = [...preferredPoints, ...sortByDistance(laterRows, preferred), ...sortByDistance(earlierRows, preferred), ...sortByDistance(sameRow, preferred)];
  return points.filter((point, index) => points.findIndex((candidate) => pointKey(candidate) === pointKey(point)) === index);
}

function sortByDistance(points: LayoutPoint[], preferred: LayoutPoint) {
  return points.sort((left, right) => distanceToPreferred(left, preferred) - distanceToPreferred(right, preferred));
}

function pointKey(point: LayoutPoint) {
  return `${Math.round(snapToGrid(point.x) * 10)},${Math.round(snapToGrid(point.y) * 10)}`;
}

function distanceToPreferred(point: LayoutPoint, preferred: LayoutPoint) {
  return (point.x - preferred.x) ** 2 + (point.y - preferred.y) ** 2;
}

function spacingCirclesOverlap(point: LayoutPoint, source: PlantAllocation, plant: PlantAllocation) {
  return Math.hypot(point.x - plant.x, point.y - plant.y) < (source.diameterMeters + plant.diameterMeters) / 2 - Number.EPSILON;
}

export function readGardenWorkspace(value: string | null): GardenWorkspace | undefined {
  if (!value) return undefined;

  try {
    const parsed: unknown = JSON.parse(value);
    return isGardenWorkspace(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function isGardenWorkspace(value: unknown): value is GardenWorkspace {
  if (!value || typeof value !== "object") return false;
  const workspace = value as Partial<GardenWorkspace>;
  return workspace.version === 1
    && Boolean(workspace.garden && isNamedRecord(workspace.garden))
    && Array.isArray(workspace.growingAreas)
    && workspace.growingAreas.every((area) => Boolean(area && isNamedRecord(area) && growingAreaKinds.includes(area.kind) && (!area.layout || isGrowingAreaLayout(area.layout))));
}

function isGrowingAreaLayout(value: unknown): value is GrowingAreaLayout {
  if (!value || typeof value !== "object") return false;
  const layout = value as Partial<GrowingAreaLayout>;
  return validateLayoutDimensions(layout.widthMeters ?? Number.NaN, layout.depthMeters ?? Number.NaN)
    && Array.isArray(layout.boundary) && layout.boundary.length >= 3 && layout.boundary.every(isPoint)
    && Array.isArray(layout.allocations) && layout.allocations.every((allocation) => isAllocation(allocation)
      && allocation.x >= 0 && allocation.x <= layout.widthMeters! && allocation.y >= 0 && allocation.y <= layout.depthMeters!);
}

function isPoint(value: unknown): value is LayoutPoint {
  return Boolean(value && typeof value === "object" && Number.isFinite((value as LayoutPoint).x) && Number.isFinite((value as LayoutPoint).y));
}

function isAllocation(value: unknown): value is PlantAllocation {
  return Boolean(value && typeof value === "object" && typeof (value as PlantAllocation).id === "string" && (value as PlantAllocation).id.trim()
    && typeof (value as PlantAllocation).label === "string" && (value as PlantAllocation).label.trim()
    && Number.isFinite((value as PlantAllocation).x) && Number.isFinite((value as PlantAllocation).y)
    && Number.isFinite((value as PlantAllocation).diameterMeters) && (value as PlantAllocation).diameterMeters > 0);
}

function rectangularBoundary(widthMeters: number, depthMeters: number): LayoutPoint[] {
  return [{ x: 0, y: 0 }, { x: widthMeters, y: 0 }, { x: widthMeters, y: depthMeters }, { x: 0, y: depthMeters }];
}

function isNamedRecord(value: unknown): value is { id: string; name: string } {
  return Boolean(value && typeof value === "object" && "id" in value && "name" in value
    && typeof value.id === "string" && value.id.trim()
    && typeof value.name === "string" && value.name.trim());
}

function createId(prefix: string) {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
