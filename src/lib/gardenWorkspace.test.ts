import { describe, expect, it } from "vitest";

import {
  addDays,
  careTaskStatus,
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
      version: 8,
      selectedGardenId: "garden-1",
      gardens: [
        {
          id: "garden-1",
          name: "Home garden",
          plan: { widthMeters: 8, depthMeters: 5 },
          growingAreas: v3.growingAreas,
          plantings: v3.plantings,
          careEvents: [],
          careTasks: [],
        },
      ],
    });
  });

  it("keeps independent gardens and rejects a record linked outside its garden", () => {
    const valid = {
      version: 8,
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
          careEvents: [],
          careTasks: [],
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
          careEvents: [],
          careTasks: [],
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
    expect(
      readGardenWorkspace(
        JSON.stringify({
          ...valid,
          gardens: [
            {
              ...valid.gardens[0],
              careEvents: [
                {
                  id: "care-1",
                  type: "watering",
                  date: "2026-06-01",
                  note: "",
                  targetScope: "planting-area",
                  growingAreaId: "community-bed",
                  growingAreaName: "Plot bed",
                },
              ],
            },
            valid.gardens[1],
          ],
        }),
      ),
    ).toBeUndefined();
  });

  it("migrates v4 gardens without changing their existing contents", () => {
    const v4 = {
      version: 4,
      selectedGardenId: "garden-1",
      gardens: [
        {
          id: "garden-1",
          name: "Home garden",
          plan: { widthMeters: 8, depthMeters: 5 },
          growingAreas: [],
          plantings: [],
        },
      ],
    };

    expect(readGardenWorkspace(JSON.stringify(v4))).toEqual({
      version: 8,
      selectedGardenId: "garden-1",
      gardens: [{ ...v4.gardens[0], careEvents: [], careTasks: [] }],
    });
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
      version: 8,
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
      version: 8,
      selectedGardenId: "garden-2",
      gardens: [
        {
          plan: { widthMeters: 4, depthMeters: 3 },
          growingAreas: [{ name: "Patio" }],
        },
      ],
    });
  });

  it("migrates v5 care events and validates plant-group history", () => {
    const v5 = {
      version: 5,
      selectedGardenId: "garden-1",
      gardens: [
        {
          id: "garden-1",
          name: "Home garden",
          plan: { widthMeters: 8, depthMeters: 5 },
          growingAreas: [
            {
              id: "area-1",
              name: "North bed",
              kind: "raised-bed",
              planPlacement: { x: 1, y: 1, rotationDegrees: 0 },
            },
            {
              id: "area-2",
              name: "South bed",
              kind: "in-ground",
              planPlacement: { x: 3, y: 1, rotationDegrees: 0 },
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
            {
              id: "planting-2",
              commonName: "Tomatoes",
              cropFamily: "nightshade",
              quantity: 2,
              plantingDate: "2026-05-20",
              growingAreaId: "area-2",
              isActive: true,
            },
          ],
          careEvents: [
            {
              id: "care-1",
              type: "watering",
              date: "2026-06-01",
              note: "",
              targetScope: "planting-area",
              growingAreaId: "area-1",
              growingAreaName: "North bed",
            },
          ],
        },
      ],
    };
    expect(readGardenWorkspace(JSON.stringify(v5))).toMatchObject({
      version: 8,
      gardens: [{ careEvents: [{ targetScope: "planting-area" }] }],
    });

    const plantGroupWorkspace = {
      ...v5,
      version: 8,
      gardens: [
        {
          ...v5.gardens[0],
          careTasks: [],
          careEvents: [
            {
              id: "care-2",
              type: "fertilizing",
              date: "2026-06-02",
              note: "",
              targetScope: "plant-group",
              plantingRecordId: "planting-2",
              plantingRecordName: "Tomatoes · South bed",
            },
          ],
        },
      ],
    };
    expect(readGardenWorkspace(JSON.stringify(plantGroupWorkspace))).toEqual(
      plantGroupWorkspace,
    );
    expect(
      readGardenWorkspace(
        JSON.stringify({
          ...plantGroupWorkspace,
          gardens: [
            {
              ...plantGroupWorkspace.gardens[0],
              plantings: [],
              careEvents: [
                {
                  ...plantGroupWorkspace.gardens[0].careEvents[0],
                  targetPlantingRecordDeleted: true,
                },
              ],
            },
          ],
        }),
      ),
    ).toMatchObject({
      gardens: [
        { careEvents: [{ targetPlantingRecordDeleted: true }] },
      ],
    });
    expect(
      readGardenWorkspace(
        JSON.stringify({
          ...plantGroupWorkspace,
          gardens: [
            {
              ...plantGroupWorkspace.gardens[0],
              careEvents: [
                {
                  ...plantGroupWorkspace.gardens[0].careEvents[0],
                  plantingRecordId: "missing-planting",
                },
              ],
            },
          ],
        }),
      ),
    ).toBeUndefined();
  });

  it("migrates v6 care history into v8 task storage", () => {
    const v6 = {
      version: 6,
      selectedGardenId: "garden-1",
      gardens: [
        {
          id: "garden-1",
          name: "Home garden",
          plan: { widthMeters: 8, depthMeters: 5 },
          growingAreas: [],
          plantings: [],
          careEvents: [],
        },
      ],
    };
    expect(readGardenWorkspace(JSON.stringify(v6))).toEqual({
      version: 8,
      selectedGardenId: "garden-1",
      gardens: [{ ...v6.gardens[0], careTasks: [] }],
    });
  });

  it("migrates completed v7 tasks out of the open task list", () => {
    const v7 = {
      version: 7,
      selectedGardenId: "garden-1",
      gardens: [
        {
          id: "garden-1",
          name: "Home garden",
          plan: { widthMeters: 8, depthMeters: 5 },
          growingAreas: [],
          plantings: [],
          careEvents: [
            {
              id: "care-1",
              type: "watering",
              date: "2026-08-31",
              note: "",
              targetScope: "garden",
            },
          ],
          careTasks: [
            {
              id: "completed-task",
              type: "watering",
              dueDate: "2026-08-30",
              note: "",
              targetScope: "garden",
              completedDate: "2026-08-31",
            },
            {
              id: "open-task",
              type: "fertilizing",
              dueDate: "2026-09-07",
              note: "Feed tomatoes",
              targetScope: "garden",
            },
          ],
        },
      ],
    };

    expect(readGardenWorkspace(JSON.stringify(v7))).toMatchObject({
      version: 8,
      gardens: [
        {
          careEvents: [{ id: "care-1" }],
          careTasks: [{ id: "open-task" }],
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

  it("calculates task status and repeat dates from calendar dates", () => {
    expect(careTaskStatus({ dueDate: "2026-08-30" }, "2026-08-31")).toBe(
      "overdue",
    );
    expect(careTaskStatus({ dueDate: "2026-08-31" }, "2026-08-31")).toBe(
      "due-today",
    );
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });
});
