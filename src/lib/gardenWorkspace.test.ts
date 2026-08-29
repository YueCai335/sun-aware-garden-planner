import { describe, expect, it } from "vitest";

import { readGardenWorkspace } from "@/lib/gardenWorkspace";

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
});
