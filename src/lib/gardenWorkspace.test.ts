import { describe, expect, it } from "vitest";

import { clampAllocationCenter, createRectangularLayout, findDuplicatePlantPosition, readGardenWorkspace, snapToGrid, validateLayoutDimensions } from "@/lib/gardenWorkspace";

describe("readGardenWorkspace", () => {
  it("returns only complete, supported workspace data", () => {
    expect(readGardenWorkspace(JSON.stringify({
      version: 1,
      garden: { id: "garden-1", name: "Backyard garden" },
      growingAreas: [{ id: "area-1", name: "North bed", kind: "raised-bed" }]
    }))).toMatchObject({ garden: { name: "Backyard garden" } });

    expect(readGardenWorkspace(JSON.stringify({
      version: 1,
      garden: { id: "", name: "Backyard garden" },
      growingAreas: []
    }))).toBeUndefined();
    expect(readGardenWorkspace('{bad json')).toBeUndefined();
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
