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
export const careEventTypes = ["watering", "fertilizing"] as const;
export type CareEventType = (typeof careEventTypes)[number];
export type CareEventTargetScope = "garden" | "planting-area" | "plant-group";
export type CareEvent = {
  id: string;
  type: CareEventType;
  date: string;
  note: string;
  targetScope: CareEventTargetScope;
  growingAreaId?: string;
  growingAreaName?: string;
  targetAreaDeleted?: boolean;
  plantingRecordId?: string;
  plantingRecordName?: string;
  targetPlantingRecordDeleted?: boolean;
  fertilizerProduct?: string;
  fertilizerAmount?: number;
  fertilizerUnit?: string;
};
export type CareTask = {
  id: string;
  type: CareEventType;
  dueDate: string;
  note: string;
  targetScope: CareEventTargetScope;
  growingAreaId?: string;
  growingAreaName?: string;
  targetAreaDeleted?: boolean;
  plantingRecordId?: string;
  plantingRecordName?: string;
  targetPlantingRecordDeleted?: boolean;
  repeatIntervalDays?: number;
};
export type Garden = {
  id: string;
  name: string;
  plan: GardenPlan;
  growingAreas: GrowingArea[];
  plantings: PlantingRecord[];
  careEvents: CareEvent[];
  careTasks: CareTask[];
};
export type GardenWorkspace = {
  version: 8;
  selectedGardenId: string;
  gardens: Garden[];
};

type Version7CareTask = CareTask & { completedDate?: string };
type Version7Garden = Omit<Garden, "careTasks"> & {
  careTasks: Version7CareTask[];
};
type Version7GardenWorkspace = {
  version: 7;
  selectedGardenId: string;
  gardens: Version7Garden[];
};
type Version6Garden = Omit<Garden, "careTasks">;
type Version6GardenWorkspace = {
  version: 6;
  selectedGardenId: string;
  gardens: Version6Garden[];
};

type Version5CareEvent = Omit<CareEvent, "targetScope"> & {
  targetScope: "garden" | "planting-area";
};
type Version5Garden = Omit<Garden, "careEvents" | "careTasks"> & {
  careEvents: Version5CareEvent[];
};
type Version5GardenWorkspace = {
  version: 5;
  selectedGardenId: string;
  gardens: Version5Garden[];
};
type Version4Garden = Omit<Garden, "careEvents" | "careTasks">;
type Version4GardenWorkspace = {
  version: 4;
  selectedGardenId: string;
  gardens: Version4Garden[];
};

type Version3GardenWorkspace = {
  version: 3;
  garden: Omit<
    Garden,
    "growingAreas" | "plantings" | "careEvents" | "careTasks"
  >;
  growingAreas: GrowingArea[];
  plantings: PlantingRecord[];
};

type Version2GardenWorkspace = {
  version: 2;
  garden: Omit<
    Garden,
    "growingAreas" | "plantings" | "careEvents" | "careTasks"
  >;
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
    careEvents: [],
    careTasks: [],
  };
}

export function createGardenWorkspace(name: string): GardenWorkspace {
  const garden = createGarden(name);
  return { version: 8, selectedGardenId: garden.id, gardens: [garden] };
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
    careEvents: [],
    careTasks: [],
  };

  return { version: 8, selectedGardenId: garden.id, gardens: [garden] };
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
    if (isVersion7GardenWorkspace(parsed))
      return migrateVersion7GardenWorkspace(parsed);
    if (isVersion6GardenWorkspace(parsed))
      return migrateVersion6GardenWorkspace(parsed);
    if (isVersion5GardenWorkspace(parsed))
      return migrateVersion5GardenWorkspace(parsed);
    if (isVersion4GardenWorkspace(parsed))
      return migrateVersion4GardenWorkspace(parsed);
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
    careEvents: [],
    careTasks: [],
  };
  return { version: 8, selectedGardenId: garden.id, gardens: [garden] };
}

function migrateVersion4GardenWorkspace(
  workspace: Version4GardenWorkspace,
): GardenWorkspace {
  return {
    version: 8,
    selectedGardenId: workspace.selectedGardenId,
    gardens: workspace.gardens.map((garden) => ({
      ...garden,
      careEvents: [],
      careTasks: [],
    })),
  };
}

