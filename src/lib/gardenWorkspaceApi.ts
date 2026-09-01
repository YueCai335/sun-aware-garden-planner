import type { GardenWorkspace } from "@/lib/gardenWorkspace";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

export type ServerWorkspace = GardenWorkspace & { workspaceId: string };

async function request(path: string, options?: RequestInit): Promise<ServerWorkspace> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!response.ok) throw new Error("The garden server could not save this workspace.");
  return response.json() as Promise<ServerWorkspace>;
}

export function loadServerWorkspace(workspaceId: string) {
  return request(`/workspaces/${encodeURIComponent(workspaceId)}`);
}

export function importServerWorkspace(workspaceId: string, workspace: GardenWorkspace) {
  return request(`/workspaces/${encodeURIComponent(workspaceId)}/import`, {
    method: "PUT",
    body: JSON.stringify({ workspaceId, ...workspace }),
  });
}

export function saveServerWorkspace(workspaceId: string, workspace: GardenWorkspace) {
  return request(`/workspaces/${encodeURIComponent(workspaceId)}`, {
    method: "PUT",
    body: JSON.stringify({ workspaceId, ...workspace }),
  });
}
