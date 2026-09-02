import { describe, expect, it } from "vitest";

import { companionNotes } from "@/lib/seasonPlanner";

describe("companionNotes", () => {
  it("recognizes bilingual tomato and basil records", () => {
    const notes = companionNotes([
      { id: "tomato", commonName: "番茄", plantType: "番茄", cropFamily: "nightshade", quantity: 2, plantingDate: "2027-05-20", growingAreaId: "bed-1", isActive: false },
      { id: "basil", commonName: "罗勒", plantType: "罗勒", cropFamily: "other", quantity: 1, plantingDate: "2027-05-20", growingAreaId: "bed-1", isActive: false },
    ]);

    expect(notes).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "helpful", message: expect.stringContaining("Tomato + basil") }),
    ]));
  });
});
