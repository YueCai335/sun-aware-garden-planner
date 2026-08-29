import { describe, expect, it } from "vitest";

import { validateBoundary } from "@/lib/yardGeometry";

describe("validateBoundary", () => {
  it("rejects a self-crossing yard polygon", () => {
    expect(validateBoundary([{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 }], { widthMeters: 10, depthMeters: 10 })).toMatch(/cannot cross/);
  });
  it("accepts a simple irregular yard polygon", () => {
    expect(validateBoundary([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 8, y: 4 }, { x: 10, y: 10 }, { x: 0, y: 10 }], { widthMeters: 10, depthMeters: 10 })).toBeUndefined();
  });
});
