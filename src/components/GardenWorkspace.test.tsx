import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GrowingAreaLayoutEditor } from "@/components/GrowingAreaLayoutEditor";
import { GardenWorkspace } from "@/components/GardenWorkspace";
import {
  createDemoGardenWorkspace,
  GARDEN_WORKSPACE_STORAGE_KEY,
} from "@/lib/gardenWorkspace";

async function loadDemo(user: ReturnType<typeof userEvent.setup>) {
  render(<GardenWorkspace />);
  await user.click(await screen.findByRole("button", { name: "Load demo garden" }));
}

async function openPlantingArea(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("button", { name: "Edit garden" }));
  await user.click(screen.getByRole("button", { name: `Open ${name}` }));
}

describe("GardenWorkspace", () => {
  it("uses single click for selection and double click or Edit garden for direct editing", async () => {
    const user = userEvent.setup();
    await loadDemo(user);

    fireEvent.doubleClick(screen.getByRole("button", { name: "Demo Garden, selected" }));
    expect(screen.getByRole("heading", { name: "Edit garden" })).toBeInTheDocument();
    expect(screen.getByLabelText("Plan width (X, m)")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    await user.click(screen.getByRole("button", { name: "Edit garden" }));
    expect(screen.getByRole("heading", { name: "Edit garden" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Planting records" })).not.toBeInTheDocument();
  });

  it("opens the garden that was double-clicked when another garden is selected", async () => {
    const user = userEvent.setup();
    const workspace = createDemoGardenWorkspace();
    window.localStorage.setItem(
      GARDEN_WORKSPACE_STORAGE_KEY,
      JSON.stringify({
        ...workspace,
        gardens: [
          workspace.gardens[0],
          { ...workspace.gardens[0], id: "community-garden", name: "Community plot" },
        ],
      }),
    );
    render(<GardenWorkspace />);

    fireEvent.doubleClick(
      await screen.findByRole("button", { name: "Community plot" }),
    );
    expect(screen.getByRole("heading", { name: "Edit garden" })).toBeInTheDocument();
    expect(screen.getByLabelText("Garden name")).toHaveValue("Community plot");
    expect(screen.getByRole("button", { name: "Back to dashboard" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    expect(screen.getByRole("button", { name: "Community plot, selected" })).toBeInTheDocument();
  });

  it("completes Garden Setup with a plan, planting area, and plant, then restores it", async () => {
    const user = userEvent.setup();
    const firstRender = render(<GardenWorkspace />);
    await user.click(await screen.findByRole("button", { name: "Load demo garden" }));
    await user.click(screen.getByRole("button", { name: "Add garden" }));
    expect(screen.getByRole("heading", { name: "Start a new garden" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Garden name"), "Community plot");
    await user.click(screen.getByRole("button", { name: "Continue setup" }));
    expect(screen.getByRole("heading", { name: "Garden setup" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Plan width (X, m)"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Plan depth (Y, m)"), { target: { value: "2" } });
    await user.click(screen.getByRole("button", { name: "Save plan dimensions" }));
    await user.click(screen.getByRole("button", { name: "Add planting area" }));
    await user.type(screen.getByLabelText("Planting-area name"), "North bed");
    await user.click(screen.getByRole("button", { name: "Save planting area" }));
    await user.click(screen.getByRole("button", { name: "Open North bed" }));
    await user.click(screen.getByRole("button", { name: "Add plant" }));
    const plantForm = screen.getByRole("heading", { name: "Add plant" }).closest("form")!;
    await user.type(within(plantForm).getByLabelText("Plant name"), "Kale");
    await user.selectOptions(within(plantForm).getByLabelText("Crop family"), "brassica");
    await user.type(within(plantForm).getByLabelText("Quantity"), "6");
    fireEvent.change(within(plantForm).getByLabelText("Planting date"), { target: { value: "2026-05-20" } });
    await user.click(within(plantForm).getByRole("button", { name: "Add plant" }));
    expect(screen.getByText("Kale")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to Edit garden" }));
    await user.click(screen.getByRole("button", { name: "Finish setup" }));
    expect(screen.getByRole("button", { name: "Community plot, selected" })).toBeInTheDocument();
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(GARDEN_WORKSPACE_STORAGE_KEY) ?? "{}"))
      .toMatchObject({ gardens: expect.arrayContaining([expect.objectContaining({ name: "Community plot", plan: { widthMeters: 4, depthMeters: 2 }, growingAreas: [expect.objectContaining({ name: "North bed" })], plantings: [expect.objectContaining({ commonName: "Kale" })] })]) }));

    firstRender.unmount();
    render(<GardenWorkspace />);
    await screen.findByRole("button", { name: "Community plot, selected" });
    await openPlantingArea(user, "North bed");
    expect(screen.getByText("Kale")).toBeInTheDocument();
  });

  it("keeps name, layout, and plant management inside the opened planting area", async () => {
    const user = userEvent.setup();
    await loadDemo(user);
    await openPlantingArea(user, "Sample raised bed");
    expect(screen.getByText("Tomatoes")).toBeInTheDocument();
    expect(screen.queryByText("Bush beans")).not.toBeInTheDocument();

    const name = screen.getByLabelText("Planting-area name");
    await user.clear(name);
    await user.type(name, "Kitchen bed");
    await user.click(screen.getByRole("button", { name: "Save planting area" }));
    expect(screen.getAllByRole("heading", { name: "Kitchen bed" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Save dimensions" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add plant" }));
    const plantForm = screen.getByRole("heading", { name: "Add plant" }).closest("form")!;
    await user.type(within(plantForm).getByLabelText("Plant name"), "Basil");
    await user.selectOptions(within(plantForm).getByLabelText("Crop family"), "leafy");
    await user.type(within(plantForm).getByLabelText("Quantity"), "2");
    fireEvent.change(within(plantForm).getByLabelText("Planting date"), { target: { value: "2026-06-01" } });
    await user.click(within(plantForm).getByRole("button", { name: "Add plant" }));
    const basil = screen.getByText("Basil").closest("li")!;
    await user.click(within(basil).getByRole("button", { name: "Edit planting" }));
    await user.clear(screen.getByLabelText("Plant name"));
    await user.type(screen.getByLabelText("Plant name"), "Thai basil");
    await user.click(screen.getByRole("button", { name: "Save plant" }));
    await user.click(within(screen.getByText("Thai basil").closest("li")!).getByRole("button", { name: "Remove" }));
    expect(screen.queryByText("Thai basil")).not.toBeInTheDocument();
  });

  it("preserves Care Log targets when planting-area plant records are removed", async () => {
    const user = userEvent.setup();
    await loadDemo(user);
    await user.click(screen.getByRole("button", { name: "Care" }));
    await user.click(screen.getByRole("tab", { name: "History" }));
    await user.click(screen.getByRole("button", { name: "Add care event" }));
    const form = screen.getByRole("heading", { name: "Add care event" }).closest("form")!;
    fireEvent.change(within(form).getByLabelText("Date"), { target: { value: "2026-06-05" } });
    await user.selectOptions(within(form).getByLabelText("Target"), "plant-group:demo-planting-tomatoes");
    await user.click(within(form).getByRole("button", { name: "Add care event" }));
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    await openPlantingArea(user, "Sample raised bed");
    await user.click(within(screen.getByText("Tomatoes").closest("li")!).getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Back to Edit garden" }));
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    await user.click(screen.getByRole("button", { name: "Care" }));
    await user.click(screen.getByRole("tab", { name: "History" }));
    expect(screen.getByText(/Former plant group: Tomatoes · Sample raised bed/)).toBeInTheDocument();
  });

  it("keeps gardens and planting areas when deletion is cancelled", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    await loadDemo(user);
    await user.click(screen.getByRole("button", { name: "Edit garden" }));
    await user.click(screen.getByLabelText("Delete Sample raised bed"));
    expect(confirm).toHaveBeenCalledWith("Delete Sample raised bed? This removes the planting area and its 1 planting record from this browser. Care history stays in this garden.");
    expect(screen.getByRole("button", { name: "Open Sample raised bed" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete garden" }));
    expect(confirm).toHaveBeenCalledWith("Delete Demo Garden? This removes its 3 planting areas and 2 planting records from this browser.");
    expect(screen.getByRole("heading", { name: "Edit garden" })).toBeInTheDocument();
    confirm.mockRestore();
  });

  it("keeps Tasks open-only and advances repeating care after completion", async () => {
    const user = userEvent.setup();
    const firstRender = render(<GardenWorkspace />);
    await user.click(await screen.findByRole("button", { name: "Load demo garden" }));
    await user.click(screen.getByRole("button", { name: "Care" }));
    expect(screen.getByRole("heading", { name: "Tasks" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add task" }));
    const form = screen.getByRole("heading", { name: "Add care task" }).closest("form")!;
    await user.selectOptions(within(form).getByLabelText("Care type"), "fertilizing");
    fireEvent.change(within(form).getByLabelText("Due date"), { target: { value: "2026-09-02" } });
    await user.selectOptions(within(form).getByLabelText("Target"), "planting-area:demo-raised-bed");
    await user.type(within(form).getByLabelText("Repeat every whole days (optional)"), "3");
    await user.type(within(form).getByLabelText("Note (optional)"), "Feed tomatoes");
    await user.click(within(form).getByRole("button", { name: "Add care task" }));
    const taskItem = screen.getByText("Fertilizing").closest("li")!;
    expect(taskItem).toHaveTextContent("Due 2026-09-02 · Sample raised bed · Repeats every 3 days · Feed tomatoes");
    await user.click(within(taskItem).getByRole("button", { name: "Edit" }));
    const editForm = screen.getByRole("heading", { name: "Edit care task" }).closest("form")!;
    await user.clear(within(editForm).getByLabelText("Note (optional)"));
    await user.type(within(editForm).getByLabelText("Note (optional)"), "Feed the bed");
    await user.click(within(editForm).getByRole("button", { name: "Save care task" }));
    await user.click(within(screen.getByText("Fertilizing").closest("li")!).getByRole("button", { name: "Complete" }));
    const completionForm = screen.getByRole("heading", { name: "Complete fertilizing task" }).closest("form")!;
    fireEvent.change(within(completionForm).getByLabelText("Completion date"), { target: { value: "2026-09-04" } });
    await user.click(within(completionForm).getByRole("button", { name: "Complete task" }));
    expect(screen.queryByRole("heading", { name: "Completed" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Completed 2026-09-04 · Sample raised bed/)).not.toBeInTheDocument();
    expect(screen.getByText(/Due 2026-09-07 · Sample raised bed/)).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "History" }));
    expect(screen.getByText(/2026-09-04 · Sample raised bed · Feed the bed/)).toBeInTheDocument();
    firstRender.unmount();
    render(<GardenWorkspace />);
    await user.click(await screen.findByRole("button", { name: "Care" }));
    expect(screen.getByText(/Due 2026-09-07 · Sample raised bed/)).toBeInTheDocument();
  });

  it("marks deleted task targets as former and lets gardeners remove them", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    await loadDemo(user);
    await user.click(screen.getByRole("button", { name: "Care" }));
    await user.click(screen.getByRole("button", { name: "Add task" }));
    const form = screen.getByRole("heading", { name: "Add care task" }).closest("form")!;
    fireEvent.change(within(form).getByLabelText("Due date"), { target: { value: "2026-09-02" } });
    await user.selectOptions(within(form).getByLabelText("Target"), "planting-area:demo-raised-bed");
    await user.click(within(form).getByRole("button", { name: "Add care task" }));
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    await user.click(screen.getByRole("button", { name: "Edit garden" }));
    await user.click(screen.getByLabelText("Delete Sample raised bed"));
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    await user.click(screen.getByRole("button", { name: "Care" }));
    const taskItem = screen.getByText(/Former planting area: Sample raised bed/).closest("li")!;
    await user.click(within(taskItem).getByRole("button", { name: "Remove" }));
    expect(screen.queryByText(/Former planting area: Sample raised bed/)).not.toBeInTheDocument();
    confirm.mockRestore();
  });

  it("moves a one-time completed task into History", async () => {
    const user = userEvent.setup();
    await loadDemo(user);
    await user.click(screen.getByRole("button", { name: "Care" }));
    await user.click(screen.getByRole("button", { name: "Add task" }));
    const form = screen.getByRole("heading", { name: "Add care task" }).closest("form")!;
    fireEvent.change(within(form).getByLabelText("Due date"), { target: { value: "2026-09-02" } });
    await user.type(within(form).getByLabelText("Note (optional)"), "Water containers");
    await user.click(within(form).getByRole("button", { name: "Add care task" }));
    const taskItem = screen.getByText("Watering").closest("li")!;
    await user.click(within(taskItem).getByRole("button", { name: "Complete" }));
    await user.click(screen.getByRole("button", { name: "Complete task" }));

    expect(screen.queryByText("Water containers")).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "History" }));
    expect(screen.getByText(/Water containers/)).toBeInTheDocument();
  });

  it("records, edits, deletes, summarizes, and persists Care Log events", async () => {
    const user = userEvent.setup();
    const firstRender = render(<GardenWorkspace />);
    await user.click(await screen.findByRole("button", { name: "Load demo garden" }));
    await user.click(screen.getByRole("button", { name: "Care" }));
    await user.click(screen.getByRole("tab", { name: "History" }));
    await user.click(screen.getByRole("button", { name: "Add care event" }));
    const wateringForm = screen.getByRole("heading", { name: "Add care event" }).closest("form")!;
    fireEvent.change(within(wateringForm).getByLabelText("Date"), { target: { value: "2026-06-01" } });
    await user.click(within(wateringForm).getByRole("button", { name: "Add care event" }));
    await user.click(screen.getByRole("button", { name: "Add care event" }));
    const fertilizerForm = screen.getByRole("heading", { name: "Add care event" }).closest("form")!;
    await user.selectOptions(within(fertilizerForm).getByLabelText("Care type"), "fertilizing");
    fireEvent.change(within(fertilizerForm).getByLabelText("Date"), { target: { value: "2026-06-02" } });
    await user.selectOptions(within(fertilizerForm).getByLabelText("Target"), "planting-area:demo-raised-bed");
    await user.click(within(fertilizerForm).getByRole("button", { name: "Add care event" }));
    const fertilizerItem = screen.getByText("Fertilizing").closest("li")!;
    await user.click(within(fertilizerItem).getByRole("button", { name: "Correct record" }));
    const editForm = screen.getByRole("heading", { name: "Edit care event" }).closest("form")!;
    await user.type(within(editForm).getByLabelText("Fertilizer product (optional)"), "Kelp meal");
    await user.click(within(editForm).getByRole("button", { name: "Save care event" }));
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    expect(screen.getByRole("list", { name: "Recent care events" })).toHaveTextContent("Sample raised bed");
    firstRender.unmount();
    render(<GardenWorkspace />);
    await user.click(await screen.findByRole("button", { name: "Care" }));
    await user.click(screen.getByRole("tab", { name: "History" }));
    expect(screen.getByText(/Kelp meal/)).toBeInTheDocument();
    await user.click(within(screen.getByText("Fertilizing").closest("li")!).getByRole("button", { name: "Delete record" }));
    expect(screen.queryByText(/Kelp meal/)).not.toBeInTheDocument();
  });

  it("keeps targeted care history with its former planting-area name", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    await loadDemo(user);
    await user.click(screen.getByRole("button", { name: "Care" }));
    await user.click(screen.getByRole("tab", { name: "History" }));
    await user.click(screen.getByRole("button", { name: "Add care event" }));
    const form = screen.getByRole("heading", { name: "Add care event" }).closest("form")!;
    fireEvent.change(within(form).getByLabelText("Date"), { target: { value: "2026-06-04" } });
    await user.selectOptions(within(form).getByLabelText("Target"), "planting-area:demo-raised-bed");
    await user.click(within(form).getByRole("button", { name: "Add care event" }));
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    await user.click(screen.getByRole("button", { name: "Edit garden" }));
    await user.click(screen.getByLabelText("Delete Sample raised bed"));
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    await user.click(screen.getByRole("button", { name: "Care" }));
    await user.click(screen.getByRole("tab", { name: "History" }));
    expect(screen.getByText(/2026-06-04 · Former planting area: Sample raised bed/)).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(GARDEN_WORKSPACE_STORAGE_KEY) ?? "{}").gardens[0].careEvents[0]).toMatchObject({ growingAreaName: "Sample raised bed", targetAreaDeleted: true });
    confirm.mockRestore();
  });

  it("distinguishes same-named plant groups by planting area in Care Log", async () => {
    const user = userEvent.setup();
    await loadDemo(user);
    await openPlantingArea(user, "Sample in-ground area");
    await user.click(screen.getByRole("button", { name: "Add plant" }));
    const plantingForm = screen.getByRole("heading", { name: "Add plant" }).closest("form")!;
    await user.type(within(plantingForm).getByLabelText("Plant name"), "Tomatoes");
    await user.selectOptions(within(plantingForm).getByLabelText("Crop family"), "nightshade");
    await user.type(within(plantingForm).getByLabelText("Quantity"), "2");
    fireEvent.change(within(plantingForm).getByLabelText("Planting date"), { target: { value: "2026-05-20" } });
    await user.click(within(plantingForm).getByRole("button", { name: "Add plant" }));
    await user.click(screen.getByRole("button", { name: "Back to Edit garden" }));
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    await user.click(screen.getByRole("button", { name: "Care" }));
    await user.click(screen.getByRole("tab", { name: "History" }));
    await user.click(screen.getByRole("button", { name: "Add care event" }));
    const careForm = screen.getByRole("heading", { name: "Add care event" }).closest("form")!;
    expect(within(careForm).getByRole("option", { name: "Tomatoes · Sample raised bed" })).toBeInTheDocument();
    expect(within(careForm).getByRole("option", { name: "Tomatoes · Sample in-ground area" })).toBeInTheDocument();
  });

  it("keeps the dashboard compact and persists Garden Plan placement edits", async () => {
    const user = userEvent.setup();
    await loadDemo(user);
    expect(screen.getByRole("button", { name: "Add garden" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Plan width (X, m)")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit garden" }));
    fireEvent.click(screen.getByLabelText("Select Sample raised bed on Garden Plan"));
    fireEvent.change(screen.getByLabelText("Area X position (m)"), { target: { value: "2.26" } });
    fireEvent.change(screen.getByLabelText("Area rotation (degrees)"), { target: { value: "45.5" } });
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(GARDEN_WORKSPACE_STORAGE_KEY) ?? "{}").gardens[0].growingAreas[0].planPlacement).toEqual({ x: 2.3, y: 1, rotationDegrees: 45.5 }));
  });

  it("renames a garden from Edit garden and preserves the saved name after dashboard navigation", async () => {
    const user = userEvent.setup();
    await loadDemo(user);
    await user.click(screen.getByRole("button", { name: "Edit garden" }));
    const gardenName = screen.getByLabelText("Garden name");
    await user.clear(gardenName);
    await user.type(gardenName, "Home garden");
    await user.click(screen.getByRole("button", { name: "Save garden name" }));
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    expect(screen.getByRole("button", { name: "Home garden, selected" })).toBeInTheDocument();
  });

  it("validates, saves, and removes planting records in their planting area", async () => {
    const user = userEvent.setup();
    await loadDemo(user);
    await openPlantingArea(user, "Sample container group");
    await user.click(screen.getByRole("button", { name: "Add plant" }));
    const form = screen.getByRole("heading", { name: "Add plant" }).closest("form")!;
    fireEvent.submit(form);
    expect(screen.getByText("Enter a plant name.")).toBeInTheDocument();
    await user.type(within(form).getByLabelText("Plant name"), "Peppers");
    await user.selectOptions(within(form).getByLabelText("Crop family"), "nightshade");
    await user.type(within(form).getByLabelText("Quantity"), "3");
    fireEvent.change(within(form).getByLabelText("Planting date"), { target: { value: "2026-05-20" } });
    await user.click(within(form).getByRole("button", { name: "Add plant" }));
    const plantingItem = screen.getByText("Peppers").closest("li")!;
    await user.click(within(plantingItem).getByRole("button", { name: "Remove" }));
    expect(screen.queryByText("Peppers")).not.toBeInTheDocument();
  });

  it("supports direct plant selection, editing, duplication, and canvas removal in the layout editor", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<GrowingAreaLayoutEditor area={{ id: "area-1", name: "North bed", kind: "raised-bed", planPlacement: { x: 0.5, y: 0.5, rotationDegrees: 0 }, layout: { widthMeters: 2, depthMeters: 1, boundary: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 0, y: 1 }], allocations: [{ id: "plant-1", label: "Tomato", x: 1, y: 0.5, diameterMeters: 0.6 }] } }} onBack={vi.fn()} onChange={onChange} />);

    fireEvent.doubleClick(screen.getByLabelText("Tomato plant"));
    await user.click(screen.getByRole("button", { name: "Duplicate plant" }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ allocations: expect.arrayContaining([expect.objectContaining({ id: "plant-1" }), expect.objectContaining({ label: "Tomato", x: 1.6, y: 0.5 })]) }));
    fireEvent.click(screen.getByLabelText("Tomato plant"));
    await user.click(screen.getByLabelText("Remove Tomato"));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ allocations: [] }));
  });
});
