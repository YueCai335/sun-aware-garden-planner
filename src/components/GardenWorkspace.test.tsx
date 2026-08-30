import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GrowingAreaLayoutEditor } from "@/components/GrowingAreaLayoutEditor";
import { GardenWorkspace } from "@/components/GardenWorkspace";
import { GARDEN_WORKSPACE_STORAGE_KEY } from "@/lib/gardenWorkspace";

describe("GardenWorkspace", () => {
  it("creates a garden, adds a growing area, and restores it after refresh", async () => {
    const user = userEvent.setup();
    const firstRender = render(<GardenWorkspace />);

    await user.type(await screen.findByLabelText("Garden name"), "Backyard garden");
    await user.click(screen.getByRole("button", { name: "Create garden" }));
    expect(await screen.findByRole("heading", { name: "Backyard garden" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add growing area" }));
    await user.type(screen.getByLabelText("Area name"), "North raised bed");
    await user.selectOptions(screen.getByLabelText("Area type"), "raised-bed");
    await user.click(screen.getByRole("button", { name: "Save area" }));
    expect(screen.getByRole("heading", { name: "North raised bed" })).toBeInTheDocument();
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(GARDEN_WORKSPACE_STORAGE_KEY) ?? "{}")).toMatchObject({ garden: { name: "Backyard garden" }, growingAreas: [{ name: "North raised bed", kind: "raised-bed" }] }));

    firstRender.unmount();
    render(<GardenWorkspace />);
    expect(await screen.findByRole("heading", { name: "Backyard garden" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "North raised bed" })).toBeInTheDocument();
  });

  it("loads a demo garden with one sample plant and keeps its list on demand", async () => {
    const user = userEvent.setup();
    render(<GardenWorkspace />);

    await user.click(await screen.findByRole("button", { name: "Load demo garden" }));
    expect(await screen.findByRole("heading", { name: "Demo Garden" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sample raised bed" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit Sample raised bed layout" }));
    expect(screen.getByRole("button", { name: "Plant list" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("heading", { name: "Plants" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Plant list" }));
    expect(screen.getByRole("heading", { name: "Plants" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tomato · 0.6 m" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /· 0\.6 m$/ })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Plant list" }));
    expect(screen.queryByRole("heading", { name: "Plants" })).not.toBeInTheDocument();
  });

  it("selects an area on Garden Plan before opening its layout with a double click", async () => {
    const user = userEvent.setup();
    const firstRender = render(<GardenWorkspace />);

    await user.click(await screen.findByRole("button", { name: "Load demo garden" }));
    expect(screen.getByLabelText("Garden Plan, 10 metres long by 6 metres wide")).toBeInTheDocument();
    const sampleRaisedBed = screen.getByLabelText("Select Sample raised bed on Garden Plan");
    expect(screen.getByLabelText("Select Sample in-ground area on Garden Plan")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Plan width (X, m)"), { target: { value: "8.2" } });
    await user.click(screen.getByRole("button", { name: "Save plan dimensions" }));
    expect(screen.getByLabelText("Garden Plan, 8.2 metres long by 6 metres wide")).toBeInTheDocument();

    fireEvent.click(sampleRaisedBed);
    expect(screen.getByLabelText("Area X position (m)")).toHaveValue(0.8);
    fireEvent.change(screen.getByLabelText("Area X position (m)"), { target: { value: "2.26" } });
    fireEvent.change(screen.getByLabelText("Area rotation (degrees)"), { target: { value: "45.5" } });
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem(GARDEN_WORKSPACE_STORAGE_KEY) ?? "{}");
      expect(saved.garden.plan).toEqual({ widthMeters: 8.2, depthMeters: 6 });
      expect(saved.growingAreas.find((area: { id: string }) => area.id === "demo-raised-bed")).toMatchObject({ planPlacement: { x: 2.3, y: 1, rotationDegrees: 45.5 } });
    });

    firstRender.unmount();
    render(<GardenWorkspace />);
    expect(await screen.findByLabelText("Garden Plan, 8.2 metres long by 6 metres wide")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Select Sample raised bed" }));
    expect(screen.getByLabelText("Area X position (m)")).toHaveValue(2.3);
    fireEvent.doubleClick(screen.getByLabelText("Select Sample raised bed on Garden Plan"));
    expect(screen.getByLabelText("Metric layout, 3 metres long by 1.2 metres wide")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Plant list" }));
    expect(screen.getByRole("button", { name: "Tomato · 0.6 m" })).toBeInTheDocument();
  });

  it("keeps placement anchors visible after shrinking a Garden Plan and adding another area", async () => {
    const user = userEvent.setup();
    render(<GardenWorkspace />);

    await user.click(await screen.findByRole("button", { name: "Load demo garden" }));
    fireEvent.change(screen.getByLabelText("Plan width (X, m)"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Plan depth (Y, m)"), { target: { value: "1" } });
    await user.click(screen.getByRole("button", { name: "Save plan dimensions" }));
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem(GARDEN_WORKSPACE_STORAGE_KEY) ?? "{}");
      expect(saved.growingAreas.map((area: { planPlacement: { x: number; y: number; rotationDegrees: number } }) => area.planPlacement)).toEqual([
        { x: 0.8, y: 1, rotationDegrees: 0 },
        { x: 1, y: 1, rotationDegrees: 10 },
        { x: 1, y: 0.6, rotationDegrees: 0 }
      ]);
    });

    await user.click(screen.getByRole("button", { name: "Add growing area" }));
    await user.type(screen.getByLabelText("Area name"), "Fourth area");
    await user.click(screen.getByRole("button", { name: "Save area" }));
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem(GARDEN_WORKSPACE_STORAGE_KEY) ?? "{}");
      expect(saved.growingAreas.find((area: { name: string }) => area.name === "Fourth area").planPlacement).toEqual({ x: 0.5, y: 1, rotationDegrees: 0 });
    });
  });

  it("creates a metric layout, opens plant editing from direct interaction, duplicates, and restores it", async () => {
    const user = userEvent.setup();
    const firstRender = render(<GardenWorkspace />);

    await user.type(await screen.findByLabelText("Garden name"), "Backyard garden");
    await user.click(screen.getByRole("button", { name: "Create garden" }));
    await user.click(screen.getByRole("button", { name: "Add growing area" }));
    await user.type(screen.getByLabelText("Area name"), "North raised bed");
    await user.click(screen.getByRole("button", { name: "Save area" }));
    await user.click(screen.getByRole("button", { name: "Set up North raised bed layout" }));
    expect(screen.queryByLabelText("Garden summary")).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText("Length (m)"));
    await user.type(screen.getByLabelText("Length (m)"), "2");
    await user.clear(screen.getByLabelText("Width (m)"));
    await user.type(screen.getByLabelText("Width (m)"), "1");
    await user.click(screen.getByRole("button", { name: "Create metric layout" }));
    expect(await screen.findByLabelText("Metric layout, 2 metres long by 1 metres wide")).toBeInTheDocument();

    expect(screen.queryByRole("heading", { name: "Plants" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("X position (m)")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add plant" }));
    await user.type(screen.getByLabelText("Plant name"), "Tomato");
    await user.clear(screen.getByLabelText("Plant spacing (m)"));
    await user.type(screen.getByLabelText("Plant spacing (m)"), "0.6");
    await user.click(within(screen.getByLabelText("Plant name").closest("form")!).getByRole("button", { name: "Add plant" }));
    expect(screen.queryByRole("heading", { name: "Edit Tomato" })).not.toBeInTheDocument();
    expect(screen.getAllByTestId(/allocation-label-/)[0]).toHaveTextContent("Tomato");
    const tomatoCircle = screen.getByLabelText("Tomato plant");
    fireEvent.click(tomatoCircle);
    expect(screen.getByLabelText("Remove Tomato")).toBeInTheDocument();
    fireEvent.doubleClick(tomatoCircle);
    expect(screen.getByRole("heading", { name: "Edit Tomato" })).toBeInTheDocument();
    expect(screen.getByLabelText("X position (m)")).toHaveValue(1);
    await user.click(screen.getByRole("button", { name: "Duplicate plant" }));
    expect(screen.getAllByTestId(/allocation-label-/)).toHaveLength(2);
    expect(screen.getByLabelText("X position (m)")).toHaveValue(1.6);
    await user.click(screen.getByRole("button", { name: "Remove plant" }));
    expect(screen.getAllByTestId(/allocation-label-/)).toHaveLength(1);

    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(GARDEN_WORKSPACE_STORAGE_KEY) ?? "{}")).toMatchObject({
      growingAreas: [{ name: "North raised bed", layout: { widthMeters: 2, depthMeters: 1, allocations: [{ label: "Tomato", x: 1, y: 0.5, diameterMeters: 0.6 }] } }]
    }));
    firstRender.unmount();
    render(<GardenWorkspace />);
    expect(await screen.findByRole("heading", { name: "Backyard garden" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit North raised bed layout" }));
    await user.click(screen.getByRole("button", { name: "Plant list" }));
    expect(screen.getByRole("button", { name: "Tomato · 0.6 m" })).toBeInTheDocument();
  });

  it("removes a selected plant from its red canvas control", async () => {
    const user = userEvent.setup();
    render(<GardenWorkspace />);

    await user.click(await screen.findByRole("button", { name: "Load demo garden" }));
    await user.click(screen.getByRole("button", { name: "Edit Sample raised bed layout" }));
    fireEvent.click(screen.getByLabelText("Tomato plant"));
    await user.click(screen.getByLabelText("Remove Tomato"));
    expect(screen.queryByLabelText("Tomato plant")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Tomato removed.");
  });

  it("keeps the layout unchanged when duplicate spacing cannot fit", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<GrowingAreaLayoutEditor area={{ id: "area-1", name: "Small bed", kind: "raised-bed", planPlacement: { x: 0.5, y: 0.5, rotationDegrees: 0 }, layout: { widthMeters: 0.2, depthMeters: 0.2, boundary: [{ x: 0, y: 0 }, { x: 0.2, y: 0 }, { x: 0.2, y: 0.2 }, { x: 0, y: 0.2 }], allocations: [{ id: "plant-1", label: "Tomato", x: 0.1, y: 0.1, diameterMeters: 0.6 }] } }} onBack={vi.fn()} onChange={onChange} />);

    fireEvent.doubleClick(screen.getByLabelText("Tomato plant"));
    await user.click(screen.getByRole("button", { name: "Duplicate plant" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("No open 0.1 metre grid position is available for a duplicate.");
  });

  it("replaces an existing garden with the demo only after confirmation", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<GardenWorkspace />);

    await user.type(await screen.findByLabelText("Garden name"), "Backyard garden");
    await user.click(screen.getByRole("button", { name: "Create garden" }));
    await user.click(screen.getByRole("button", { name: "Load demo garden" }));
    expect(confirm).toHaveBeenCalledWith("Load the demo garden? This replaces the garden saved in this browser.");
    expect(screen.getByRole("heading", { name: "Backyard garden" })).toBeInTheDocument();

    confirm.mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Load demo garden" }));
    expect(await screen.findByRole("heading", { name: "Demo Garden" })).toBeInTheDocument();
    confirm.mockRestore();
  });

  it("removes an area and asks before starting a new garden", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<GardenWorkspace />);

    await user.click(await screen.findByRole("button", { name: "Load demo garden" }));
    await user.click(screen.getByRole("button", { name: "Remove Sample raised bed" }));
    expect(screen.queryByRole("heading", { name: "Sample raised bed" })).not.toBeInTheDocument();
    expect(screen.getByText("2 growing areas", { selector: ".plan-count" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New garden" }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "Demo Garden" })).toBeInTheDocument();

    confirm.mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "New garden" }));
    expect(await screen.findByRole("heading", { name: "Create your garden" })).toBeInTheDocument();
    expect(window.localStorage.getItem(GARDEN_WORKSPACE_STORAGE_KEY)).toBeNull();
    confirm.mockRestore();
  });
});
