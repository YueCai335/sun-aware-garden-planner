import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GrowingAreaLayoutEditor } from "@/components/GrowingAreaLayoutEditor";
import { GardenWorkspace } from "@/components/GardenWorkspace";
import {
  createDemoGardenWorkspace,
  GARDEN_WORKSPACE_STORAGE_KEY,
} from "@/lib/gardenWorkspace";
import { SERVER_WORKSPACE_STORAGE_KEY } from "@/components/GardenWorkspace";

async function loadDemo(user: ReturnType<typeof userEvent.setup>) {
  render(<GardenWorkspace />);
  await user.click(await screen.findByRole("button", { name: "Load demo garden" }));
}

async function openPlantingArea(user: ReturnType<typeof userEvent.setup>, name: string) {
  await openSelectedGarden();
  await user.click(screen.getByRole("button", { name: `Open ${name}` }));
}

async function openSelectedGarden() {
  fireEvent.doubleClick(
    await screen.findByRole("button", { name: /, selected$/ }),
  );
  await screen.findByRole("heading", { name: "Edit garden" });
}

async function openCare(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Care" }));
  const gardenCard = screen.getByRole("heading", { name: "Demo Garden", level: 3 }).closest("article");
  if (!gardenCard) throw new Error("Demo Garden care card was not found");
  await user.click(within(gardenCard).getByRole("button", { name: "Open care" }));
}