function migrateVersion5GardenWorkspace(
  workspace: Version5GardenWorkspace,
): GardenWorkspace {
  return {
    version: 8,
    selectedGardenId: workspace.selectedGardenId,
    gardens: workspace.gardens.map((garden) => ({ ...garden, careTasks: [] })),
  };
}

function migrateVersion6GardenWorkspace(
  workspace: Version6GardenWorkspace,
): GardenWorkspace {
  return {
    version: 8,
    selectedGardenId: workspace.selectedGardenId,
    gardens: workspace.gardens.map((garden) => ({ ...garden, careTasks: [] })),
  };
}

function migrateVersion7GardenWorkspace(
  workspace: Version7GardenWorkspace,
): GardenWorkspace {
  return {
    version: 8,
    selectedGardenId: workspace.selectedGardenId,
    gardens: workspace.gardens.map((garden) => ({
      ...garden,
      careTasks: garden.careTasks.flatMap(({ completedDate, ...task }) =>
        completedDate ? [] : [task],
      ),
    })),
  };
}

function isGardenWorkspace(value: unknown): value is GardenWorkspace {
  if (!value || typeof value !== "object") return false;
  const workspace = value as Partial<GardenWorkspace>;
  return (
    workspace.version === 8 &&
    typeof workspace.selectedGardenId === "string" &&
    Array.isArray(workspace.gardens) &&
    workspace.gardens.every(isGarden) &&
    workspace.gardens.some((garden) => garden.id === workspace.selectedGardenId)
  );
}

function isVersion7GardenWorkspace(
  value: unknown,
): value is Version7GardenWorkspace {
  if (!value || typeof value !== "object") return false;
  const workspace = value as Partial<Version7GardenWorkspace>;
  return (
    workspace.version === 7 &&
    typeof workspace.selectedGardenId === "string" &&
    Array.isArray(workspace.gardens) &&
    workspace.gardens.every(isVersion7Garden) &&
    workspace.gardens.some((garden) => garden.id === workspace.selectedGardenId)
  );
}

function isVersion6GardenWorkspace(
  value: unknown,
): value is Version6GardenWorkspace {
  if (!value || typeof value !== "object") return false;
  const workspace = value as Partial<Version6GardenWorkspace>;
  return (
    workspace.version === 6 &&
    typeof workspace.selectedGardenId === "string" &&
    Array.isArray(workspace.gardens) &&
    workspace.gardens.every(isVersion6Garden) &&
    workspace.gardens.some((garden) => garden.id === workspace.selectedGardenId)
  );
}

function isVersion5GardenWorkspace(
  value: unknown,
): value is Version5GardenWorkspace {
  if (!value || typeof value !== "object") return false;
  const workspace = value as Partial<Version5GardenWorkspace>;
  return (
    workspace.version === 5 &&
    typeof workspace.selectedGardenId === "string" &&
    Array.isArray(workspace.gardens) &&
    workspace.gardens.every(isVersion5Garden) &&
    workspace.gardens.some((garden) => garden.id === workspace.selectedGardenId)
  );
}

function isVersion4GardenWorkspace(
  value: unknown,
): value is Version4GardenWorkspace {
  if (!value || typeof value !== "object") return false;
  const workspace = value as Partial<Version4GardenWorkspace>;
  return (
    workspace.version === 4 &&
    typeof workspace.selectedGardenId === "string" &&
    Array.isArray(workspace.gardens) &&
    workspace.gardens.every(isVersion4Garden) &&
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
      ) &&
      Array.isArray((value as Garden).careEvents) &&
      (value as Garden).careEvents.every((event) =>
        isCareEvent(
          event,
          (value as Garden).growingAreas,
          (value as Garden).plantings,
        ),
      ) &&
      Array.isArray((value as Garden).careTasks) &&
      (value as Garden).careTasks.every((task) =>
        isCareTask(
          task,
          (value as Garden).growingAreas,
          (value as Garden).plantings,
        ),
      ),
  );
}

function isVersion6Garden(value: unknown): value is Version6Garden {
  if (!value || typeof value !== "object") return false;
  const garden = value as Version6Garden;
  return (
    isNamedRecord(garden) &&
    isGardenPlan(garden.plan) &&
    isGardenContents(garden.growingAreas, garden.plantings) &&
    Array.isArray(garden.careEvents) &&
    garden.careEvents.every((event) =>
      isCareEvent(event, garden.growingAreas, garden.plantings),
    )
  );
}

