export const GARDEN_WORKSPACE_STORAGE_KEY = "sun-aware-garden-planner:garden-workspace:v1";

export const growingAreaKinds = ["raised-bed", "in-ground", "container", "greenhouse"] as const;

export type GrowingAreaKind = (typeof growingAreaKinds)[number];

export type GrowingArea = {
  id: string;
  name: string;
  kind: GrowingAreaKind;
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
    garden: { id: "demo-garden", name: "Blainville Garden" },
    growingAreas: [
      { id: "demo-north-bed", name: "North raised bed", kind: "raised-bed" },
      { id: "demo-patio-containers", name: "Patio containers", kind: "container" }
    ]
  };
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
    && workspace.growingAreas.every((area) => Boolean(area && isNamedRecord(area) && growingAreaKinds.includes(area.kind)));
}

function isNamedRecord(value: unknown): value is { id: string; name: string } {
  return Boolean(value && typeof value === "object" && "id" in value && "name" in value
    && typeof value.id === "string" && value.id.trim()
    && typeof value.name === "string" && value.name.trim());
}

function createId(prefix: string) {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
