export const GARDEN_WORKSPACE_STORAGE_KEY =
  "sun-aware-garden-planner:garden-workspace:v1";

export const growingAreaKinds = [
  "raised-bed",
  "in-ground",
  "container",
  "greenhouse",
] as const;
export type GrowingAreaKind = (typeof growingAreaKinds)[number];

export type LayoutPoint = { x: number; y: number };
export type PlanPlacement = { x: number; y: number; rotationDegrees: number };
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
export type GardenPlan = { widthMeters: number; depthMeters: number };
export type GrowingArea = {
  id: string;
  name: string;
  kind: GrowingAreaKind;
  planPlacement: PlanPlacement;
  layout?: GrowingAreaLayout;
};

export const plantingCropFamilies = [
  "nightshade",
  "brassica",
  "cucurbit",
  "legume",
  "allium",
  "root",
  "leafy",
  "other",
] as const;
export type PlantingCropFamily = (typeof plantingCropFamilies)[number];
export type PlantingRecord = {
  id: string;
  commonName: string;
  cropFamily: PlantingCropFamily;
  quantity: number;
  plantingDate: string;
  growingAreaId: string;
  isActive: boolean;
};
export type Garden = {
  id: string;
  name: string;
  plan: GardenPlan;
  growingAreas: GrowingArea[];
  plantings: PlantingRecord[];
};
export type GardenWorkspace = {
  version: 4;
  selectedGardenId: string;
  gardens: Garden[];
};

type Version3GardenWorkspace = {
  version: 3;
  garden: Omit<Garden, "growingAreas" | "plantings">;
  growingAreas: GrowingArea[];
  plantings: PlantingRecord[];
};

type Version2GardenWorkspace = {
  version: 2;
  garden: Omit<Garden, "growingAreas" | "plantings">;
  growingAreas: GrowingArea[];
};

type LegacyGardenWorkspace = {
  version: 1;
  garden: { id: string; name: string };
  growingAreas: Omit<GrowingArea, "planPlacement">[];
};

export const DEFAULT_GARDEN_PLAN: GardenPlan = {
  widthMeters: 10,
  depthMeters: 6,
};

export const growingAreaKindLabels: Record<GrowingAreaKind, string> = {
  "raised-bed": "Raised bed",
  "in-ground": "In-ground area",
  container: "Container group",
  greenhouse: "Greenhouse shelf",
};

export const plantingCropFamilyLabels: Record<PlantingCropFamily, string> = {
  nightshade: "Nightshade",
  brassica: "Brassica",
  cucurbit: "Cucurbit",
  legume: "Legume",
  allium: "Allium",
  root: "Root crop",
  leafy: "Leafy green",
  other: "Other or unknown",
};

export function createGarden(name: string): Garden {
  return {
    id: createId("garden"),
    name,
    plan: { ...DEFAULT_GARDEN_PLAN },
    growingAreas: [],
    plantings: [],
  };
}

export function createGardenWorkspace(name: string): GardenWorkspace {
  const garden = createGarden(name);
  return { version: 4, selectedGardenId: garden.id, gardens: [garden] };
}

export function createDemoGardenWorkspace(): GardenWorkspace {
  const garden: Garden = {
    id: "demo-garden",
    name: "Demo Garden",
    plan: { widthMeters: 10, depthMeters: 6 },
    growingAreas: [
      {
        id: "demo-raised-bed",
        name: "Sample raised bed",
        kind: "raised-bed",
        planPlacement: { x: 0.8, y: 1, rotationDegrees: 0 },
        layout: {
          widthMeters: 3,
          depthMeters: 1.2,
          boundary: rectangularBoundary(3, 1.2),
          allocations: [
            {
              id: "demo-tomato",
              label: "Tomato",
              x: 0.6,
              y: 0.6,
              diameterMeters: 0.6,
            },
          ],
        },
      },
      {
        id: "demo-in-ground-area",
        name: "Sample in-ground area",
        kind: "in-ground",
        planPlacement: { x: 4.7, y: 2.6, rotationDegrees: 10 },
        layout: createRectangularLayout(3.8, 1.8),
      },
      {
        id: "demo-container-group",
        name: "Sample container group",
        kind: "container",
        planPlacement: { x: 5.2, y: 0.6, rotationDegrees: 0 },
        layout: createRectangularLayout(1.4, 1.1),
      },
    ],
    plantings: [
      {
        id: "demo-planting-tomatoes",
        commonName: "Tomatoes",
        cropFamily: "nightshade",
        quantity: 4,
        plantingDate: "2026-05-18",
        growingAreaId: "demo-raised-bed",
        isActive: true,
      },
      {
        id: "demo-planting-beans",
        commonName: "Bush beans",
        cropFamily: "legume",
        quantity: 12,
        plantingDate: "2026-05-24",
        growingAreaId: "demo-in-ground-area",
        isActive: true,
      },
    ],
  };

  return { version: 4, selectedGardenId: garden.id, gardens: [garden] };
}

