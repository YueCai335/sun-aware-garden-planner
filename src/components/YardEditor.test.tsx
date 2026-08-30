import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { V1_STORAGE_KEY, V2_STORAGE_KEY, YardEditor } from "@/components/YardEditor";

describe("YardEditor V2", () => {
  it("starts with a metric grid, rectangular boundary, compass, and persisted bearing", async () => {
    const user = userEvent.setup();
    const firstRender = render(<YardEditor />);
    expect(await screen.findByText("Reference grid · 20 m × 15 m")).toBeInTheDocument();
    expect(screen.getAllByText("Yard boundary")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Add Tree" })).toBeInTheDocument();
    expect(screen.getByLabelText("North bearing 0 degrees")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("North bearing (degrees)"));
    await user.type(screen.getByLabelText("North bearing (degrees)"), "35");
    await user.clear(screen.getByLabelText("Grid width (m)"));
    await user.type(screen.getByLabelText("Grid width (m)"), "24");
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(V2_STORAGE_KEY) ?? "{}")).toMatchObject({ version: 2, northBearingDegrees: 35, referenceGrid: { widthMeters: 24, depthMeters: 15 } }));
    firstRender.unmount();
    render(<YardEditor />);
    expect(screen.getByLabelText("North bearing (degrees)")).toHaveValue(35);
    expect(screen.getByText("Saved V2 yard restored.")).toBeInTheDocument();
  });

  it("asks for real dimensions before converting a V1 percentage layout", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(V1_STORAGE_KEY, JSON.stringify({ location: "45.5, -73.6", date: "2026-08-29", elements: [{ id: "yard", kind: "yard", x: 10, y: 10, width: 80, height: 70 }, { id: "house", kind: "house", x: 20, y: 25, width: 30, height: 20, obstacleHeightMeters: 6 }] }));
    render(<YardEditor />);
    expect(screen.getByRole("heading", { name: "Set up your saved yard" })).toBeInTheDocument();
    expect(window.localStorage.getItem(V2_STORAGE_KEY)).toBeNull();
    await user.clear(screen.getByLabelText("Reference-grid width (m)"));
    await user.type(screen.getByLabelText("Reference-grid width (m)"), "40");
    await user.clear(screen.getByLabelText("Reference-grid depth (m)"));
    await user.type(screen.getByLabelText("Reference-grid depth (m)"), "30");
    await user.click(screen.getByRole("button", { name: "Save V2 reference grid" }));
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(V2_STORAGE_KEY) ?? "{}")).toMatchObject({ referenceGrid: { widthMeters: 40, depthMeters: 30 }, objects: [{ id: "house", x: 8, y: 7.5, width: 12, depth: 6, obstacleHeightMeters: 6 }] }));
    expect(JSON.parse(window.localStorage.getItem(V2_STORAGE_KEY) ?? "{}").boundary).toEqual([{ x: 4, y: 3 }, { x: 36, y: 3 }, { x: 36, y: 24 }, { x: 4, y: 24 }]);
    expect(window.localStorage.getItem(V1_STORAGE_KEY)).toBeNull();
  });

  it("adds, drags, resizes, and deletes an object from its canvas control", async () => {
    const user = userEvent.setup();
    render(<YardEditor />);
    await user.click(screen.getByRole("button", { name: "Load demo" }));
    const house = screen.getByTestId("yard-object-demo-house");
    fireEvent.pointerDown(house, { clientX: 110, clientY: 110 });
    expect(screen.getByRole("heading", { name: "Selected House" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete selected" })).toBeInTheDocument();
    fireEvent.pointerUp(house, { clientX: 328.6666667, clientY: 226.6666667 });
    expect(screen.getByLabelText("X position (m)")).toHaveValue(8);
    expect(screen.getByLabelText("Y position (m)")).toHaveValue(5);
    fireEvent.pointerUp(screen.getByLabelText("Resize House se"), { clientX: 627.3333333, clientY: 488 });
    expect(screen.getByLabelText("Width (m)")).toHaveValue(8);
    expect(screen.getByLabelText("Depth (m)")).toHaveValue(7);
    expect(screen.getByLabelText("Delete House")).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByLabelText("Delete House"));
    expect(screen.queryByRole("heading", { name: "Selected House" })).not.toBeInTheDocument();
  });

  it("adds and removes boundary vertices through the editing controls", async () => {
    const user = userEvent.setup();
    render(<YardEditor />);
    await user.click(screen.getByRole("button", { name: "Add boundary vertex" }));
    expect(screen.getByRole("button", { name: "Remove selected vertex" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Remove selected vertex" }));
    expect(screen.queryByRole("button", { name: "Remove selected vertex" })).not.toBeInTheDocument();
    expect(screen.getByText("Boundary vertex removed.")).toBeInTheDocument();
  });
});