function isVersion7Garden(value: unknown): value is Version7Garden {
  if (!value || typeof value !== "object") return false;
  const garden = value as Version7Garden;
  return (
    isNamedRecord(garden) &&
    isGardenPlan(garden.plan) &&
    isGardenContents(garden.growingAreas, garden.plantings) &&
    Array.isArray(garden.careEvents) &&
    garden.careEvents.every((event) =>
      isCareEvent(event, garden.growingAreas, garden.plantings),
    ) &&
    Array.isArray(garden.careTasks) &&
    garden.careTasks.every((task) =>
      isVersion7CareTask(task, garden.growingAreas, garden.plantings),
    )
  );
}

function isVersion4Garden(value: unknown): value is Version4Garden {
  return Boolean(
    value &&
      isNamedRecord(value) &&
      isGardenPlan((value as Version4Garden).plan) &&
      isGardenContents(
        (value as Version4Garden).growingAreas,
        (value as Version4Garden).plantings,
      ),
  );
}

function isVersion5Garden(value: unknown): value is Version5Garden {
  return Boolean(
    value &&
      isNamedRecord(value) &&
      isGardenPlan((value as Version5Garden).plan) &&
      isGardenContents(
        (value as Version5Garden).growingAreas,
        (value as Version5Garden).plantings,
      ) &&
      Array.isArray((value as Version5Garden).careEvents) &&
      (value as Version5Garden).careEvents.every((event) =>
        isVersion5CareEvent(event, (value as Version5Garden).growingAreas),
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

function isCareEvent(
  value: unknown,
  growingAreas?: GrowingArea[],
  plantings?: PlantingRecord[],
): value is CareEvent {
  if (!isCareEventBase(value)) return false;
  const event = value as Partial<CareEvent>;
  const hasNoAreaTarget =
    event.growingAreaId === undefined &&
    event.growingAreaName === undefined &&
    event.targetAreaDeleted === undefined;
  const hasNoPlantGroupTarget =
    event.plantingRecordId === undefined &&
    event.plantingRecordName === undefined &&
    event.targetPlantingRecordDeleted === undefined;
  const hasValidDeletionFlags =
    (event.targetAreaDeleted === undefined ||
      typeof event.targetAreaDeleted === "boolean") &&
    (event.targetPlantingRecordDeleted === undefined ||
      typeof event.targetPlantingRecordDeleted === "boolean");
  return (
    hasValidDeletionFlags &&
    (event.targetScope === "garden" ||
      event.targetScope === "planting-area" ||
      event.targetScope === "plant-group") &&
    (event.targetScope === "garden"
      ? hasNoAreaTarget && hasNoPlantGroupTarget
      : event.targetScope === "planting-area"
        ? typeof event.growingAreaId === "string" &&
        Boolean(event.growingAreaId.trim()) &&
        typeof event.growingAreaName === "string" &&
        Boolean(event.growingAreaName.trim()) &&
        (!growingAreas ||
          growingAreas.some((area) => area.id === event.growingAreaId) ||
          event.targetAreaDeleted === true) &&
        hasNoPlantGroupTarget
        :
        typeof event.plantingRecordId === "string" &&
        Boolean(event.plantingRecordId.trim()) &&
        typeof event.plantingRecordName === "string" &&
        Boolean(event.plantingRecordName.trim()) &&
        (!plantings ||
          plantings.some((planting) => planting.id === event.plantingRecordId) ||
          event.targetPlantingRecordDeleted === true) &&
        hasNoAreaTarget)
  );
}

function isVersion5CareEvent(
  value: unknown,
  growingAreas?: GrowingArea[],
): value is Version5CareEvent {
  if (!isCareEventBase(value)) return false;
  const event = value as Partial<Version5CareEvent>;
  return (
    (event.targetScope === "garden" || event.targetScope === "planting-area") &&
    (event.targetScope === "garden" ||
      (typeof event.growingAreaId === "string" &&
        Boolean(event.growingAreaId.trim()) &&
        typeof event.growingAreaName === "string" &&
        Boolean(event.growingAreaName.trim()) &&
        (!growingAreas ||
          growingAreas.some((area) => area.id === event.growingAreaId) ||
          event.targetAreaDeleted === true)))
  );
}

function isCareTask(
  value: unknown,
  growingAreas?: GrowingArea[],
  plantings?: PlantingRecord[],
): value is CareTask {
  if (!value || typeof value !== "object") return false;
  const task = value as Partial<CareTask>;
  const hasNoAreaTarget =
    task.growingAreaId === undefined &&
    task.growingAreaName === undefined &&
    task.targetAreaDeleted === undefined;
  const hasNoPlantGroupTarget =
    task.plantingRecordId === undefined &&
    task.plantingRecordName === undefined &&
    task.targetPlantingRecordDeleted === undefined;
  const hasValidDeletionFlags =
    (task.targetAreaDeleted === undefined ||
      typeof task.targetAreaDeleted === "boolean") &&
    (task.targetPlantingRecordDeleted === undefined ||
      typeof task.targetPlantingRecordDeleted === "boolean");
  return (
    typeof task.id === "string" &&
    Boolean(task.id.trim()) &&
    Boolean(task.type && careEventTypes.includes(task.type)) &&
    typeof task.dueDate === "string" &&
    isCalendarDate(task.dueDate) &&
    typeof task.note === "string" &&
    (task.repeatIntervalDays === undefined ||
      (Number.isInteger(task.repeatIntervalDays) && task.repeatIntervalDays > 0)) &&
    hasValidDeletionFlags &&
    (task.targetScope === "garden" ||
      task.targetScope === "planting-area" ||
      task.targetScope === "plant-group") &&
    (task.targetScope === "garden"
      ? hasNoAreaTarget && hasNoPlantGroupTarget
      : task.targetScope === "planting-area"
        ? typeof task.growingAreaId === "string" &&
          Boolean(task.growingAreaId.trim()) &&
          typeof task.growingAreaName === "string" &&
          Boolean(task.growingAreaName.trim()) &&
          (!growingAreas ||
            growingAreas.some((area) => area.id === task.growingAreaId) ||
            task.targetAreaDeleted === true) &&
          hasNoPlantGroupTarget
        : typeof task.plantingRecordId === "string" &&
          Boolean(task.plantingRecordId.trim()) &&
          typeof task.plantingRecordName === "string" &&
          Boolean(task.plantingRecordName.trim()) &&
          (!plantings ||
            plantings.some((planting) => planting.id === task.plantingRecordId) ||
            task.targetPlantingRecordDeleted === true) &&
          hasNoAreaTarget)
  );
}

function isVersion7CareTask(
  value: unknown,
  growingAreas?: GrowingArea[],
  plantings?: PlantingRecord[],
): value is Version7CareTask {
  if (!isCareTask(value, growingAreas, plantings)) return false;
  const task = value as Version7CareTask;
  return task.completedDate === undefined || isCalendarDate(task.completedDate);
}

function isCareEventBase(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<CareEvent>;
  const hasValidOptionalFertilizerDetails =
    (event.fertilizerProduct === undefined ||
      (typeof event.fertilizerProduct === "string" &&
        Boolean(event.fertilizerProduct.trim()))) &&
    (event.fertilizerAmount === undefined ||
      (typeof event.fertilizerAmount === "number" &&
        Number.isFinite(event.fertilizerAmount) &&
        event.fertilizerAmount > 0)) &&
    (event.fertilizerUnit === undefined ||
      (typeof event.fertilizerUnit === "string" &&
        Boolean(event.fertilizerUnit.trim())));
  return (
    typeof event.id === "string" &&
    Boolean(event.id.trim()) &&
    Boolean(event.type && careEventTypes.includes(event.type)) &&
    typeof event.date === "string" &&
    isCalendarDate(event.date) &&
    typeof event.note === "string" &&
    (event.type === "fertilizing"
      ? hasValidOptionalFertilizerDetails
      : event.fertilizerProduct === undefined &&
        event.fertilizerAmount === undefined &&
        event.fertilizerUnit === undefined)
  );
}

export function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

export function careTaskStatus(
  task: Pick<CareTask, "dueDate">,
  today: string,
) {
  if (task.dueDate < today) return "overdue" as const;
  if (task.dueDate === today) return "due-today" as const;
  return "upcoming" as const;
}

export function todayDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
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
