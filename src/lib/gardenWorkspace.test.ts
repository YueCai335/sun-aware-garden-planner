import { describe, expect, it } from "vitest";

import { clampAllocationCenter, clampPlanPosition, createRectangularLayout, defaultPlanPlacement, findDuplicatePlantPosition, normalizePlanRotation, readGardenWorkspace, snapToGrid, validateGardenPlanDimensions, validateLayoutDimensions } from "@/lib/gardenWorkspace";

describe("readGardenWorkspace", () => {
  it("migrates saved version 1 workspaces without losing layouts or plant allocations", () => {
    const restored = readGardenWorkspace(JSON.stringify({
      version: 1,
      garden: { id: "garden-1", name: "Backyard garden" },
      growingAreas: [{ id: "area-1", name: "North bed", kind: "raised-bed", layout: { widthMeters: 1.2, depthMeters: 0.8, boundary: [{ x: 0, y: 0 }, { x: 1.2, y: 0 }, { x: 1.2, y: 0.8 }, { x: 0, y: 0.8 }], allocations: [{ id: "plant-1", label: "Tomato", x: 0.6, y: 0.4, diameterMeters: 0.5 }] } }]
    }));
    expect(restored).toMatchObject({ version: 3, garden: { name: "Backyard garden", plan: { widthMeters: 10, depthMeters: 6 } }, growingAreas: [{ planPlacement: { x: 0.5, y: 0.5, rotationDegrees: 0 }, layout: { allocations: [{ label: "Tomato" }] } }], plantings: [] });

    expect(readGardenWorkspace(JSON.stringify({
      version: 1,
      garden: { id: "", name: "Backyard garden" },
      growingAreas: []
    }))).toBeUndefined();
    expect(readGardenWorkspace('{bad json')).toBeUndefined();
  });

  it("migrates version 2 workspaces without losing their plan, layout, or allocations", () => {
    const restored = readGardenWorkspace(JSON.stringify({
      version: 2,
      garden: { id: "garden-1", name: "Backyard garden", plan: { widthMeters: 8, depthMeters: 5 } },
      growingAreas: [{ id: "area-1", name: "North bed", kind: "raised-bed", planPlacement: { x: 1, y: 2, rotationDegrees: 10 }, layout: { widthMeters: 1.2, depthMeters: 0.8, boundary: [{ x: 0, y: 0 }, { x: 1.2, y: 0 }, { x: 1.2, y: 0.8 }, { x: 0, y: 0.8 }], allocations: [{ id: "plant-1", label: "Tomato", x: 0.6, y: 0.4, diameterMeters: 0.5 }] } }]
    }));

    expect(restored).toMatchObject({ version: 3, garden: { plan: { widthMeters: 8, depthMeters: 5 } }, growingAreas: [{ planPlacement: { x: 1, y: 2, rotationDegrees: 10 }, layout: { allocations: [{ label: "Tomato" }] } }], plantings: [] });
  });

  it("accepts valid planting records and rejects invalid planting data", () => {
    const base = {
      version: 3,
      garden: { id: "garden-1", name: "Backyard garden", plan: { widthMeters: 8, depthMeters: 5 } },
      growingAreas: [{ id: "area-1", name: "North bed", kind: "raised-bed", planPlacement: { x: 1, y: 2, rotationDegrees: 10 } }],
      plantings: [{ id: "planting-1", commonName: "Tomatoes", cropFamily: "nightshade", quantity: 4, plantingDate: "2026-05-18", growingAreaId: "area-1", isActive: true }]
    };

    expect(readGardenWorkspace(JSON.stringify(base))).toMatchObject({ plantings: [{ commonName: "Tomatoes", quantity: 4 }] });
    expect(readGardenWorkspace(JSON.stringify({ ...base, plantings: [{ ...base.plantings[0], quantity: 1.5 }] }))).toBeUndefined();
    expect(readGardenWorkspace(JSON.stringify({ ...base, plantings: [{ ...base.plantings[0], plantingDate: "2026-02-30" }] }))).toBeUndefined();
    expect(readGardenWorkspace(JSON.stringify({ ...base, plantings: [{ ...base.plantings[0], growingAreaId: "missing-area" }] }))).toBeUndefined();
  });

  it("validates Garden Plan dimensions and grid-snaps placement values", () => {
    const plan = { widthMeters: 3, depthMeters: 2 };

    expect(validateGardenPlanDimensions(3, 2)).toBe(true);
    expect(validateGardenPlanDimensions(0, 2)).toBe(false);
    expect(clampPlanPosition({ x: 3.08, y: -0.03 }, plan)).toEqual({ x: 3, y: 0 });
    expect(defaultPlanPlacement(4)).toEqual({ x: 3.5, y: 2.5, rotationDegrees: 0 });
    expect(normalizePlanRotation(-10.2)).toBe(349.8);
  });

  it("validates metric dimensions and snaps allocation centres inside a layout", () => {
    const layout = createRectangularLayout(1.2, 0.8);

    expect(validateLayoutDimensions(1.2, 0.8)).toBe(true);
    expect(validateLayoutDimensions(0, 0.8)).toBe(false);
    expect(snapToGrid(0.26)).toBe(0.3);
    expect(clampAllocationCenter({ x: 1.27, y: -0.03 }, layout)).toEqual({ x: 1.2, y: 0 });
  });

  it("rejects saved allocations whose centres are outside their measured area", () => {
    expect(readGardenWorkspace(JSON.stringify({
      version: 1,
      garden: { id: "garden-1", name: "Backyard garden" },
      growingAreas: [{
        id: "area-1", name: "North bed", kind: "raised-bed",
        layout: { widthMeters: 1, depthMeters: 1, boundary: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }], allocations: [{ id: "plant-1", label: "Tomato", x: 1.1, y: 0.5, diameterMeters: 0.5 }] }
      }]
    }))).toBeUndefined();
  });

  it("uses the source spacing to place a duplicate and avoids existing spacing circles", () => {
    const layout = createRectangularLayout(2, 2);
    layout.allocations = [{ id: "plant-1", label: "Tomato", x: 0.5, y: 0.5, diameterMeters: 0.6 }];

    expect(findDuplicatePlantPosition(layout.allocations[0], layout)).toEqual({ x: 1.1, y: 0.5 });
    layout.allocations.push({ id: "plant-2", label: "Tomato", x: 1.1, y: 0.5, diameterMeters: 0.6 });
    expect(findDuplicatePlantPosition(layout.allocations[0], layout)).toEqual({ x: 1.1, y: 1.1 });
  });

  it("does not return an overlapping position when the area has no valid spacing", () => {
    const layout = createRectangularLayout(0.2, 0.2);
    layout.allocations = [{ id: "plant-1", label: "Tomato", x: 0.1, y: 0.1, diameterMeters: 0.6 }];

    expect(findDuplicatePlantPosition(layout.allocations[0], layout)).toBeUndefined();
  });

});