export function createRectangularLayout(
  widthMeters: number,
  depthMeters: number,
): GrowingAreaLayout {
  return {
    widthMeters,
    depthMeters,
    boundary: rectangularBoundary(widthMeters, depthMeters),
    allocations: [],
  };
}

export function validateLayoutDimensions(
  widthMeters: number,
  depthMeters: number,
) {
  return (
    Number.isFinite(widthMeters) &&
    Number.isFinite(depthMeters) &&
    widthMeters >= 0.1 &&
    depthMeters >= 0.1
  );
}

export function validateGardenPlanDimensions(
  widthMeters: number,
  depthMeters: number,
) {
  return validateLayoutDimensions(widthMeters, depthMeters);
}

export function snapToGrid(value: number) {
  return Math.round(value * 10) / 10;
}

export function clampPlanPosition(
  point: LayoutPoint,
  plan: GardenPlan,
): LayoutPoint {
  return {
    x: snapToGrid(Math.min(Math.max(point.x, 0), plan.widthMeters)),
    y: snapToGrid(Math.min(Math.max(point.y, 0), plan.depthMeters)),
  };
}

export function normalizePlanRotation(value: number) {
  return snapToGrid(((value % 360) + 360) % 360);
}

export function defaultPlanPlacement(index: number): PlanPlacement {
  return {
    x: snapToGrid(0.5 + (index % 3) * 3),
    y: snapToGrid(0.5 + Math.floor(index / 3) * 2),
    rotationDegrees: 0,
  };
}

export function clampAllocationCenter(
  point: LayoutPoint,
  layout: Pick<GrowingAreaLayout, "widthMeters" | "depthMeters">,
): LayoutPoint {
  return {
    x: snapToGrid(Math.min(Math.max(point.x, 0), layout.widthMeters)),
    y: snapToGrid(Math.min(Math.max(point.y, 0), layout.depthMeters)),
  };
}

export function findDuplicatePlantPosition(
  source: PlantAllocation,
  layout: GrowingAreaLayout,
): LayoutPoint | undefined {
  const sourceRow = Math.round(snapToGrid(source.y) * 10);
  const preferred = {
    x: snapToGrid(source.x + source.diameterMeters),
    y: snapToGrid(source.y),
  };
  const maxColumn = Math.round(layout.widthMeters * 10);
  const maxRow = Math.round(layout.depthMeters * 10);
  const occupied = new Set(layout.allocations.map(pointKey));
  const plants = layout.allocations.some(
    (allocation) => allocation.id === source.id,
  )
    ? layout.allocations
    : [...layout.allocations, source];

  return gridPointsAfter(sourceRow, maxRow, maxColumn, preferred).find(
    (point) =>
      !occupied.has(pointKey(point)) &&
      plants.every((plant) => !spacingCirclesOverlap(point, source, plant)),
  );
}

function gridPointsAfter(
  sourceRow: number,
  maxRow: number,
  maxColumn: number,
  preferred: LayoutPoint,
) {
  const preferredPoint = {
    x: Math.round(preferred.x * 10),
    y: Math.round(preferred.y * 10),
  };
  const preferredPoints =
    preferredPoint.x >= 0 &&
    preferredPoint.x <= maxColumn &&
    preferredPoint.y >= 0 &&
    preferredPoint.y <= maxRow
      ? [{ x: preferredPoint.x / 10, y: preferredPoint.y / 10 }]
      : [];
  const laterRows: LayoutPoint[] = [];
  const earlierRows: LayoutPoint[] = [];
  const sameRow: LayoutPoint[] = [];

  for (let row = sourceRow + 1; row <= maxRow; row += 1) {
    for (let column = 0; column <= maxColumn; column += 1)
      laterRows.push({ x: column / 10, y: row / 10 });
  }
  for (let row = sourceRow - 1; row >= 0; row -= 1) {
    for (let column = 0; column <= maxColumn; column += 1)
      earlierRows.push({ x: column / 10, y: row / 10 });
  }
  for (let column = 0; column <= maxColumn; column += 1)
    sameRow.push({ x: column / 10, y: sourceRow / 10 });

  const points = [
    ...preferredPoints,
    ...laterRows.sort(
      (left, right) =>
        distanceToPreferred(left, preferred) -
        distanceToPreferred(right, preferred),
    ),
    ...earlierRows.sort(
      (left, right) =>
        distanceToPreferred(left, preferred) -
        distanceToPreferred(right, preferred),
    ),
    ...sameRow.sort(
      (left, right) =>
        distanceToPreferred(left, preferred) -
        distanceToPreferred(right, preferred),
    ),
  ];
  return points.filter(
    (point, index) =>
      points.findIndex(
        (candidate) => pointKey(candidate) === pointKey(point),
      ) === index,
  );
}

