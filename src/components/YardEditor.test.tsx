import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { YardEditor } from "@/components/YardEditor";

const storageKey = "sun-aware-garden-planner:yard-project:v1";

describe("YardEditor", () => {
  it("adds an element through the selected drawing tool", async () => {
    const user = userEvent.setup();
    render(<YardEditor />);

    await user.selectOptions(screen.getByLabelText("Drawing tool"), "fence");
    fireEvent.pointerDown(screen.getByLabelText("Click to add a fence"), {
      clientX: 500,
      clientY: 320,
      pointerId: 1
    });

    expect(screen.getByRole("heading", { name: "Selected Fence" })).toBeInTheDocument();
    expect(screen.getByText("Fence added. Drag it or edit its values in the panel.")).toBeInTheDocument();
  });

  it("selects a house and updates its geometry and obstacle height", async () => {
    const user = userEvent.setup();
    render(<YardEditor />);

    fireEvent.pointerDown(screen.getByLabelText("Select and move yard elements"), {
      clientX: 300,
      clientY: 160,
      pointerId: 1
    });
    expect(screen.getByRole("heading", { name: "Selected House" })).toBeInTheDocument();

    const xPosition = screen.getByLabelText("X position");
    await user.clear(xPosition);
    await user.type(xPosition, "35");
    await user.clear(screen.getByLabelText("Obstacle height (m)"));
    await user.type(screen.getByLabelText("Obstacle height (m)"), "8.5");

    expect(xPosition).toHaveValue(35);
    expect(screen.getByLabelText("Obstacle height (m)")).toHaveValue(8.5);
    expect(screen.getByText("House updated.")).toBeInTheDocument();
    expect(xPosition).toHaveAttribute("min", "0");
    expect(screen.getByLabelText("Width")).toHaveAttribute("min", "2");
    expect(screen.getByLabelText("Depth")).toHaveAttribute("min", "2");
    expect(screen.getByLabelText("Obstacle height (m)")).toHaveAttribute("min", "0.1");
  });

  it("moves a selected house within canvas bounds and cancels an active drag", () => {
    render(<YardEditor />);

    const canvas = screen.getByLabelText("Select and move yard elements");
    const hasPointerCapture = vi.spyOn(canvas, "hasPointerCapture").mockReturnValue(true);
    const releasePointerCapture = vi.spyOn(canvas, "releasePointerCapture");

    fireEvent.pointerDown(canvas, { clientX: 300, clientY: 160, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 1200, clientY: 800, pointerId: 1 });

    expect(screen.getByLabelText("X position")).toHaveValue(73);
    expect(screen.getByLabelText("Y position")).toHaveValue(80);

    fireEvent.pointerUp(canvas, { pointerId: 1 });
    expect(releasePointerCapture).toHaveBeenCalledWith(1);

    fireEvent.pointerDown(canvas, { clientX: 800, clientY: 580, pointerId: 2 });
    fireEvent.pointerCancel(canvas, { pointerId: 2 });
    fireEvent.pointerMove(canvas, { clientX: 0, clientY: 0, pointerId: 2 });

    expect(screen.getByLabelText("X position")).toHaveValue(73);
    expect(screen.getByLabelText("Y position")).toHaveValue(80);
    expect(hasPointerCapture).toHaveBeenCalledWith(2);
    expect(releasePointerCapture).toHaveBeenCalledWith(2);
  });

  it("deletes a selected element and clears the remaining project", async () => {
    const user = userEvent.setup();
    render(<YardEditor />);

    fireEvent.pointerDown(screen.getByLabelText("Select and move yard elements"), {
      clientX: 300,
      clientY: 160,
      pointerId: 1
    });
    await user.click(screen.getByRole("button", { name: "Delete selected" }));
    expect(screen.getByText("House deleted.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByText("Your yard is empty. Choose a drawing tool to start.")).toBeInTheDocument();
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toMatchObject({ elements: [] });
    });
  });

  it("restores saved local yard data after a new render", async () => {
    const user = userEvent.setup();
    const firstRender = render(<YardEditor />);

    await user.type(screen.getByLabelText("Location"), "45.5, -73.6");
    await user.selectOptions(screen.getByLabelText("Drawing tool"), "planting-bed");
    fireEvent.pointerDown(screen.getByLabelText("Click to add a planting-bed"), {
      clientX: 500,
      clientY: 320,
      pointerId: 1
    });
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toMatchObject({ location: "45.5, -73.6" });
    });

    firstRender.unmount();
    render(<YardEditor />);

    expect(screen.getByLabelText("Location")).toHaveValue("45.5, -73.6");
    expect(screen.getByText("Saved yard restored.")).toBeInTheDocument();
  });
});
