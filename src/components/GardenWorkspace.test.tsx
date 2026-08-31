import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GrowingAreaLayoutEditor } from "@/components/GrowingAreaLayoutEditor";
import { GardenWorkspace } from "@/components/GardenWorkspace";
import { GARDEN_WORKSPACE_STORAGE_KEY } from "@/lib/gardenWorkspace";

describe("GardenWorkspace", () => {
  it("renders a compact garden dashboard and keeps metric controls in Garden Management", async () => {
    const user = userEvent.setup();
    render(<GardenWorkspace />);
    await user.click(
      await screen.findByRole("button", { name: "Load demo garden" }),
    );

    expect(
      screen.getByRole("heading", { name: "Choose a garden" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Demo Garden, selected" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("1 garden")).toBeInTheDocument();
    expect(document.querySelectorAll('[fill="#dcebdc"]')).toHaveLength(3);
    expect(document.querySelectorAll('[fill="#f7b955"]')).toHaveLength(1);
    expect(screen.queryByText("Tomato")).not.toBeInTheDocument();
    expect(screen.queryByText("Sample raised bed")).not.toBeInTheDocument();
    expect(screen.queryByText("0 m")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Plan width (X, m)"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add planting area" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Garden Management" }));
    expect(
      screen.getByRole("heading", { name: "Garden Management" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Plan width (X, m)")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add planting area" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByLabelText("Select Sample raised bed on Garden Plan"),
    );
    fireEvent.change(screen.getByLabelText("Area X position (m)"), {
      target: { value: "2.26" },
    });
    fireEvent.change(screen.getByLabelText("Area rotation (degrees)"), {
      target: { value: "45.5" },
    });
    await waitFor(() =>
      expect(
        JSON.parse(
          window.localStorage.getItem(GARDEN_WORKSPACE_STORAGE_KEY) ?? "{}",
        ).gardens[0].growingAreas[0].planPlacement,
      ).toEqual({ x: 2.3, y: 1, rotationDegrees: 45.5 }),
    );
  });

  it("selects dashboard cards, persists selection, and routes selected-garden actions", async () => {
    const user = userEvent.setup();
    const firstRender = render(<GardenWorkspace />);
    await user.click(
      await screen.findByRole("button", { name: "Load demo garden" }),
    );
    await user.click(screen.getByRole("button", { name: "Garden Management" }));
    await user.click(screen.getByRole("button", { name: "Add garden" }));
    await user.type(screen.getByLabelText("New garden name"), "Community plot");
    await user.click(screen.getByRole("button", { name: "Create garden" }));
    expect(
      screen.getByRole("heading", { name: "Community plot" }),
    ).toBeInTheDocument();
    expect(screen.getByText("0 planting areas")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    expect(
      screen.getByRole("button", { name: "Demo Garden" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Community plot, selected" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("2 gardens")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Demo Garden" }));
    expect(
      screen.getAllByRole("heading", { name: "Demo Garden" }),
    ).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Demo Garden, selected" }),
    ).toHaveAttribute("aria-pressed", "true");
    await waitFor(() =>
      expect(
        JSON.parse(
          window.localStorage.getItem(GARDEN_WORKSPACE_STORAGE_KEY) ?? "{}",
        ),
      ).toMatchObject({
        version: 4,
        selectedGardenId: expect.any(String),
        gardens: [
          { name: "Demo Garden", growingAreas: expect.any(Array) },
          { name: "Community plot", growingAreas: [] },
        ],
      }),
    );

    firstRender.unmount();
    render(<GardenWorkspace />);
    expect(
      await screen.findByRole("button", { name: "Demo Garden, selected" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Planting records" }));
    const plantingRecords = screen.getByRole("heading", {
      name: "Planting records",
    });
    expect(plantingRecords).toHaveFocus();
    expect(screen.getByText("Tomatoes")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    await user.click(screen.getByRole("button", { name: "Garden Management" }));
    expect(
      screen.getByRole("heading", { name: "Garden Management" }),
    ).toHaveFocus();
  });

  it("renames gardens and planting areas in management", async () => {
    const user = userEvent.setup();
    render(<GardenWorkspace />);
    await user.click(
      await screen.findByRole("button", { name: "Load demo garden" }),
    );
    await user.click(screen.getByRole("button", { name: "Garden Management" }));
    const gardenName = screen.getByLabelText("Garden name");
    await user.clear(gardenName);
    await user.type(gardenName, "Home garden");
    await user.click(screen.getByRole("button", { name: "Save garden name" }));
    expect(
      screen.getByRole("heading", { name: "Home garden" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add planting area" }));
    await user.type(screen.getByLabelText("Planting-area name"), "Patio pots");
    await user.click(
      screen.getByRole("button", { name: "Save planting area" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Edit Patio pots details" }),
    );
    const plantingAreaName = screen.getByLabelText("Planting-area name");
    await user.clear(plantingAreaName);
    await user.type(plantingAreaName, "Kitchen bed");
    await user.selectOptions(
      screen.getByLabelText("Planting-area type"),
      "container",
    );
    await user.click(
      screen.getByRole("button", { name: "Save planting area" }),
    );
    expect(
      screen.getByRole("heading", { name: "Kitchen bed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Container group · Layout not set up"),
    ).toBeInTheDocument();
  });

  it("keeps gardens and planting areas when deletion is cancelled", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<GardenWorkspace />);
    await user.click(
      await screen.findByRole("button", { name: "Load demo garden" }),
    );
    await user.click(screen.getByRole("button", { name: "Garden Management" }));
    await user.click(screen.getByLabelText("Delete Sample raised bed"));
    expect(confirm).toHaveBeenCalledWith(
      "Delete Sample raised bed? This removes the planting area and its 1 planting record from this browser.",
    );
    expect(
      screen.getAllByRole("heading", { name: "Sample raised bed" }),
    ).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Delete garden" }));
    expect(confirm).toHaveBeenCalledWith(
      "Delete Demo Garden? This removes its 3 planting areas and 2 planting records from this browser.",
    );
    expect(
      screen.getByRole("heading", { name: "Demo Garden" }),
    ).toBeInTheDocument();
    confirm.mockRestore();
  });

  it("keeps each garden name when a pending rename is abandoned during dashboard selection", async () => {
    const user = userEvent.setup();
    render(<GardenWorkspace />);
    await user.click(
      await screen.findByRole("button", { name: "Load demo garden" }),
    );
    await user.click(screen.getByRole("button", { name: "Garden Management" }));
    await user.click(screen.getByRole("button", { name: "Add garden" }));
    await user.type(screen.getByLabelText("New garden name"), "Community plot");
    await user.click(screen.getByRole("button", { name: "Create garden" }));

    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    await user.click(screen.getByRole("button", { name: "Demo Garden" }));
    await user.click(screen.getByRole("button", { name: "Garden Management" }));
    await user.clear(screen.getByLabelText("Garden name"));
    await user.type(
      screen.getByLabelText("Garden name"),
      "Unfinished home rename",
    );
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    await user.click(screen.getByRole("button", { name: "Community plot" }));
    await user.click(screen.getByRole("button", { name: "Garden Management" }));
    await user.click(screen.getByRole("button", { name: "Save garden name" }));

    expect(
      screen.getByRole("heading", { name: "Community plot" }),
    ).toBeInTheDocument();
  });

  it("validates, saves, and removes planting records in Garden Management", async () => {
    const user = userEvent.setup();
    render(<GardenWorkspace />);
    await user.click(
      await screen.findByRole("button", { name: "Load demo garden" }),
    );
    await user.click(screen.getByRole("button", { name: "Garden Management" }));
    await user.click(screen.getByRole("button", { name: "Add planting" }));
    const form = screen
      .getByRole("heading", { name: "Add planting" })
      .closest("form")!;

    fireEvent.submit(form);
    expect(screen.getByText("Enter a plant name.")).toBeInTheDocument();
    await user.type(within(form).getByLabelText("Plant name"), "Peppers");
    await user.selectOptions(
      within(form).getByLabelText("Crop family"),
      "nightshade",
    );
    await user.type(within(form).getByLabelText("Quantity"), "3");
    fireEvent.change(within(form).getByLabelText("Planting date"), {
      target: { value: "2026-05-20" },
    });
    await user.selectOptions(
      within(form).getByLabelText("Planting area"),
      "demo-container-group",
    );
    await user.click(
      within(form).getByRole("button", { name: "Add planting" }),
    );
    expect(screen.getByText("Peppers")).toBeInTheDocument();

    const plantingItem = screen.getByText("Peppers").closest("li")!;
    await user.click(
      within(plantingItem).getByRole("button", { name: "Remove" }),
    );
    expect(screen.queryByText("Peppers")).not.toBeInTheDocument();
  });

  it("supports direct plant selection, editing, duplication, and canvas removal in the layout editor", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <GrowingAreaLayoutEditor
        area={{
          id: "area-1",
          name: "North bed",
          kind: "raised-bed",
          planPlacement: { x: 0.5, y: 0.5, rotationDegrees: 0 },
          layout: {
            widthMeters: 2,
            depthMeters: 1,
            boundary: [
              { x: 0, y: 0 },
              { x: 2, y: 0 },
              { x: 2, y: 1 },
              { x: 0, y: 1 },
            ],
            allocations: [
              {
                id: "plant-1",
                label: "Tomato",
                x: 1,
                y: 0.5,
                diameterMeters: 0.6,
              },
            ],
          },
        }}
        onBack={vi.fn()}
        onChange={onChange}
      />,
    );

    fireEvent.doubleClick(screen.getByLabelText("Tomato plant"));
    expect(
      screen.getByRole("heading", { name: "Edit Tomato" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Duplicate plant" }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        allocations: expect.arrayContaining([
          expect.objectContaining({ id: "plant-1" }),
          expect.objectContaining({ label: "Tomato", x: 1.6, y: 0.5 }),
        ]),
      }),
    );

    fireEvent.click(screen.getByLabelText("Tomato plant"));
    await user.click(screen.getByLabelText("Remove Tomato"));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ allocations: [] }),
    );
  });
});
