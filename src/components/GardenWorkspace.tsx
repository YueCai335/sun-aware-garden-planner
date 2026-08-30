"use client";

import { FormEvent, useEffect, useState } from "react";

import { GardenPlanOverview } from "@/components/GardenPlanOverview";
import { GrowingAreaLayoutEditor } from "@/components/GrowingAreaLayoutEditor";
import {
  clampPlanPosition,
  defaultPlanPlacement,
  createDemoGardenWorkspace,
  createGardenWorkspace,
  GARDEN_WORKSPACE_STORAGE_KEY,
  growingAreaKindLabels,
  growingAreaKinds,
  readGardenWorkspace,
  type GardenWorkspace,
  type GardenPlan,
  type GrowingAreaKind,
  type GrowingAreaLayout,
  type PlanPlacement,
  plantingCropFamilies,
  plantingCropFamilyLabels,
  type PlantingCropFamily,
  type PlantingRecord
} from "@/lib/gardenWorkspace";

export function GardenWorkspace() {
  const [workspace, setWorkspace] = useState<GardenWorkspace>();
  const [gardenName, setGardenName] = useState("");
  const [areaName, setAreaName] = useState("");
  const [areaKind, setAreaKind] = useState<GrowingAreaKind>("raised-bed");
  const [isAreaFormOpen, setIsAreaFormOpen] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<string>();
  const [isPlantingFormOpen, setIsPlantingFormOpen] = useState(false);
  const [editingPlantingId, setEditingPlantingId] = useState<string>();
  const [plantingForm, setPlantingForm] = useState<PlantingForm>(emptyPlantingForm());
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
    if (workspace && !window.confirm("Load the demo garden? This replaces the garden saved in this browser.")) return;
    setWorkspace(createDemoGardenWorkspace());
    setIsAreaFormOpen(false);
    setEditingAreaId(undefined);
    setIsPlantingFormOpen(false);
    setEditingPlantingId(undefined);
    setMessage("Demo garden loaded.");
  };

  const addGrowingArea = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = areaName.trim();
    if (!workspace || !name) {
      setMessage("Enter a growing-area name to continue.");
      return;
    }
    setWorkspace((current) => {
      if (!current) return current;
      const placement = defaultPlanPlacement(current.growingAreas.length);
      return {
        ...current,
        growingAreas: [...current.growingAreas, { id: createAreaId(), name, kind: areaKind, planPlacement: { ...placement, ...clampPlanPosition(placement, current.garden.plan) } }]
      };
    });
    setAreaName("");
    setAreaKind("raised-bed");
    setIsAreaFormOpen(false);
    setMessage(`${name} added.`);
  };

  const removeGrowingArea = (areaId: string, areaName: string) => {
    const linkedPlantings = workspace?.plantings.filter((planting) => planting.growingAreaId === areaId) ?? [];
    const recordLabel = `${linkedPlantings.length} planting record${linkedPlantings.length === 1 ? "" : "s"}`;
    if (!window.confirm(`Remove ${areaName} and its ${recordLabel}? This removes them from this browser.`)) return;
    setWorkspace((current) => current ? {
      ...current,
      growingAreas: current.growingAreas.filter((area) => area.id !== areaId),
      plantings: current.plantings.filter((planting) => planting.growingAreaId !== areaId)
    } : current);
    setMessage(`${areaName} and its planting records removed.`);
  };

  const updateAreaLayout = (areaId: string, layout: GrowingAreaLayout) => {
    setWorkspace((current) => current ? {
      ...current,
      growingAreas: current.growingAreas.map((area) => area.id === areaId ? { ...area, layout } : area)
    } : current);
  };

  const updatePlan = (plan: GardenPlan) => {
    setWorkspace((current) => current ? {
      ...current,
      garden: { ...current.garden, plan },
      growingAreas: current.growingAreas.map((area) => ({ ...area, planPlacement: { ...area.planPlacement, ...clampPlanPosition(area.planPlacement, plan) } }))
    } : current);
  };

  const updateAreaPlacement = (areaId: string, planPlacement: PlanPlacement) => {
    setWorkspace((current) => current ? {
      ...current,
      growingAreas: current.growingAreas.map((area) => area.id === areaId ? { ...area, planPlacement } : area)
    } : current);
  };

  const startOver = () => {
    if (!window.confirm("Start a new garden? This removes the garden saved in this browser.")) return;
    window.localStorage.removeItem(GARDEN_WORKSPACE_STORAGE_KEY);
    setWorkspace(undefined);
    setGardenName("");
    setAreaName("");
    setIsAreaFormOpen(false);
    setEditingAreaId(undefined);
    setIsPlantingFormOpen(false);
    setEditingPlantingId(undefined);
    setMessage("Start a new garden when you are ready.");
  };

  const openAddPlanting = () => {
    if (!workspace || !workspace.growingAreas.length) {
      setMessage("Add a growing area before recording a planting.");
      return;
    }
    setPlantingForm(emptyPlantingForm());
    setEditingPlantingId(undefined);
    setIsPlantingFormOpen(true);
  };

  const openEditPlanting = (planting: PlantingRecord) => {
    setPlantingForm({ commonName: planting.commonName, cropFamily: planting.cropFamily, quantity: String(planting.quantity), plantingDate: planting.plantingDate, growingAreaId: planting.growingAreaId, isActive: planting.isActive });
    setEditingPlantingId(planting.id);
    setIsPlantingFormOpen(true);
  };

  const savePlanting = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspace) return;
    const commonName = plantingForm.commonName.trim(), quantity = Number(plantingForm.quantity);
    if (!commonName) return setMessage("Enter a plant name.");
    if (!plantingForm.cropFamily || !plantingCropFamilies.includes(plantingForm.cropFamily)) return setMessage("Choose a crop family.");
    if (!Number.isInteger(quantity) || quantity < 1) return setMessage("Enter a whole-number quantity of at least 1.");
    if (!isCalendarDate(plantingForm.plantingDate)) return setMessage("Enter a valid planting date.");
    if (!workspace.growingAreas.some((area) => area.id === plantingForm.growingAreaId)) return setMessage("Choose an existing growing area.");
    const planting: PlantingRecord = { id: editingPlantingId ?? createPlantingId(), commonName, cropFamily: plantingForm.cropFamily, quantity, plantingDate: plantingForm.plantingDate, growingAreaId: plantingForm.growingAreaId, isActive: plantingForm.isActive };
    setWorkspace((current) => current ? { ...current, plantings: editingPlantingId ? current.plantings.map((record) => record.id === editingPlantingId ? planting : record) : [...current.plantings, planting] } : current);
    setIsPlantingFormOpen(false);
    setEditingPlantingId(undefined);
    setMessage(`${commonName} ${editingPlantingId ? "updated" : "added"}.`);
  };

  const removePlanting = (planting: PlantingRecord) => {
    setWorkspace((current) => current ? { ...current, plantings: current.plantings.filter((record) => record.id !== planting.id) } : current);
    setMessage(`${planting.commonName} removed.`);
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

  const editingArea = workspace.growingAreas.find((area) => area.id === editingAreaId);

  return <main className="operations-shell">
    <header className="operations-header operations-header-active">
      <div><p className="product-kicker">Sun-Aware Garden Planner</p><h1>{workspace.garden.name}</h1></div>
      <div className="header-actions"><button className="secondary-button" onClick={loadDemo} type="button">Load demo garden</button><button className="secondary-button" onClick={startOver} type="button">New garden</button></div>
    </header>
    <div className="operations-layout operations-layout-editor">
      <section className="operations-content" aria-labelledby={editingArea ? undefined : "growing-areas-heading"}>
        {editingArea ? <GrowingAreaLayoutEditor area={editingArea} onBack={() => setEditingAreaId(undefined)} onChange={(layout) => updateAreaLayout(editingArea.id, layout)} /> : <>
          <GardenPlanOverview growingAreas={workspace.growingAreas} onEditLayout={setEditingAreaId} onPlacementChange={updateAreaPlacement} onPlanChange={updatePlan} plan={workspace.garden.plan} />
          <section className="plantings-section" aria-labelledby="plantings-heading">
            <div className="section-header"><div><p className="section-eyebrow">Garden operations</p><h2 id="plantings-heading">Plantings</h2></div><button className="primary-button" onClick={openAddPlanting} type="button">Add planting</button></div>
            {isPlantingFormOpen ? <form className="planting-form" onSubmit={savePlanting}>
              <h3>{editingPlantingId ? "Edit planting" : "Add planting"}</h3>
              <div className="field"><label htmlFor="planting-common-name">Plant name</label><input autoFocus id="planting-common-name" onChange={(event) => setPlantingForm({ ...plantingForm, commonName: event.target.value })} placeholder="e.g. Tomatoes" value={plantingForm.commonName} /></div>
              <div className="field"><label htmlFor="planting-crop-family">Crop family</label><select id="planting-crop-family" onChange={(event) => setPlantingForm({ ...plantingForm, cropFamily: event.target.value as PlantingCropFamily })} value={plantingForm.cropFamily}><option value="">Choose a crop family</option>{plantingCropFamilies.map((family) => <option key={family} value={family}>{plantingCropFamilyLabels[family]}</option>)}</select></div>
              <div className="field"><label htmlFor="planting-quantity">Quantity</label><input id="planting-quantity" min="1" onChange={(event) => setPlantingForm({ ...plantingForm, quantity: event.target.value })} step="1" type="number" value={plantingForm.quantity} /></div>
              <div className="field"><label htmlFor="planting-date">Planting date</label><input id="planting-date" onChange={(event) => setPlantingForm({ ...plantingForm, plantingDate: event.target.value })} type="date" value={plantingForm.plantingDate} /></div>
              <div className="field"><label htmlFor="planting-growing-area">Growing area</label><select id="planting-growing-area" onChange={(event) => setPlantingForm({ ...plantingForm, growingAreaId: event.target.value })} value={plantingForm.growingAreaId}><option value="">Choose a growing area</option>{workspace.growingAreas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select></div>
              <label className="checkbox-field"><input checked={plantingForm.isActive} onChange={(event) => setPlantingForm({ ...plantingForm, isActive: event.target.checked })} type="checkbox" /> Active planting</label>
              <div className="form-actions"><button className="primary-button" type="submit">{editingPlantingId ? "Save planting" : "Add planting"}</button><button className="secondary-button" onClick={() => { setIsPlantingFormOpen(false); setEditingPlantingId(undefined); }} type="button">Cancel</button></div>
            </form> : null}
            {workspace.plantings.length ? <div className="planting-groups">{workspace.growingAreas.map((area) => {
              const records = workspace.plantings.filter((planting) => planting.growingAreaId === area.id);
              return records.length ? <section className="planting-group" key={area.id}><h3>{area.name}</h3><ul className="planting-list">{records.map((planting) => <li key={planting.id}><div><strong>{planting.commonName}</strong><p>{plantingCropFamilyLabels[planting.cropFamily]} · {planting.quantity} · {planting.plantingDate} · {planting.isActive ? "Active" : "Archived"}</p></div><div className="area-actions"><button className="text-button" onClick={() => openEditPlanting(planting)} type="button">Edit planting</button><button className="remove-button" onClick={() => removePlanting(planting)} type="button">Remove</button></div></li>)}</ul></section> : null;
            })}</div> : <div className="empty-areas"><h3>No plantings yet</h3><p>Record what you planted in each growing area.</p></div>}
          </section>
          <div className="section-header">
          <div><p className="section-eyebrow">Garden setup</p><h2 id="growing-areas-heading">Growing areas</h2></div>
          <button className="primary-button" onClick={() => setIsAreaFormOpen(true)} type="button">Add growing area</button>
        </div>
        {isAreaFormOpen ? <form className="area-form" onSubmit={addGrowingArea}>
          <div className="field"><label htmlFor="growing-area-name">Area name</label><input autoFocus id="growing-area-name" onChange={(event) => setAreaName(event.target.value)} placeholder="e.g. North raised bed" required value={areaName} /></div>
          <div className="field"><label htmlFor="growing-area-kind">Area type</label><select id="growing-area-kind" onChange={(event) => setAreaKind(event.target.value as GrowingAreaKind)} value={areaKind}>{growingAreaKinds.map((kind) => <option key={kind} value={kind}>{growingAreaKindLabels[kind]}</option>)}</select></div>
          <div className="form-actions"><button className="primary-button" type="submit">Save area</button><button className="secondary-button" onClick={() => setIsAreaFormOpen(false)} type="button">Cancel</button></div>
        </form> : null}
        {workspace.growingAreas.length > 0 ? <ul className="growing-area-list">{workspace.growingAreas.map((area) => <li className="growing-area-item" key={area.id}><div><h3>{area.name}</h3><p>{growingAreaKindLabels[area.kind]}{area.layout ? ` · ${area.layout.widthMeters} m long × ${area.layout.depthMeters} m wide` : ""}</p></div><div className="area-actions"><button aria-label={`${area.layout ? "Edit" : "Set up"} ${area.name} layout`} className="text-button" onClick={() => setEditingAreaId(area.id)} type="button">{area.layout ? "Edit layout" : "Set up layout"}</button><button aria-label={`Remove ${area.name}`} className="remove-button" onClick={() => removeGrowingArea(area.id, area.name)} type="button">Remove</button></div></li>)}</ul> : <div className="empty-areas"><h3>No growing areas yet</h3><p>Add the spaces where you grow plants.</p></div>}
        <p aria-live="polite" className="workspace-message" role="status">{message}</p>
        </>}
      </section>
    </div>
  </main>;
}

function createAreaId() {
  return globalThis.crypto?.randomUUID?.() ?? `area-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type PlantingForm = { commonName: string; cropFamily: PlantingCropFamily | ""; quantity: string; plantingDate: string; growingAreaId: string; isActive: boolean };

function emptyPlantingForm(): PlantingForm {
  return { commonName: "", cropFamily: "", quantity: "", plantingDate: "", growingAreaId: "", isActive: true };
}

function isCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number), date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function createPlantingId() {
  return globalThis.crypto?.randomUUID?.() ?? `planting-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