function pointKey(point: LayoutPoint) {
  return `${Math.round(snapToGrid(point.x) * 10)},${Math.round(snapToGrid(point.y) * 10)}`;
}

function distanceToPreferred(point: LayoutPoint, preferred: LayoutPoint) {
  return (point.x - preferred.x) ** 2 + (point.y - preferred.y) ** 2;
}

function spacingCirclesOverlap(
  point: LayoutPoint,
  source: PlantAllocation,
  plant: PlantAllocation,
) {
  return (
    Math.hypot(point.x - plant.x, point.y - plant.y) <
    (source.diameterMeters + plant.diameterMeters) / 2 - Number.EPSILON
  );
}

export function readGardenWorkspace(
  value: string | null,
): GardenWorkspace | undefined {
  if (!value) return undefined;

  try {
    const parsed: unknown = JSON.parse(value);
    if (isGardenWorkspace(parsed)) return parsed;
    if (isVersion3GardenWorkspace(parsed))
      return migrateVersion3GardenWorkspace(parsed);
    if (isVersion2GardenWorkspace(parsed))
      return migrateVersion3GardenWorkspace({
        ...parsed,
        version: 3,
        plantings: [],
      });
    if (isLegacyGardenWorkspace(parsed)) {
      return migrateVersion3GardenWorkspace({
        version: 3,
        garden: { ...parsed.garden, plan: { ...DEFAULT_GARDEN_PLAN } },
        growingAreas: parsed.growingAreas.map((area, index) => ({
          ...area,
          planPlacement: defaultPlanPlacement(index),
        })),
        plantings: [],
      });
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function migrateVersion3GardenWorkspace(
  workspace: Version3GardenWorkspace,
): GardenWorkspace {
  const garden: Garden = {
    ...workspace.garden,
    growingAreas: workspace.growingAreas,
    plantings: workspace.plantings,
  };
  return { version: 4, selectedGardenId: garden.id, gardens: [garden] };
}

function isGardenWorkspace(value: unknown): value is GardenWorkspace {
  if (!value || typeof value !== "object") return false;
  const workspace = value as Partial<GardenWorkspace>;
  return (
    workspace.version === 4 &&
    typeof workspace.selectedGardenId === "string" &&
    Array.isArray(workspace.gardens) &&
    workspace.gardens.every(isGarden) &&
    workspace.gardens.some((garden) => garden.id === workspace.selectedGardenId)
  );
}

function isVersion3GardenWorkspace(
  value: unknown,
): value is Version3GardenWorkspace {
  if (!value || typeof value !== "object") return false;
  const workspace = value as Partial<Version3GardenWorkspace>;
  return (
    workspace.version === 3 &&
    Boolean(
      workspace.garden &&
        isNamedRecord(workspace.garden) &&
        isGardenPlan(workspace.garden.plan),
    ) &&
    isGardenContents(workspace.growingAreas, workspace.plantings)
  );
}

function isVersion2GardenWorkspace(
  value: unknown,
): value is Version2GardenWorkspace {
  if (!value || typeof value !== "object") return false;
  const workspace = value as Partial<Version2GardenWorkspace>;
  return (
    workspace.version === 2 &&
    Boolean(
      workspace.garden &&
        isNamedRecord(workspace.garden) &&
        isGardenPlan(workspace.garden.plan),
    ) &&
    Array.isArray(workspace.growingAreas) &&
    workspace.growingAreas.every(isGrowingArea)
  );
}

function isLegacyGardenWorkspace(
  value: unknown,
): value is LegacyGardenWorkspace {
  if (!value || typeof value !== "object") return false;
  const workspace = value as Partial<LegacyGardenWorkspace>;
  return (
    workspace.version === 1 &&
    Boolean(workspace.garden && isNamedRecord(workspace.garden)) &&
    Array.isArray(workspace.growingAreas) &&
    workspace.growingAreas.every((area) =>
      Boolean(
        area &&
          isNamedRecord(area) &&
          growingAreaKinds.includes(area.kind) &&
          (!area.layout || isGrowingAreaLayout(area.layout)),
      ),
    )
  );
}

function isGarden(value: unknown): value is Garden {
  return Boolean(
    value &&
      isNamedRecord(value) &&
      isGardenPlan((value as Garden).plan) &&
      isGardenContents(
        (value as Garden).growingAreas,
        (value as Garden).plantings,
      ),
  );
}

function isGardenContents(growingAreas: unknown, plantings: unknown) {
  return (
    Array.isArray(growingAreas) &&
    growingAreas.every(isGrowingArea) &&
    Array.isArray(plantings) &&
    plantings.every(
      (planting) =>
        isPlantingRecord(planting) &&
        growingAreas.some((area) => area.id === planting.growingAreaId),
    )
  );
}

function isGrowingArea(value: unknown): value is GrowingArea {
  if (!value || !isNamedRecord(value)) return false;
  const area = value as Partial<GrowingArea>;
  return Boolean(
    area.kind &&
      growingAreaKinds.includes(area.kind) &&
      isPlanPlacement(area.planPlacement) &&
      (!area.layout || isGrowingAreaLayout(area.layout)),
  );
}

function isGardenPlan(value: unknown): value is GardenPlan {
  return Boolean(
    value &&
      typeof value === "object" &&
      validateGardenPlanDimensions(
        (value as GardenPlan).widthMeters,
        (value as GardenPlan).depthMeters,
      ),
  );
}

function isPlanPlacement(value: unknown): value is PlanPlacement {
  return Boolean(
    value &&
      typeof value === "object" &&
      Number.isFinite((value as PlanPlacement).x) &&
      (value as PlanPlacement).x >= 0 &&
      Number.isFinite((value as PlanPlacement).y) &&
      (value as PlanPlacement).y >= 0 &&
      Number.isFinite((value as PlanPlacement).rotationDegrees),
  );
}

function isGrowingAreaLayout(value: unknown): value is GrowingAreaLayout {
  if (!value || typeof value !== "object") return false;
  const layout = value as Partial<GrowingAreaLayout>;
  return (
    validateLayoutDimensions(
      layout.widthMeters ?? Number.NaN,
      layout.depthMeters ?? Number.NaN,
    ) &&
    Array.isArray(layout.boundary) &&
    layout.boundary.length >= 3 &&
    layout.boundary.every(isPoint) &&
    Array.isArray(layout.allocations) &&
    layout.allocations.every(
      (allocation) =>
        isAllocation(allocation) &&
        allocation.x >= 0 &&
        allocation.x <= layout.widthMeters! &&
        allocation.y >= 0 &&
        allocation.y <= layout.depthMeters!,
    )
  );
}

function isPoint(value: unknown): value is LayoutPoint {
  return Boolean(
    value &&
      typeof value === "object" &&
      Number.isFinite((value as LayoutPoint).x) &&
      Number.isFinite((value as LayoutPoint).y),
  );
}

function isAllocation(value: unknown): value is PlantAllocation {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as PlantAllocation).id === "string" &&
      (value as PlantAllocation).id.trim() &&
      typeof (value as PlantAllocation).label === "string" &&
      (value as PlantAllocation).label.trim() &&
      Number.isFinite((value as PlantAllocation).x) &&
      Number.isFinite((value as PlantAllocation).y) &&
      Number.isFinite((value as PlantAllocation).diameterMeters) &&
      (value as PlantAllocation).diameterMeters > 0,
  );
}

function isPlantingRecord(value: unknown): value is PlantingRecord {
  if (!value || typeof value !== "object") return false;
  const planting = value as Partial<PlantingRecord>;
  return (
    typeof planting.id === "string" &&
    Boolean(planting.id.trim()) &&
    typeof planting.commonName === "string" &&
    Boolean(planting.commonName.trim()) &&
    Boolean(
      planting.cropFamily && plantingCropFamilies.includes(planting.cropFamily),
    ) &&
    typeof planting.quantity === "number" &&
    Number.isInteger(planting.quantity) &&
    planting.quantity > 0 &&
    typeof planting.plantingDate === "string" &&
    isCalendarDate(planting.plantingDate) &&
    typeof planting.growingAreaId === "string" &&
    Boolean(planting.growingAreaId.trim()) &&
    typeof planting.isActive === "boolean"
  );
}

function isCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function rectangularBoundary(
  widthMeters: number,
  depthMeters: number,
): LayoutPoint[] {
  return [
    { x: 0, y: 0 },
    { x: widthMeters, y: 0 },
    { x: widthMeters, y: depthMeters },
    { x: 0, y: depthMeters },
  ];
}

function isNamedRecord(value: unknown): value is { id: string; name: string } {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "name" in value &&
      typeof value.id === "string" &&
      value.id.trim() &&
      typeof value.name === "string" &&
      value.name.trim(),
  );
}

function createId(prefix: string) {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}
