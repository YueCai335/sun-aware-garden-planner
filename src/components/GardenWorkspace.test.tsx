import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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

  it("loads a demo garden", async () => {
    const user = userEvent.setup();
    render(<GardenWorkspace />);

    await user.click(await screen.findByRole("button", { name: "Load demo garden" }));
    expect(await screen.findByRole("heading", { name: "Blainville Garden" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "North raised bed" })).toBeInTheDocument();
  });

  it("removes an area and asks before starting a new garden", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<GardenWorkspace />);

    await user.click(await screen.findByRole("button", { name: "Load demo garden" }));
    await user.click(screen.getByRole("button", { name: "Remove Patio containers" }));
    expect(screen.queryByRole("heading", { name: "Patio containers" })).not.toBeInTheDocument();
    expect(screen.getByText("1", { selector: ".sidebar-count strong" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New garden" }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "Blainville Garden" })).toBeInTheDocument();

    confirm.mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "New garden" }));
    expect(await screen.findByRole("heading", { name: "Create your garden" })).toBeInTheDocument();
    expect(window.localStorage.getItem(GARDEN_WORKSPACE_STORAGE_KEY)).toBeNull();
    confirm.mockRestore();
  });
});
