import { describe, expect, it } from "vitest";

import {
  clampAllocationCenter,
  clampPlanPosition,
  createRectangularLayout,
  defaultPlanPlacement,
  findDuplicatePlantPosition,
  normalizePlanRotation,
  readGardenWorkspace,
  snapToGrid,
  validateGardenPlanDimensions,
  validateLayoutDimensions,
} from "@/lib/gardenWorkspace";

describe("readGardenWorkspace", () => {
  it("migrates a v3 garden into a selected multi-garden collection without losing records or layouts", () => {
    const v3 = {
      version: 3,
      garden: {
        id: "garden-1",
        name: "Home garden",
        plan: { widthMeters: 8, depthMeters: 5 },
      },
      growingAreas: [
        {
          id: "area-1",
          name: "North bed",
          kind: "raised-bed",
          planPlacement: { x: 1, y: 2, rotationDegrees: 10 },
          layout: {
            widthMeters: 1.2,
            depthMeters: 0.8,
            boundary: [
              { x: 0, y: 0 },
              { x: 1.2, y: 0 },
              { x: 1.2, y: 0.8 },
              { x: 0, y: 0.8 },
            ],
            allocations: [
              {
                id: "allocation-1",
                label: "Tomato",
                x: 0.6,
                y: 0.4,
                diameterMeters: 0.5,
              },
            ],
          },
        },
      ],
      plantings: [
        {
          id: "planting-1",
          commonName: "Tomatoes",
          cropFamily: "nightshade",
          quantity: 4,
          plantingDate: "2026-05-18",
          growingAreaId: "area-1",
          isActive: true,
        },
      ],
    };
    expect(readGardenWorkspace(JSON.stringify(v3))).toEqual({
      version: 4,
      selectedGardenId: "garden-1",
      gardens: [
        {
          id: "garden-1",
          name: "Home garden",
          plan: { widthMeters: 8, depthMeters: 5 },
          growingAreas: v3.growingAreas,
          plantings: v3.plantings,
        },
      ],
    });
  });

  it("keeps independent gardens and rejects a record linked outside its garden", () => {
    const valid = {
      version: 4,
      selectedGardenId: "home",
      gardens: [
        {
          id: "home",
          name: "Home garden",
          plan: { widthMeters: 10, depthMeters: 6 },
          growingAreas: [
            {
              id: "home-bed",
              name: "Home bed",
              kind: "raised-bed",
              planPlacement: { x: 1, y: 1, rotationDegrees: 0 },
            },
          ],
          plantings: [],
        },
        {
          id: "community",
          name: "Community plot",
          plan: { widthMeters: 4, depthMeters: 4 },
          growingAreas: [
            {
              id: "community-bed",
              name: "Plot bed",
              kind: "in-ground",
              planPlacement: { x: 0, y: 0, rotationDegrees: 0 },
            },
          ],
          plantings: [
            {
              id: "planting-1",
              commonName: "Beans",
              cropFamily: "legume",
              quantity: 8,
              plantingDate: "2026-05-18",
              growingAreaId: "community-bed",
              isActive: true,
            },
          ],
        },
      ],
    };
    expect(readGardenWorkspace(JSON.stringify(valid))).toMatchObject({
      selectedGardenId: "home",
      gardens: [
        { name: "Home garden" },
        { name: "Community plot", plantings: [{ commonName: "Beans" }] },
      ],
    });
    expect(
      readGardenWorkspace(
        JSON.stringify({
          ...valid,
          gardens: [
            { ...valid.gardens[0], plantings: valid.gardens[1].plantings },
            valid.gardens[1],
          ],
        }),
      ),
    ).toBeUndefined();
  });

  it("migrates v1 and v2 workspaces with measured layouts", () => {
    const v1 = {
      version: 1,
      garden: { id: "garden-1", name: "Backyard garden" },
      growingAreas: [
        {
          id: "area-1",
          name: "North bed",
          kind: "raised-bed",
          layout: {
            widthMeters: 1.2,
            depthMeters: 0.8,
            boundary: [
              { x: 0, y: 0 },
              { x: 1.2, y: 0 },
              { x: 1.2, y: 0.8 },
              { x: 0, y: 0.8 },
            ],
            allocations: [
              {
                id: "allocation-1",
                label: "Tomato",
                x: 0.6,
                y: 0.4,
                diameterMeters: 0.5,
              },
            ],
          },
        },
      ],
    };
    const v2 = {
      version: 2,
      garden: {
        id: "garden-2",
        name: "Side garden",
        plan: { widthMeters: 4, depthMeters: 3 },
      },
      growingAreas: [
        {
          id: "area-2",
          name: "Patio",
          kind: "container",
          planPlacement: { x: 1, y: 2, rotationDegrees: 0 },
        },
      ],
    };
    expect(readGardenWorkspace(JSON.stringify(v1))).toMatchObject({
      version: 4,
      gardens: [
        {
          plan: { widthMeters: 10, depthMeters: 6 },
          growingAreas: [
            {
              planPlacement: { x: 0.5, y: 0.5, rotationDegrees: 0 },
              layout: { allocations: [{ label: "Tomato" }] },
            },
          ],
        },
      ],
    });
    expect(readGardenWorkspace(JSON.stringify(v2))).toMatchObject({
      version: 4,
      selectedGardenId: "garden-2",
      gardens: [
        {
          plan: { widthMeters: 4, depthMeters: 3 },
          growingAreas: [{ name: "Patio" }],
        },
      ],
    });
  });

  it("validates Garden Plan dimensions and grid-snaps placement values", () => {
    expect(validateGardenPlanDimensions(3, 2)).toBe(true);
    expect(validateGardenPlanDimensions(0, 2)).toBe(false);
    expect(
      clampPlanPosition(
        { x: 3.08, y: -0.03 },
        { widthMeters: 3, depthMeters: 2 },
      ),
    ).toEqual({ x: 3, y: 0 });
    expect(defaultPlanPlacement(4)).toEqual({
      x: 3.5,
      y: 2.5,
      rotationDegrees: 0,
    });
    expect(normalizePlanRotation(-10.2)).toBe(349.8);
  });

  it("validates metric dimensions and keeps duplicate allocations from overlapping", () => {
    const layout = createRectangularLayout(2, 2);
    layout.allocations = [
      { id: "plant-1", label: "Tomato", x: 0.5, y: 0.5, diameterMeters: 0.6 },
    ];
    expect(validateLayoutDimensions(1.2, 0.8)).toBe(true);
    expect(validateLayoutDimensions(0, 0.8)).toBe(false);
    expect(snapToGrid(0.26)).toBe(0.3);
    expect(clampAllocationCenter({ x: 2.2, y: -0.03 }, layout)).toEqual({
      x: 2,
      y: 0,
    });
    expect(findDuplicatePlantPosition(layout.allocations[0], layout)).toEqual({
      x: 1.1,
      y: 0.5,
    });
  });
});