describe("GardenWorkspace", () => {
  it("imports browser gardens, reloads from PostgreSQL, and saves a later edit", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const workspace = createDemoGardenWorkspace();
    const fetch = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true,
      json: async () => JSON.parse(String(init?.body ?? JSON.stringify({ workspaceId: "server-workspace", ...workspace }))),
    }));
    vi.stubGlobal("fetch", fetch);
    window.localStorage.setItem(GARDEN_WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));

    const firstRender = render(<GardenWorkspace />);
    await openSelectedGarden();
    await user.click(screen.getByRole("button", { name: "Import gardens to PostgreSQL" }));
    await screen.findByText("Gardens imported. PostgreSQL now saves this workspace.");
    const importedPayload = JSON.parse(String(fetch.mock.calls[0][1]?.body));
    expect(fetch.mock.calls[0][0]).toMatch(/\/import$/);
    const savedBrowserWorkspace = JSON.parse(window.localStorage.getItem(GARDEN_WORKSPACE_STORAGE_KEY)!);
    expect(savedBrowserWorkspace.gardens[0].growingAreas[0].layout.allocations[0].plantingRecordId).toBe("demo-planting-tomatoes");
    expect(window.localStorage.getItem(SERVER_WORKSPACE_STORAGE_KEY)).toBe(importedPayload.workspaceId);

    await user.clear(screen.getByLabelText("Garden name"));
    await user.type(screen.getByLabelText("Garden name"), "Server garden");
    await user.click(screen.getByRole("button", { name: "Save garden name" }));
    await waitFor(() => expect(fetch.mock.calls).toContainEqual([
      expect.stringMatching(/\/workspaces\/local-/),
      expect.objectContaining({ method: "PUT" }),
    ]));

    firstRender.unmount();
    fetch.mockClear();
    render(<GardenWorkspace />);
    await screen.findByRole("button", { name: "Plan next season" });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/workspaces\/local-/),
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    confirm.mockRestore();
  });

  it("keeps browser gardens active when PostgreSQL import fails", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const workspace = createDemoGardenWorkspace();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({}) })));
    window.localStorage.setItem(GARDEN_WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));

    render(<GardenWorkspace />);
    await openSelectedGarden();
    await user.click(screen.getByRole("button", { name: "Import gardens to PostgreSQL" }));

    expect(screen.getByText("Import failed. Your browser gardens are still available.")).toBeInTheDocument();
    expect(window.localStorage.getItem(SERVER_WORKSPACE_STORAGE_KEY)).toBeNull();
    confirm.mockRestore();
  });

  it("reports a PostgreSQL save failure without returning to browser storage", async () => {
    const user = userEvent.setup();
    const workspace = createDemoGardenWorkspace();
    const fetch = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: !init?.method,
      json: async () => ({ workspaceId: "server-workspace", ...workspace }),
    }));
    vi.stubGlobal("fetch", fetch);
    window.localStorage.setItem(GARDEN_WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
    window.localStorage.setItem(SERVER_WORKSPACE_STORAGE_KEY, "server-workspace");

    render(<GardenWorkspace />);
    await openSelectedGarden();
    await user.clear(screen.getByLabelText("Garden name"));
    await user.type(screen.getByLabelText("Garden name"), "Offline server garden");
    await user.click(screen.getByRole("button", { name: "Save garden name" }));

    await screen.findByText("Changes could not be saved to PostgreSQL. Keep this page open and make another change after the API recovers.");
    expect(window.localStorage.getItem(SERVER_WORKSPACE_STORAGE_KEY)).toBe("server-workspace");
    expect(window.localStorage.getItem(GARDEN_WORKSPACE_STORAGE_KEY)).toBe(JSON.stringify(workspace));
  });

  it("reviews an AI garden note before saving it to Care History", async () => {
    const user = userEvent.setup();
    const workspace = createDemoGardenWorkspace();
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes("/ai/care-note-draft")) {
        return {
          ok: true,
          json: async () => ({
            type: "fertilizing",
            date: "2026-08-31",
            note: "昨天施了 10 mL 鱼肥。",
            targetScope: "planting-area",
            growingAreaId: "demo-raised-bed",
            growingAreaName: "Sample raised bed",
            plantingRecordId: null,
            plantingRecordName: null,
            fertilizerProduct: "Fish fertilizer",
            fertilizerAmount: 10,
            fertilizerUnit: "mL",
            reviewNotes: [],
          }),
        };
      }
      return {
        ok: true,
        json: async () => init?.method ? JSON.parse(String(init.body)) : { workspaceId: "server-workspace", ...workspace },
      };
    });
    vi.stubGlobal("fetch", fetch);
    window.localStorage.setItem(SERVER_WORKSPACE_STORAGE_KEY, "server-workspace");

    render(<GardenWorkspace />);
    await user.click(await screen.findByRole("button", { name: "AI garden note" }));
    await user.type(screen.getByLabelText("Care note"), "昨天施了 10 mL 鱼肥。");
    await user.click(screen.getByRole("button", { name: "Create draft" }));
    expect(await screen.findByRole("heading", { name: "AI extracted draft" })).toBeInTheDocument();
    expect(screen.getByLabelText("Fertilizer product (optional)")).toHaveValue("Fish fertilizer");
    expect(screen.queryByText("AI care draft saved to Care History.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save to Care History" }));
    expect(screen.getByRole("heading", { name: "History" })).toBeInTheDocument();
    expect(screen.getByText(/Fish fertilizer/)).toBeInTheDocument();
  });

  it("reviews an AI plant-health assessment before saving it to health history", async () => {
    const user = userEvent.setup();
    const workspace = createDemoGardenWorkspace();
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes("/ai/plant-health-assessment")) {
        return {
          ok: true,
          json: async () => ({
            summary: "White coating needs a closer look.",
            possibleIssues: ["Powdery mildew"],
            nextSteps: ["Check nearby leaves tomorrow."],
            followUpQuestions: ["Does it wipe away?"],
            confidence: "low",
          }),
        };
      }
      return {
        ok: true,
        json: async () => init?.method ? JSON.parse(String(init.body)) : { workspaceId: "server-workspace", ...workspace },
      };
    });
    vi.stubGlobal("fetch", fetch);
    window.localStorage.setItem(SERVER_WORKSPACE_STORAGE_KEY, "server-workspace");

    render(<GardenWorkspace />);
    await user.click(await screen.findByRole("button", { name: "Plant health" }));
    await user.type(screen.getByLabelText("What do you observe?"), "White coating on the lower leaves.");
    await user.click(screen.getByRole("button", { name: "Create AI assessment" }));
    expect(await screen.findByRole("heading", { name: "Review assessment" })).toBeInTheDocument();
    expect(screen.getByLabelText("Summary")).toHaveValue("White coating needs a closer look.");

    await user.click(screen.getByRole("button", { name: "Save health record" }));
    const history = screen.getByRole("heading", { name: "Health history" }).closest("section");
    if (!history) throw new Error("Plant health history was not found");
    expect(within(history).getByText("White coating on the lower leaves.")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/workspaces\/server-workspace$/),
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("answers a Plant Knowledge question with visible source citations", async () => {
    const user = userEvent.setup();
    const workspace = createDemoGardenWorkspace();
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes("/plant-knowledge/answer")) {
        return {
          ok: true,
          json: async () => ({
            answer: "Observe the coating and improve airflow while you gather more detail.",
            confidence: "low",
            followUpQuestions: ["Does the coating wipe away?"],
            citations: [{
              sourceKey: "umn-preventing-plant-diseases",
              title: "Preventing plant diseases in the garden",
              publisher: "University of Minnesota Extension",
              sourceUrl: "https://extension.umn.edu/example",
              reviewedOn: "2026-09-01",
              excerpt: "Garden disease prevention includes sanitation and airflow.",
            }],
          }),
        };
      }
      return {
        ok: true,
        json: async () => init?.method ? JSON.parse(String(init.body)) : { workspaceId: "server-workspace", ...workspace },
      };
    });
    vi.stubGlobal("fetch", fetch);
    window.localStorage.setItem(SERVER_WORKSPACE_STORAGE_KEY, "server-workspace");

    render(<GardenWorkspace />);
    await user.click(await screen.findByRole("button", { name: "Plant knowledge" }));
    await user.type(screen.getByLabelText("Question"), "My tomato has a white coating.");
    await user.click(screen.getByRole("button", { name: "Ask Plant Knowledge" }));

    expect(await screen.findByRole("heading", { name: "Answer" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Preventing plant diseases in the garden" })).toHaveAttribute("href", "https://extension.umn.edu/example");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/plant-knowledge\/answer$/),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("separates all-garden care from care for one named location", async () => {
    const user = userEvent.setup();
    await loadDemo(user);

    await user.click(screen.getByRole("button", { name: "Care" }));
    const allGardensCard = screen.getByRole("heading", { name: "All gardens", level: 3 }).closest("article");
    const demoGardenCard = screen.getByRole("heading", { name: "Demo Garden", level: 3 }).closest("article");
    if (!allGardensCard || !demoGardenCard) throw new Error("Care cards were not found");

    await user.click(within(allGardensCard).getByRole("button", { name: "Open care" }));
    expect(screen.getByText("All gardens")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "History" }));
    await user.click(screen.getByRole("button", { name: "Add care event" }));
    expect(screen.getByLabelText("Target")).toHaveValue("all-gardens");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));

    await user.click(screen.getByRole("button", { name: "Care" }));
    const refreshedDemoGardenCard = screen.getByRole("heading", { name: "Demo Garden", level: 3 }).closest("article");
    if (!refreshedDemoGardenCard) throw new Error("Demo Garden care card was not found");
    await user.click(within(refreshedDemoGardenCard).getByRole("button", { name: "Open care" }));
    await user.click(screen.getByRole("tab", { name: "History" }));
    await user.click(screen.getByRole("button", { name: "Add care event" }));
    expect(screen.getByLabelText("Target")).toHaveValue("garden");
    expect(screen.getByRole("option", { name: "Demo Garden" })).toBeInTheDocument();
  });

  it("uses thumbnail selection and direct double-click or keyboard editing", async () => {
    const user = userEvent.setup();
    await loadDemo(user);

    expect(screen.queryByRole("button", { name: "Edit garden" })).not.toBeInTheDocument();
    fireEvent.doubleClick(screen.getByRole("button", { name: "Demo Garden, selected" }));
    expect(screen.getByRole("heading", { name: "Edit garden" })).toBeInTheDocument();
    expect(screen.getByLabelText("Plan width (X, m)")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    fireEvent.keyDown(screen.getByRole("button", { name: "Demo Garden, selected" }), { key: "Enter" });
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
    await user.type(within(plantForm).getByLabelText("Plant type"), "Kale");
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
    expect(screen.getByText("Tomato · Sun Gold")).toBeInTheDocument();
    expect(screen.queryByText("Bush beans")).not.toBeInTheDocument();

    const name = screen.getByLabelText("Planting-area name");
    await user.clear(name);
    await user.type(name, "Kitchen bed");
    await user.click(screen.getByRole("button", { name: "Save planting area" }));
    expect(screen.getAllByRole("heading", { name: "Kitchen bed" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Save dimensions" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add plant" }));
    const plantForm = screen.getByRole("heading", { name: "Add plant" }).closest("form")!;
    await user.type(within(plantForm).getByLabelText("Plant type"), "Basil");
    await user.selectOptions(within(plantForm).getByLabelText("Crop family"), "leafy");
    await user.type(within(plantForm).getByLabelText("Quantity"), "2");
    fireEvent.change(within(plantForm).getByLabelText("Planting date"), { target: { value: "2026-06-01" } });
    await user.click(within(plantForm).getByRole("button", { name: "Add plant" }));
    const basil = screen.getByText("Basil").closest("li")!;
    await user.click(within(basil).getByRole("button", { name: "Edit planting" }));
    await user.clear(screen.getByLabelText("Plant type"));
    await user.type(screen.getByLabelText("Plant type"), "Basil");
    await user.type(screen.getByLabelText("Variety (optional)"), "Thai basil");
    await user.click(screen.getByRole("button", { name: "Save plant" }));
    await user.click(within(screen.getByText("Basil · Thai basil").closest("li")!).getByRole("button", { name: "Remove" }));
    expect(screen.queryByText("Basil · Thai basil")).not.toBeInTheDocument();
  });

  it("preserves Care Log targets when planting-area plant records are removed", async () => {
    const user = userEvent.setup();
    await loadDemo(user);
    await openCare(user);
    await user.click(screen.getByRole("tab", { name: "History" }));
    await user.click(screen.getByRole("button", { name: "Add care event" }));
    const form = screen.getByRole("heading", { name: "Add care event" }).closest("form")!;
    fireEvent.change(within(form).getByLabelText("Date"), { target: { value: "2026-06-05" } });
    await user.selectOptions(within(form).getByLabelText("Target"), "plant-group:demo-planting-tomatoes");
    await user.click(within(form).getByRole("button", { name: "Add care event" }));
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    await openPlantingArea(user, "Sample raised bed");
    await user.click(within(screen.getByText("Tomato · Sun Gold").closest("li")!).getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Back to Edit garden" }));
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    await openCare(user);
    await user.click(screen.getByRole("tab", { name: "History" }));
    expect(screen.getByText(/Former plant group: Tomato · Sun Gold · Sample raised bed/)).toBeInTheDocument();
  });

  it("keeps gardens and planting areas when deletion is cancelled", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    await loadDemo(user);
    await openSelectedGarden();
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
    await openCare(user);
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
    await openCare(user);
    expect(screen.getByText(/Due 2026-09-07 · Sample raised bed/)).toBeInTheDocument();
  });

  it("marks deleted task targets as former and lets gardeners remove them", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    await loadDemo(user);
    await openCare(user);
    await user.click(screen.getByRole("button", { name: "Add task" }));
    const form = screen.getByRole("heading", { name: "Add care task" }).closest("form")!;
    fireEvent.change(within(form).getByLabelText("Due date"), { target: { value: "2026-09-02" } });
    await user.selectOptions(within(form).getByLabelText("Target"), "planting-area:demo-raised-bed");
    await user.click(within(form).getByRole("button", { name: "Add care task" }));
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    await openSelectedGarden();
    await user.click(screen.getByLabelText("Delete Sample raised bed"));
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    await openCare(user);
    const taskItem = screen.getByText(/Former planting area: Sample raised bed/).closest("li")!;
    await user.click(within(taskItem).getByRole("button", { name: "Remove" }));
    expect(screen.queryByText(/Former planting area: Sample raised bed/)).not.toBeInTheDocument();
    confirm.mockRestore();
  });

  it("moves a one-time completed task into History", async () => {
    const user = userEvent.setup();
    await loadDemo(user);
    await openCare(user);
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

  it("records, edits, deletes, and persists Care Log events", async () => {
    const user = userEvent.setup();
    const firstRender = render(<GardenWorkspace />);
    await user.click(await screen.findByRole("button", { name: "Load demo garden" }));
    await openCare(user);
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
    await openCare(user);
    await user.click(screen.getByRole("tab", { name: "History" }));
    expect(screen.getByRole("list")).toHaveTextContent("Sample raised bed");
    firstRender.unmount();
    render(<GardenWorkspace />);
    await openCare(user);
    await user.click(screen.getByRole("tab", { name: "History" }));
    expect(screen.getByText(/Kelp meal/)).toBeInTheDocument();
    await user.click(within(screen.getByText("Fertilizing").closest("li")!).getByRole("button", { name: "Delete record" }));
    expect(screen.queryByText(/Kelp meal/)).not.toBeInTheDocument();
  });

  it("keeps targeted care history with its former planting-area name", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    await loadDemo(user);
    await openCare(user);
    await user.click(screen.getByRole("tab", { name: "History" }));
    await user.click(screen.getByRole("button", { name: "Add care event" }));
    const form = screen.getByRole("heading", { name: "Add care event" }).closest("form")!;
    fireEvent.change(within(form).getByLabelText("Date"), { target: { value: "2026-06-04" } });
    await user.selectOptions(within(form).getByLabelText("Target"), "planting-area:demo-raised-bed");
    await user.click(within(form).getByRole("button", { name: "Add care event" }));
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    await openSelectedGarden();
    await user.click(screen.getByLabelText("Delete Sample raised bed"));
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    await openCare(user);
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
    await user.type(within(plantingForm).getByLabelText("Plant type"), "Tomato");
    await user.selectOptions(within(plantingForm).getByLabelText("Crop family"), "nightshade");
    await user.type(within(plantingForm).getByLabelText("Quantity"), "2");
    fireEvent.change(within(plantingForm).getByLabelText("Planting date"), { target: { value: "2026-05-20" } });
    await user.click(within(plantingForm).getByRole("button", { name: "Add plant" }));
    await user.click(screen.getByRole("button", { name: "Back to Edit garden" }));
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    await openCare(user);
    await user.click(screen.getByRole("tab", { name: "History" }));
    await user.click(screen.getByRole("button", { name: "Add care event" }));
    const careForm = screen.getByRole("heading", { name: "Add care event" }).closest("form")!;
    expect(within(careForm).getByRole("option", { name: "Tomato · Sun Gold · Sample raised bed" })).toBeInTheDocument();
    expect(within(careForm).getByRole("option", { name: "Tomato · Sample in-ground area" })).toBeInTheDocument();
  });

  it("keeps the dashboard compact and persists Garden Plan placement edits", async () => {
    const user = userEvent.setup();
    await loadDemo(user);
    expect(screen.getByRole("button", { name: "Add garden" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Plan width (X, m)")).not.toBeInTheDocument();
    await openSelectedGarden();
    fireEvent.click(screen.getByLabelText("Select Sample raised bed on Garden Plan"));
    fireEvent.change(screen.getByLabelText("Area X position (m)"), { target: { value: "2.26" } });
    fireEvent.change(screen.getByLabelText("Area rotation (degrees)"), { target: { value: "45.5" } });
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(GARDEN_WORKSPACE_STORAGE_KEY) ?? "{}").gardens[0].growingAreas[0].planPlacement).toEqual({ x: 2.3, y: 1, rotationDegrees: 45.5 }));
  });

  it("zooms Garden Plan labels and persists a selected plant color", async () => {
    const user = userEvent.setup();
    await loadDemo(user);
    await openSelectedGarden();
    expect(screen.queryByText("Tomato")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByText("125%")).toBeInTheDocument();
    expect(screen.getByText("Tomato")).toBeInTheDocument();
    const areaLabel = screen.getByTestId("area-label-demo-raised-bed");
    expect(areaLabel).toHaveAttribute("align", "center");
    expect(Number(areaLabel.getAttribute("y"))).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Fit plan" }));
    expect(screen.getByText("100%")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open Sample raised bed" }));
    fireEvent.doubleClick(screen.getByLabelText("Tomato plant"));
    fireEvent.change(screen.getByLabelText("Plant color"), { target: { value: "#1f77b4" } });
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(GARDEN_WORKSPACE_STORAGE_KEY) ?? "{}").gardens[0].growingAreas[0].layout.allocations[0].color).toBe("#1f77b4"));
  });

  it("renames a garden from Edit garden and preserves the saved name after dashboard navigation", async () => {
    const user = userEvent.setup();
    await loadDemo(user);
    await openSelectedGarden();
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
    expect(screen.getByText("Enter a plant type.")).toBeInTheDocument();
    await user.type(within(form).getByLabelText("Plant type"), "Pepper");
    await user.selectOptions(within(form).getByLabelText("Crop family"), "nightshade");
    await user.type(within(form).getByLabelText("Quantity"), "3");
    fireEvent.change(within(form).getByLabelText("Planting date"), { target: { value: "2026-05-20" } });
    await user.click(within(form).getByRole("button", { name: "Add plant" }));
    const plantingItem = screen.getByText("Pepper").closest("li")!;
    await user.click(within(plantingItem).getByRole("button", { name: "Remove" }));
    expect(screen.queryByText("Pepper")).not.toBeInTheDocument();
  });

  it("shows server-owned rotation history and keeps a repeated family warning advisory", async () => {
    const user = userEvent.setup();
    const workspace = createDemoGardenWorkspace();
    workspace.gardens[0].plantings[0].plantingDate = "2024-05-18";
    window.localStorage.setItem(SERVER_WORKSPACE_STORAGE_KEY, "server-workspace");
    vi.stubGlobal("fetch", vi.fn(async (url: string) => ({
      ok: true,
      json: async () => url.includes("rotation-guidance")
        ? {
            growingAreaId: "demo-raised-bed",
            growingAreaKind: "raised-bed",
            season: 2026,
            history: [{ plantingId: "demo-planting-tomatoes", commonName: "Tomatoes", cropFamily: "nightshade", plantingDate: "2024-05-18", season: 2024 }],
            warning: { cropFamily: "nightshade", plantings: [{ plantingId: "demo-planting-tomatoes", commonName: "Tomatoes", cropFamily: "nightshade", plantingDate: "2024-05-18", season: 2024 }] },
            automatedWarningSupported: true,
            hasAutomaticCompatibilityConclusion: true,
            rotationFriendlyCropFamilies: ["brassica", "cucurbit", "legume", "allium", "root", "leafy"],
          }
        : { workspaceId: "server-workspace", ...workspace },
    })));

    render(<GardenWorkspace />);
    await screen.findByRole("button", { name: "Plan next season" });
    await openPlantingArea(user, "Sample raised bed");
    await user.click(screen.getByRole("button", { name: "Add plant" }));
    const form = screen.getByRole("heading", { name: "Add plant" }).closest("form")!;
    await user.selectOptions(within(form).getByLabelText("Crop family"), "nightshade");
    fireEvent.change(within(form).getByLabelText("Planting date"), { target: { value: "2026-05-20" } });
    expect(await screen.findByText(/Rotation warning: Nightshade/)).toBeInTheDocument();
    expect(screen.queryByText("Three-season history")).not.toBeInTheDocument();
    expect(within(form).getByRole("button", { name: "Add plant" })).toBeEnabled();
  });

  it("keeps routine planting forms focused on saving the record", async () => {
    const user = userEvent.setup();
    const workspace = createDemoGardenWorkspace();
    window.localStorage.setItem(SERVER_WORKSPACE_STORAGE_KEY, "server-workspace");
    vi.stubGlobal("fetch", vi.fn(async (url: string) => ({
      ok: true,
      json: async () => url.includes("rotation-guidance")
        ? {
            growingAreaId: "demo-container-group",
            growingAreaKind: "container",
            season: 2026,
            history: [{ plantingId: "prior", commonName: "Peppers", cropFamily: "nightshade", plantingDate: "2025-05-20", season: 2025 }],
            warning: null,
            automatedWarningSupported: false,
            hasAutomaticCompatibilityConclusion: false,
            rotationFriendlyCropFamilies: ["brassica", "cucurbit", "legume", "allium", "root", "leafy"],
          }
        : { workspaceId: "server-workspace", ...workspace },
    })));

    render(<GardenWorkspace />);
    await screen.findByRole("button", { name: "Plan next season" });
    await openPlantingArea(user, "Sample container group");
    await user.click(screen.getByRole("button", { name: "Add plant" }));
    const form = screen.getByRole("heading", { name: "Add plant" }).closest("form")!;
    await user.selectOptions(within(form).getByLabelText("Crop family"), "other");
    fireEvent.change(within(form).getByLabelText("Planting date"), { target: { value: "2026-05-20" } });
    await waitFor(() => expect(screen.queryByText("Three-season history")).not.toBeInTheDocument());
    expect(screen.queryByText(/Rotation-friendly family candidates/)).not.toBeInTheDocument();
  });

  it("saves next-season choices separately from current plant records and shows pairing notes", async () => {
    const user = userEvent.setup();
    const workspace = createDemoGardenWorkspace();
    workspace.gardens[0].plantings[0].plantingDate = "2024-05-18";
    window.localStorage.setItem(SERVER_WORKSPACE_STORAGE_KEY, "server-workspace");
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes("rotation-guidance")) {
        const request = JSON.parse(String(init?.body));
        const selectedNightshade = request.cropFamily === "nightshade";
        return {
          ok: true,
          json: async () => ({
            growingAreaId: request.growingAreaId,
            growingAreaKind: "raised-bed",
            season: 2026,
            history: [{ plantingId: "demo-planting-tomatoes", commonName: "Tomatoes", cropFamily: "nightshade", plantingDate: "2024-05-18", season: 2024 }],
            warning: selectedNightshade ? { cropFamily: "nightshade", plantings: [] } : null,
            automatedWarningSupported: true,
            hasAutomaticCompatibilityConclusion: selectedNightshade,
            rotationFriendlyCropFamilies: ["brassica", "cucurbit", "legume", "allium", "root", "leafy"],
          }),
        };
      }
      return { ok: true, json: async () => ({ workspaceId: "server-workspace", ...workspace }) };
    }));

    render(<GardenWorkspace />);
    await screen.findByRole("button", { name: "Plan next season" });
    await user.click(screen.getByRole("button", { name: "Plan next season" }));
    await screen.findByRole("heading", { name: "Next season planner" });
    expect(screen.getByRole("button", { name: "Planting areas" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "Full garden" }));
    expect(screen.getByRole("button", { name: "Full garden" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    const raisedBed = screen.getByRole("heading", { name: "Sample raised bed" }).closest("article")!;
    expect(within(raisedBed).getByText("Last season")).toBeInTheDocument();
    expect(within(raisedBed).getByText("Avoid if possible")).toBeInTheDocument();
    expect(within(raisedBed).getByText("Good rotation fit")).toBeInTheDocument();
    await user.click(within(raisedBed).getByRole("button", { name: "Choose a plant" }));
    await user.type(within(raisedBed).getByLabelText("Plant type"), "Tomato");
    expect(within(raisedBed).getByText(/Crop family:/)).toHaveTextContent("Nightshade");
    expect(within(raisedBed).getByText(/automatic/)).toBeInTheDocument();
    await user.click(within(raisedBed).getByRole("button", { name: `Add to ${new Date().getFullYear() + 1} plan` }));

    const updatedRaisedBed = screen.getByRole("heading", { name: "Sample raised bed" }).closest("article")!;
    expect(within(updatedRaisedBed).getByText(`${new Date().getFullYear() + 1} plan`)).toBeInTheDocument();
    expect(within(updatedRaisedBed).getByText("Tomato")).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: `${new Date().getFullYear() + 1} plan preview for Demo Garden`,
      }),
    ).toBeInTheDocument();
    const areaLabel = screen.getByTestId("season-area-label-demo-raised-bed");
    expect(Number(areaLabel.getAttribute("y"))).toBeLessThan(1);
    expect(screen.queryByRole("heading", { name: "Add plant" })).not.toBeInTheDocument();
    await user.click(within(updatedRaisedBed).getByRole("button", { name: "Choose a plant" }));
    await user.type(within(updatedRaisedBed).getByLabelText("Plant type"), "Basil");
    await user.click(within(updatedRaisedBed).getByRole("button", { name: `Add to ${new Date().getFullYear() + 1} plan` }));

    const pairedRaisedBed = (await screen.findByRole("heading", { name: "Sample raised bed" })).closest("article")!;
    expect(within(pairedRaisedBed).getByText(/Tomato \+ basil/)).toBeInTheDocument();
  });

  it("uses current layout plants as last-season history without waiting for a server request", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      GARDEN_WORKSPACE_STORAGE_KEY,
      JSON.stringify(createDemoGardenWorkspace()),
    );

    render(<GardenWorkspace />);
    await user.click(await screen.findByRole("button", { name: "Plan next season" }));

    const raisedBed = screen.getByRole("heading", { name: "Sample raised bed" }).closest("article")!;
    expect(within(raisedBed).getByText("Tomatoes")).toBeInTheDocument();
    expect(within(raisedBed).getByText("Nightshade (tomato, pepper, eggplant)")).toBeInTheDocument();
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
