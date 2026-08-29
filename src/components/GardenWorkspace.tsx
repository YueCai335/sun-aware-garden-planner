"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  createDemoGardenWorkspace,
  createGardenWorkspace,
  GARDEN_WORKSPACE_STORAGE_KEY,
  growingAreaKindLabels,
  growingAreaKinds,
  readGardenWorkspace,
  type GardenWorkspace,
  type GrowingAreaKind
} from "@/lib/gardenWorkspace";

export function GardenWorkspace() {
  const [workspace, setWorkspace] = useState<GardenWorkspace>();
  const [gardenName, setGardenName] = useState("");
  const [areaName, setAreaName] = useState("");
  const [areaKind, setAreaKind] = useState<GrowingAreaKind>("raised-bed");
  const [isAreaFormOpen, setIsAreaFormOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const restored = readGardenWorkspace(window.localStorage.getItem(GARDEN_WORKSPACE_STORAGE_KEY));
    if (restored) {
      setWorkspace(restored);
      setMessage("Garden restored from this browser.");
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded && workspace) window.localStorage.setItem(GARDEN_WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
  }, [isLoaded, workspace]);

  const createGarden = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = gardenName.trim();
    if (!name) {
      setMessage("Enter a garden name to continue.");
      return;
    }
    setWorkspace(createGardenWorkspace(name));
    setGardenName("");
    setMessage("Garden created. Add the first growing area.");
  };

  const loadDemo = () => {
    setWorkspace(createDemoGardenWorkspace());
    setIsAreaFormOpen(false);
    setMessage("Demo garden loaded.");
  };

  const addGrowingArea = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = areaName.trim();
    if (!workspace || !name) {
      setMessage("Enter a growing-area name to continue.");
      return;
    }
    setWorkspace((current) => current ? {
      ...current,
      growingAreas: [...current.growingAreas, { id: createAreaId(), name, kind: areaKind }]
    } : current);
    setAreaName("");
    setAreaKind("raised-bed");
    setIsAreaFormOpen(false);
    setMessage(`${name} added.`);
  };

  const removeGrowingArea = (areaId: string, areaName: string) => {
    setWorkspace((current) => current ? {
      ...current,
      growingAreas: current.growingAreas.filter((area) => area.id !== areaId)
    } : current);
    setMessage(`${areaName} removed.`);
  };

  const startOver = () => {
    if (!window.confirm("Start a new garden? This removes the garden saved in this browser.")) return;
    window.localStorage.removeItem(GARDEN_WORKSPACE_STORAGE_KEY);
    setWorkspace(undefined);
    setGardenName("");
    setAreaName("");
    setIsAreaFormOpen(false);
    setMessage("Start a new garden when you are ready.");
  };

  if (!isLoaded) return <main className="operations-shell"><p className="loading-state">Loading garden workspace...</p></main>;

  if (!workspace) {
    return <main className="operations-shell">
      <header className="operations-header"><p className="product-kicker">Sun-Aware Garden Planner</p><h1>Garden operations</h1></header>
      <section className="garden-onboarding" aria-labelledby="create-garden-heading">
        <div>
          <p className="section-eyebrow">Seasonal workspace</p>
          <h2 id="create-garden-heading">Create your garden</h2>
        </div>
        <form className="garden-form" onSubmit={createGarden}>
          <label htmlFor="garden-name">Garden name</label>
          <div className="inline-form-row">
            <input autoFocus id="garden-name" onChange={(event) => setGardenName(event.target.value)} placeholder="e.g. Backyard garden" required value={gardenName} />
            <button className="primary-button" type="submit">Create garden</button>
          </div>
        </form>
        <button className="text-button" onClick={loadDemo} type="button">Load demo garden</button>
        <p aria-live="polite" className="workspace-message" role="status">{message}</p>
      </section>
    </main>;
  }

  return <main className="operations-shell">
    <header className="operations-header operations-header-active">
      <div><p className="product-kicker">Sun-Aware Garden Planner</p><h1>{workspace.garden.name}</h1></div>
      <button className="secondary-button" onClick={startOver} type="button">New garden</button>
    </header>
    <div className="operations-layout">
      <aside className="operations-sidebar" aria-label="Garden summary">
        <p className="section-eyebrow">Garden overview</p>
        <p className="sidebar-count"><strong>{workspace.growingAreas.length}</strong> growing {workspace.growingAreas.length === 1 ? "area" : "areas"}</p>
        <p className="sidebar-note">Saved in this browser.</p>
      </aside>
      <section className="operations-content" aria-labelledby="growing-areas-heading">
        <div className="section-header">
          <div><p className="section-eyebrow">Garden setup</p><h2 id="growing-areas-heading">Growing areas</h2></div>
          <button className="primary-button" onClick={() => setIsAreaFormOpen(true)} type="button">Add growing area</button>
        </div>
        {isAreaFormOpen ? <form className="area-form" onSubmit={addGrowingArea}>
          <div className="field"><label htmlFor="growing-area-name">Area name</label><input autoFocus id="growing-area-name" onChange={(event) => setAreaName(event.target.value)} placeholder="e.g. North raised bed" required value={areaName} /></div>
          <div className="field"><label htmlFor="growing-area-kind">Area type</label><select id="growing-area-kind" onChange={(event) => setAreaKind(event.target.value as GrowingAreaKind)} value={areaKind}>{growingAreaKinds.map((kind) => <option key={kind} value={kind}>{growingAreaKindLabels[kind]}</option>)}</select></div>
          <div className="form-actions"><button className="primary-button" type="submit">Save area</button><button className="secondary-button" onClick={() => setIsAreaFormOpen(false)} type="button">Cancel</button></div>
        </form> : null}
        {workspace.growingAreas.length > 0 ? <ul className="growing-area-list">{workspace.growingAreas.map((area) => <li className="growing-area-item" key={area.id}><div><h3>{area.name}</h3><p>{growingAreaKindLabels[area.kind]}</p></div><button aria-label={`Remove ${area.name}`} className="remove-button" onClick={() => removeGrowingArea(area.id, area.name)} type="button">Remove</button></li>)}</ul> : <div className="empty-areas"><h3>No growing areas yet</h3><p>Add the spaces where you grow plants.</p></div>}
        <p aria-live="polite" className="workspace-message" role="status">{message}</p>
      </section>
    </div>
  </main>;
}

function createAreaId() {
  return globalThis.crypto?.randomUUID?.() ?? `area-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
