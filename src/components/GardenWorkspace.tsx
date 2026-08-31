"use client";

import { FormEvent, type RefObject, useEffect, useRef, useState } from "react";

import { GardenPlanOverview } from "@/components/GardenPlanOverview";
import { GrowingAreaLayoutEditor } from "@/components/GrowingAreaLayoutEditor";
import {
  clampPlanPosition,
  createDemoGardenWorkspace,
  createGarden,
  createGardenWorkspace,
  defaultPlanPlacement,
  GARDEN_WORKSPACE_STORAGE_KEY,
  growingAreaKindLabels,
  growingAreaKinds,
  plantingCropFamilies,
  plantingCropFamilyLabels,
  readGardenWorkspace,
  type Garden,
  type CareEvent,
  type CareEventTargetScope,
  type CareEventType,
  type GardenPlan,
  type GardenWorkspace,
  type GrowingArea,
  type GrowingAreaKind,
  type GrowingAreaLayout,
  type PlanPlacement,
  type PlantingCropFamily,
  type PlantingRecord,
} from "@/lib/gardenWorkspace";

export function GardenWorkspace() {
  const [workspace, setWorkspace] = useState<GardenWorkspace>();
  const [isManagement, setIsManagement] = useState(false);
  const [isCareLog, setIsCareLog] = useState(false);
  const [managementFocus, setManagementFocus] = useState<
    "garden-management" | "planting-records" | "care-log"
  >();
  const [newGardenName, setNewGardenName] = useState("");
  const [renameGardenName, setRenameGardenName] = useState("");
  const [isGardenFormOpen, setIsGardenFormOpen] = useState(false);
  const [areaName, setAreaName] = useState("");
  const [areaKind, setAreaKind] = useState<GrowingAreaKind>("raised-bed");
  const [editingAreaDetailsId, setEditingAreaDetailsId] = useState<string>();
  const [isAreaFormOpen, setIsAreaFormOpen] = useState(false);
  const [editingLayoutId, setEditingLayoutId] = useState<string>();
  const [isPlantingFormOpen, setIsPlantingFormOpen] = useState(false);
  const [editingPlantingId, setEditingPlantingId] = useState<string>();
  const [plantingForm, setPlantingForm] =
    useState<PlantingForm>(emptyPlantingForm());
  const [isCareFormOpen, setIsCareFormOpen] = useState(false);
  const [editingCareEventId, setEditingCareEventId] = useState<string>();
  const [careForm, setCareForm] = useState<CareForm>(emptyCareForm());
  const [isLoaded, setIsLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const gardenManagementHeadingRef = useRef<HTMLHeadingElement>(null);
  const plantingRecordsHeadingRef = useRef<HTMLHeadingElement>(null);
  const careLogHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(GARDEN_WORKSPACE_STORAGE_KEY);
      const restored = readGardenWorkspace(saved);
      if (restored) {
        setWorkspace(restored);
        setMessage("Gardens restored from this browser.");
      } else if (saved) {
        setMessage("Saved garden data could not be loaded.");
      }
    } catch {
      setMessage("This browser's garden storage is unavailable.");
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || !workspace) return;
    try {
      window.localStorage.setItem(
        GARDEN_WORKSPACE_STORAGE_KEY,
        JSON.stringify(workspace),
      );
    } catch {
      setMessage("Changes could not be saved in this browser.");
    }
  }, [isLoaded, workspace]);

  const garden = workspace?.gardens.find(
    (candidate) => candidate.id === workspace.selectedGardenId,
  );
  const editingArea = garden?.growingAreas.find(
    (area) => area.id === editingLayoutId,
  );

  useEffect(() => {
    setRenameGardenName(garden?.name ?? "");
  }, [garden?.id]);

  useEffect(() => {
    if ((!isManagement && !isCareLog) || editingArea) return;
    const heading =
      managementFocus === "planting-records"
        ? plantingRecordsHeadingRef.current
        : managementFocus === "care-log"
          ? careLogHeadingRef.current
        : gardenManagementHeadingRef.current;
    heading?.focus();
  }, [editingArea, isCareLog, isManagement, managementFocus, garden?.id]);

  const updateGarden = (update: (current: Garden) => Garden) => {
    setWorkspace((current) =>
      current
        ? {
            ...current,
            gardens: current.gardens.map((candidate) =>
              candidate.id === current.selectedGardenId
                ? update(candidate)
                : candidate,
            ),
          }
        : current,
    );
  };

  const clearTransientState = () => {
    setNewGardenName("");
    setIsGardenFormOpen(false);
    setEditingLayoutId(undefined);
    setEditingAreaDetailsId(undefined);
    setIsAreaFormOpen(false);
    setIsPlantingFormOpen(false);
    setEditingPlantingId(undefined);
    setIsCareFormOpen(false);
    setEditingCareEventId(undefined);
  };

  const selectGarden = (gardenId: string) => {
    const nextGarden = workspace?.gardens.find(
      (candidate) => candidate.id === gardenId,
    );
    setWorkspace((current) =>
      current ? { ...current, selectedGardenId: gardenId } : current,
    );
    setRenameGardenName(nextGarden?.name ?? "");
    clearTransientState();
  };

  const openManagement = (
    target: "garden-management" | "planting-records" = "garden-management",
  ) => {
    setManagementFocus(target);
    setIsManagement(true);
    setIsCareLog(false);
    setRenameGardenName(garden?.name ?? "");
    clearTransientState();
  };

  const openCareLog = () => {
    setManagementFocus("care-log");
    setIsManagement(false);
    setIsCareLog(true);
    clearTransientState();
  };

  const returnToDashboard = () => {
    setIsManagement(false);
    setIsCareLog(false);
    setManagementFocus(undefined);
    clearTransientState();
  };

  const createFirstGarden = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newGardenName.trim();
    if (!name) return setMessage("Enter a garden name to continue.");
    setWorkspace(createGardenWorkspace(name));
    setNewGardenName("");
    setMessage("Garden created.");
  };

  const addGarden = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newGardenName.trim();
    if (!name) return setMessage("Enter a garden name to continue.");
    const newGarden = createGarden(name);
    setWorkspace((current) =>
      current
        ? {
            ...current,
            selectedGardenId: newGarden.id,
            gardens: [...current.gardens, newGarden],
          }
        : current,
    );
    setNewGardenName("");
    setRenameGardenName(newGarden.name);
    setIsGardenFormOpen(false);
    setMessage(`${name} created and selected.`);
  };

  const renameGarden = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = renameGardenName.trim();
    if (!name) return setMessage("Enter a garden name to continue.");
    updateGarden((current) => ({ ...current, name }));
    setRenameGardenName(name);
    setMessage("Garden name updated.");
  };

  const deleteGarden = () => {
    if (!workspace || !garden) return;
    const impact = `${garden.growingAreas.length} planting area${garden.growingAreas.length === 1 ? "" : "s"} and ${garden.plantings.length} planting record${garden.plantings.length === 1 ? "" : "s"}`;
    if (
      !window.confirm(
        `Delete ${garden.name}? This removes its ${impact} from this browser.`,
      )
    )
      return;

    const gardens = workspace.gardens.filter(
      (candidate) => candidate.id !== garden.id,
    );
    if (!gardens.length) {
      window.localStorage.removeItem(GARDEN_WORKSPACE_STORAGE_KEY);
      setWorkspace(undefined);
      setIsManagement(false);
      setRenameGardenName("");
      setMessage("Create a garden when you are ready.");
      return;
    }

    setWorkspace({ version: 6, selectedGardenId: gardens[0].id, gardens });
    setRenameGardenName(gardens[0].name);
    clearTransientState();
    setMessage(`${garden.name} deleted.`);
  };

  const loadDemo = () => {
    if (
      workspace &&
      !window.confirm(
        "Load the demo garden? This replaces gardens saved in this browser.",
      )
    )
      return;
    const demo = createDemoGardenWorkspace();
    setWorkspace(demo);
    setRenameGardenName(demo.gardens[0].name);
    clearTransientState();
    setMessage("Demo garden loaded.");
  };

  const openAreaForm = (area?: GrowingArea) => {
    setAreaName(area?.name ?? "");
    setAreaKind(area?.kind ?? "raised-bed");
    setEditingAreaDetailsId(area?.id);
    setIsAreaFormOpen(true);
  };

  const saveArea = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = areaName.trim();
    if (!garden || !name)
      return setMessage("Enter a planting-area name to continue.");

    updateGarden((current) => {
      if (editingAreaDetailsId) {
        return {
          ...current,
          growingAreas: current.growingAreas.map((area) =>
            area.id === editingAreaDetailsId
              ? { ...area, name, kind: areaKind }
              : area,
          ),
        };
      }
      const placement = defaultPlanPlacement(current.growingAreas.length);
      return {
        ...current,
        growingAreas: [
          ...current.growingAreas,
          {
            id: createId("area"),
            name,
            kind: areaKind,
            planPlacement: {
              ...placement,
              ...clampPlanPosition(placement, current.plan),
            },
          },
        ],
      };
    });
    const action = editingAreaDetailsId ? "updated" : "added";
    setAreaName("");
    setAreaKind("raised-bed");
    setEditingAreaDetailsId(undefined);
    setIsAreaFormOpen(false);
    setMessage(`${name} ${action}.`);
  };

  const deleteArea = (area: GrowingArea) => {
    if (!garden) return;
    const linkedPlantings = garden.plantings.filter(
      (planting) => planting.growingAreaId === area.id,
    );
    if (
      !window.confirm(
        `Delete ${area.name}? This removes the planting area and its ${linkedPlantings.length} planting record${linkedPlantings.length === 1 ? "" : "s"} from this browser. Care history stays in this garden.`,
      )
    )
      return;
    updateGarden((current) => ({
      ...current,
      growingAreas: current.growingAreas.filter(
        (candidate) => candidate.id !== area.id,
      ),
      plantings: current.plantings.filter(
        (planting) => planting.growingAreaId !== area.id,
      ),
      careEvents: current.careEvents.map((event) =>
        event.targetScope === "planting-area" && event.growingAreaId === area.id
          ? { ...event, targetAreaDeleted: true }
          : event.targetScope === "plant-group" &&
              linkedPlantings.some(
                (planting) => planting.id === event.plantingRecordId,
              )
            ? { ...event, targetPlantingRecordDeleted: true }
          : event,
      ),
    }));
    setMessage(`${area.name} deleted.`);
  };

  const updatePlan = (plan: GardenPlan) => {
    updateGarden((current) => ({
      ...current,
      plan,
      growingAreas: current.growingAreas.map((area) => ({
        ...area,
        planPlacement: {
          ...area.planPlacement,
          ...clampPlanPosition(area.planPlacement, plan),
        },
      })),
    }));
  };

  const updateAreaPlacement = (
    areaId: string,
    planPlacement: PlanPlacement,
  ) => {
    updateGarden((current) => ({
      ...current,
      growingAreas: current.growingAreas.map((area) =>
        area.id === areaId ? { ...area, planPlacement } : area,
      ),
    }));
  };

  const updateAreaLayout = (areaId: string, layout: GrowingAreaLayout) => {
    updateGarden((current) => ({
      ...current,
      growingAreas: current.growingAreas.map((area) =>
        area.id === areaId ? { ...area, layout } : area,
      ),
    }));
  };

  const openAddPlanting = () => {
    if (!garden?.growingAreas.length)
      return setMessage("Add a planting area before recording a planting.");
    setPlantingForm(emptyPlantingForm());
    setEditingPlantingId(undefined);
    setIsPlantingFormOpen(true);
  };

  const openEditPlanting = (planting: PlantingRecord) => {
    setPlantingForm({
      commonName: planting.commonName,
      cropFamily: planting.cropFamily,
      quantity: String(planting.quantity),
      plantingDate: planting.plantingDate,
      growingAreaId: planting.growingAreaId,
      isActive: planting.isActive,
    });
    setEditingPlantingId(planting.id);
    setIsPlantingFormOpen(true);
  };

  const savePlanting = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!garden) return;
    const commonName = plantingForm.commonName.trim();
    const quantity = Number(plantingForm.quantity);
    if (!commonName) return setMessage("Enter a plant name.");
    if (
      !plantingForm.cropFamily ||
      !plantingCropFamilies.includes(plantingForm.cropFamily)
    )
      return setMessage("Choose a crop family.");
    if (!Number.isInteger(quantity) || quantity < 1)
      return setMessage("Enter a whole-number quantity of at least 1.");
    if (!isCalendarDate(plantingForm.plantingDate))
      return setMessage("Enter a valid planting date.");
    if (
      !garden.growingAreas.some(
        (area) => area.id === plantingForm.growingAreaId,
      )
    )
      return setMessage("Choose an existing planting area.");

    const planting: PlantingRecord = {
      id: editingPlantingId ?? createId("planting"),
      commonName,
      cropFamily: plantingForm.cropFamily,
      quantity,
      plantingDate: plantingForm.plantingDate,
      growingAreaId: plantingForm.growingAreaId,
      isActive: plantingForm.isActive,
    };
    const action = editingPlantingId ? "updated" : "added";
    updateGarden((current) => ({
      ...current,
      plantings: editingPlantingId
        ? current.plantings.map((record) =>
            record.id === editingPlantingId ? planting : record,
          )
        : [...current.plantings, planting],
    }));
    setIsPlantingFormOpen(false);
    setEditingPlantingId(undefined);
    setMessage(`${commonName} ${action}.`);
  };

  const removePlanting = (planting: PlantingRecord) => {
    updateGarden((current) => ({
      ...current,
      plantings: current.plantings.filter(
        (record) => record.id !== planting.id,
      ),
      careEvents: current.careEvents.map((event) =>
        event.targetScope === "plant-group" &&
        event.plantingRecordId === planting.id
          ? { ...event, targetPlantingRecordDeleted: true }
          : event,
      ),
    }));
    setMessage(`${planting.commonName} removed.`);
  };

  const openAddCare = () => {
    setCareForm(emptyCareForm());
    setEditingCareEventId(undefined);
    setIsCareFormOpen(true);
  };

  const openEditCare = (event: CareEvent) => {
    setCareForm({
      type: event.type,
      date: event.date,
      note: event.note,
      targetScope: event.targetScope,
      growingAreaId: event.growingAreaId ?? "",
      plantingRecordId: event.plantingRecordId ?? "",
      fertilizerProduct: event.fertilizerProduct ?? "",
      fertilizerAmount: event.fertilizerAmount ? String(event.fertilizerAmount) : "",
      fertilizerUnit: event.fertilizerUnit ?? "",
    });
    setEditingCareEventId(event.id);
    setIsCareFormOpen(true);
  };

  const saveCare = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    if (!garden) return;
    if (!isCalendarDate(careForm.date))
      return setMessage("Enter a valid care date.");
    const previous = garden.careEvents.find(
      (event) => event.id === editingCareEventId,
    );
    const area = garden.growingAreas.find(
      (candidate) => candidate.id === careForm.growingAreaId,
    );
    const planting = garden.plantings.find(
      (candidate) => candidate.id === careForm.plantingRecordId,
    );
    if (
      careForm.targetScope === "planting-area" &&
      !area &&
      !(previous?.targetScope === "planting-area" &&
        previous.growingAreaId === careForm.growingAreaId)
    )
      return setMessage("Choose an existing planting area.");
    if (
      careForm.targetScope === "plant-group" &&
      !planting &&
      !(previous?.targetScope === "plant-group" &&
        previous.plantingRecordId === careForm.plantingRecordId)
    )
      return setMessage("Choose an existing plant group.");

    const fertilizerProduct = careForm.fertilizerProduct.trim();
    const fertilizerUnit = careForm.fertilizerUnit.trim();
    const hasFertilizerAmount = Boolean(careForm.fertilizerAmount.trim());
    const fertilizerAmount = Number(careForm.fertilizerAmount);
    if (
      careForm.type === "fertilizing" &&
      hasFertilizerAmount &&
      (!Number.isFinite(fertilizerAmount) || fertilizerAmount <= 0)
    )
      return setMessage("Enter a fertilizer amount greater than zero.");

    const event: CareEvent = {
      id: editingCareEventId ?? createId("care"),
      type: careForm.type,
      date: careForm.date,
      note: careForm.note.trim(),
      targetScope: careForm.targetScope,
      ...(careForm.targetScope === "planting-area"
        ? {
            growingAreaId: careForm.growingAreaId,
            growingAreaName: area?.name ?? previous?.growingAreaName,
            ...(area ? {} : { targetAreaDeleted: true }),
          }
        : {}),
      ...(careForm.targetScope === "plant-group"
        ? {
            plantingRecordId: careForm.plantingRecordId,
            plantingRecordName:
              planting
                ? plantGroupDisplayName(planting, garden)
                : previous?.plantingRecordName,
            ...(planting ? {} : { targetPlantingRecordDeleted: true }),
          }
        : {}),
      ...(careForm.type === "fertilizing"
        ? {
            ...(fertilizerProduct ? { fertilizerProduct } : {}),
            ...(hasFertilizerAmount ? { fertilizerAmount } : {}),
            ...(fertilizerUnit ? { fertilizerUnit } : {}),
          }
        : {}),
    };
    const action = editingCareEventId ? "updated" : "added";
    updateGarden((current) => ({
      ...current,
      careEvents: editingCareEventId
        ? current.careEvents.map((item) =>
            item.id === editingCareEventId ? event : item,
          )
        : [...current.careEvents, event],
    }));
    setIsCareFormOpen(false);
    setEditingCareEventId(undefined);
    setMessage(`${careForm.type === "watering" ? "Watering" : "Fertilizing"} event ${action}.`);
  };

  const removeCare = (event: CareEvent) => {
    updateGarden((current) => ({
      ...current,
      careEvents: current.careEvents.filter((item) => item.id !== event.id),
    }));
    setMessage("Care event removed.");
  };

  if (!isLoaded)
    return (
      <main className="operations-shell">
        <p className="loading-state">Loading garden workspace...</p>
      </main>
    );
  if (!workspace || !garden)
    return (
      <Onboarding
        newGardenName={newGardenName}
        message={message}
        onChangeName={setNewGardenName}
        onCreate={createFirstGarden}
        onLoadDemo={loadDemo}
      />
    );

  return (
    <main className="operations-shell">
      <header className="operations-header operations-header-active">
        <div>
          <p className="product-kicker">Sun-Aware Garden Planner</p>
          <h1>{garden.name}</h1>
        </div>
        <div className="header-actions">
          {isManagement || isCareLog ? (
            <button
              className="secondary-button"
              onClick={returnToDashboard}
              type="button"
            >
              Back to dashboard
            </button>
          ) : null}
        </div>
      </header>
      {!isManagement && !isCareLog ? (
        <Home
          garden={garden}
          gardens={workspace.gardens}
          onCareLog={openCareLog}
          onManage={() => openManagement()}
          onPlantingRecords={() => openManagement("planting-records")}
          onSelectGarden={selectGarden}
        />
      ) : isCareLog ? (
        <section className="operations-content">
          <CareLog
            garden={garden}
            editingCareEventId={editingCareEventId}
            form={careForm}
            headingRef={careLogHeadingRef}
            isFormOpen={isCareFormOpen}
            onAdd={openAddCare}
            onCancel={() => {
              setIsCareFormOpen(false);
              setEditingCareEventId(undefined);
            }}
            onEdit={openEditCare}
            onRemove={removeCare}
            onSave={saveCare}
            onSetForm={setCareForm}
          />
          <Status message={message} />
        </section>
      ) : (
        <section className="operations-content management-content">
          {editingArea ? (
            <GrowingAreaLayoutEditor
              area={editingArea}
              onBack={() => setEditingLayoutId(undefined)}
              onChange={(layout) => updateAreaLayout(editingArea.id, layout)}
            />
          ) : (
            <>
              <GardenManagement
                isGardenFormOpen={isGardenFormOpen}
                newGardenName={newGardenName}
                onAddGarden={addGarden}
                onDeleteGarden={deleteGarden}
                onOpenGardenForm={() => {
                  setNewGardenName("");
                  setIsGardenFormOpen(true);
                }}
                onRenameGarden={renameGarden}
                onSetGardenFormOpen={setIsGardenFormOpen}
                onSetNewGardenName={setNewGardenName}
                onSetRenameGardenName={setRenameGardenName}
                renameGardenName={renameGardenName}
                headingRef={gardenManagementHeadingRef}
              />
              <GardenPlanOverview
                editable
                growingAreas={garden.growingAreas}
                onEditLayout={setEditingLayoutId}
                onPlacementChange={updateAreaPlacement}
                onPlanChange={updatePlan}
                plan={garden.plan}
              />
              <PlantingAreas
                areaKind={areaKind}
                areaName={areaName}
                editingAreaDetailsId={editingAreaDetailsId}
                garden={garden}
                isAreaFormOpen={isAreaFormOpen}
                onDelete={deleteArea}
                onOpenForm={openAreaForm}
                onSave={saveArea}
                onSetAreaKind={setAreaKind}
                onSetAreaName={setAreaName}
                onSetFormOpen={setIsAreaFormOpen}
                onSetEditingId={setEditingAreaDetailsId}
                onSetLayout={setEditingLayoutId}
              />
              <PlantingManagement
                garden={garden}
                editingPlantingId={editingPlantingId}
                isOpen={isPlantingFormOpen}
                onAdd={openAddPlanting}
                onCancel={() => {
                  setIsPlantingFormOpen(false);
                  setEditingPlantingId(undefined);
                }}
                onEdit={openEditPlanting}
                onRemove={removePlanting}
                onSave={savePlanting}
                plantingForm={plantingForm}
                setPlantingForm={setPlantingForm}
                headingRef={plantingRecordsHeadingRef}
              />
            </>
          )}
          <Status message={message} />
        </section>
      )}
    </main>
  );
}

function Onboarding({
  newGardenName,
  message,
  onChangeName,
  onCreate,
  onLoadDemo,
}: {
  newGardenName: string;
  message: string;
  onChangeName: (name: string) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onLoadDemo: () => void;
}) {
  return (
    <main className="operations-shell">
      <header className="operations-header">
        <p className="product-kicker">Sun-Aware Garden Planner</p>
        <h1>Garden operations</h1>
      </header>
      <section
        className="garden-onboarding"
        aria-labelledby="create-garden-heading"
      >
        <div>
          <p className="section-eyebrow">Seasonal workspace</p>
          <h2 id="create-garden-heading">Create your garden</h2>
        </div>
        <form className="garden-form" onSubmit={onCreate}>
          <label htmlFor="garden-name">Garden name</label>
          <div className="inline-form-row">
            <input
              autoFocus
              id="garden-name"
              onChange={(event) => onChangeName(event.target.value)}
              placeholder="e.g. Home garden"
              required
              value={newGardenName}
            />
            <button className="primary-button" type="submit">
              Create garden
            </button>
          </div>
        </form>
        <button className="text-button" onClick={onLoadDemo} type="button">
          Load demo garden
        </button>
        <Status message={message} />
      </section>
    </main>
  );
}

function Home({
  garden,
  gardens,
  onCareLog,
  onManage,
  onPlantingRecords,
  onSelectGarden,
}: {
  garden: Garden;
  gardens: Garden[];
  onCareLog: () => void;
  onManage: () => void;
  onPlantingRecords: () => void;
  onSelectGarden: (gardenId: string) => void;
}) {
  return (
    <section className="operations-content garden-dashboard">
      <div className="dashboard-heading">
        <div>
          <p className="section-eyebrow">Garden dashboard</p>
          <h2>Choose a garden</h2>
        </div>
        <p>
          {gardens.length} {gardens.length === 1 ? "garden" : "gardens"}
        </p>
      </div>
      <div className="garden-card-grid">
        {gardens.map((candidate) => {
          const selected = candidate.id === garden.id;
          return (
            <button
              aria-label={`${candidate.name}${selected ? ", selected" : ""}`}
              aria-pressed={selected}
              className="garden-thumbnail-card"
              key={candidate.id}
              onClick={() => onSelectGarden(candidate.id)}
              type="button"
            >
              <GardenPlanOverview
                compact
                growingAreas={candidate.growingAreas}
                plan={candidate.plan}
              />
              <span className="garden-card-details">
                <strong>{candidate.name}</strong>
                <span>
                  {candidate.growingAreas.length} planting{" "}
                  {candidate.growingAreas.length === 1 ? "area" : "areas"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <section className="selected-garden-actions" aria-labelledby="selected-garden-heading">
        <div>
          <p className="section-eyebrow">Selected garden</p>
          <h2 id="selected-garden-heading">{garden.name}</h2>
        </div>
        <div className="dashboard-actions">
          <button className="primary-button" onClick={onCareLog} type="button">
            Care log
          </button>
          <button className="primary-button" onClick={onPlantingRecords} type="button">
            Planting records
          </button>
          <button className="secondary-button" onClick={onManage} type="button">
            Garden Management
          </button>
        </div>
      </section>
      <CareSummary garden={garden} />
    </section>
  );
}

function CareSummary({ garden }: { garden: Garden }) {
  const events = [...garden.careEvents]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 5);

  return (
    <section className="care-summary" aria-labelledby="care-summary-heading">
      <div>
        <p className="section-eyebrow">Care summary</p>
        <h2 id="care-summary-heading">Recent care</h2>
      </div>
      {events.length ? (
        <ul className="care-summary-list" aria-label="Recent care events">
          {events.map((event) => (
            <li key={event.id}>
              <span className={`care-event-type care-event-type-${event.type}`}>
                {event.type === "watering" ? "Watering" : "Fertilizing"}
              </span>
              <span>{event.date}</span>
              <span>{careTargetLabel(event)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="section-context">No care events yet.</p>
      )}
    </section>
  );
}

function CareLog({
  garden,
  editingCareEventId,
  form,
  headingRef,
  isFormOpen,
  onAdd,
  onCancel,
  onEdit,
  onRemove,
  onSave,
  onSetForm,
}: {
  garden: Garden;
  editingCareEventId?: string;
  form: CareForm;
  headingRef: RefObject<HTMLHeadingElement | null>;
  isFormOpen: boolean;
  onAdd: () => void;
  onCancel: () => void;
  onEdit: (event: CareEvent) => void;
  onRemove: (event: CareEvent) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onSetForm: (form: CareForm) => void;
}) {
  const historicalTarget = garden.careEvents.find(
    (event) => event.id === editingCareEventId,
  );
  const events = [...garden.careEvents].sort((left, right) =>
    right.date.localeCompare(left.date),
  );

  return (
    <section className="management-section care-log" aria-labelledby="care-log-heading">
      <div className="section-header">
        <div>
          <p className="section-eyebrow">Garden records</p>
          <h2 id="care-log-heading" ref={headingRef} tabIndex={-1}>
            Care log
          </h2>
          <p className="section-context">{garden.name}</p>
        </div>
        <button className="primary-button" onClick={onAdd} type="button">
          Add care event
        </button>
      </div>
      {isFormOpen ? (
        <form className="care-form" onSubmit={onSave}>
          <h3>{editingCareEventId ? "Edit care event" : "Add care event"}</h3>
          <div className="field">
            <label htmlFor="care-type">Care type</label>
            <select
              id="care-type"
              onChange={(event) =>
                onSetForm({ ...form, type: event.target.value as CareEventType })
              }
              value={form.type}
            >
              <option value="watering">Watering</option>
              <option value="fertilizing">Fertilizing</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="care-date">Date</label>
            <input
              autoFocus
              id="care-date"
              onChange={(event) => onSetForm({ ...form, date: event.target.value })}
              type="date"
              value={form.date}
            />
          </div>
          <div className="field">
            <label htmlFor="care-target">Target</label>
            <select
              id="care-target"
              onChange={(event) => {
                const [targetScope, targetId] = event.target.value.split(":");
                onSetForm({
                  ...form,
                  targetScope: targetScope as CareEventTargetScope,
                  growingAreaId:
                    targetScope === "planting-area" ? targetId : "",
                  plantingRecordId:
                    targetScope === "plant-group" ? targetId : "",
                });
              }}
              value={
                form.targetScope === "garden"
                  ? "garden"
                  : `${form.targetScope}:${form.targetScope === "planting-area" ? form.growingAreaId : form.plantingRecordId}`
              }
            >
              <option value="garden">Whole garden</option>
              <optgroup label="Planting areas">
                {historicalTarget?.targetScope === "planting-area" &&
                  historicalTarget.growingAreaId === form.growingAreaId &&
                  !garden.growingAreas.some(
                    (area) => area.id === form.growingAreaId,
                  ) ? (
                  <option value={`planting-area:${form.growingAreaId}`}>
                    Former planting area: {historicalTarget.growingAreaName}
                  </option>
                ) : null}
                {garden.growingAreas.map((area) => (
                  <option key={area.id} value={`planting-area:${area.id}`}>
                    {area.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Plant groups">
                {historicalTarget?.targetScope === "plant-group" &&
                  historicalTarget.plantingRecordId === form.plantingRecordId &&
                  !garden.plantings.some(
                    (planting) => planting.id === form.plantingRecordId,
                  ) ? (
                  <option value={`plant-group:${form.plantingRecordId}`}>
                    Former plant group: {historicalTarget.plantingRecordName}
                  </option>
                ) : null}
                {garden.plantings.map((planting) => (
                  <option key={planting.id} value={`plant-group:${planting.id}`}>
                    {plantGroupDisplayName(planting, garden)}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          {form.type === "fertilizing" ? (
            <>
              <div className="field">
                <label htmlFor="fertilizer-product">Fertilizer product (optional)</label>
                <input
                  id="fertilizer-product"
                  onChange={(event) => onSetForm({ ...form, fertilizerProduct: event.target.value })}
                  value={form.fertilizerProduct}
                />
              </div>
              <div className="field">
                <label htmlFor="fertilizer-amount">Fertilizer amount (optional)</label>
                <input
                  id="fertilizer-amount"
                  min="0.01"
                  onChange={(event) => onSetForm({ ...form, fertilizerAmount: event.target.value })}
                  step="any"
                  type="number"
                  value={form.fertilizerAmount}
                />
              </div>
              <div className="field">
                <label htmlFor="fertilizer-unit">Fertilizer unit (optional)</label>
                <input
                  id="fertilizer-unit"
                  onChange={(event) => onSetForm({ ...form, fertilizerUnit: event.target.value })}
                  placeholder="e.g. g, tbsp, mL"
                  value={form.fertilizerUnit}
                />
              </div>
            </>
          ) : null}
          <div className="field care-note-field">
            <label htmlFor="care-note">Note (optional)</label>
            <input
              id="care-note"
              onChange={(event) => onSetForm({ ...form, note: event.target.value })}
              value={form.note}
            />
          </div>
          <div className="form-actions">
            <button className="primary-button" type="submit">
              {editingCareEventId ? "Save care event" : "Add care event"}
            </button>
            <button className="secondary-button" onClick={onCancel} type="button">
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      {events.length ? (
        <ul className="care-event-list">
          {events.map((event) => (
            <li key={event.id}>
              <div>
                <strong>{event.type === "watering" ? "Watering" : "Fertilizing"}</strong>
                <p>
                  {event.date} · {careTargetLabel(event)}
                  {event.type === "fertilizing" && careFertilizerDetails(event)
                    ? ` · ${careFertilizerDetails(event)}`
                    : ""}
                  {event.note ? ` · ${event.note}` : ""}
                </p>
              </div>
              <div className="area-actions">
                <button className="text-button" onClick={() => onEdit(event)} type="button">
                  Edit
                </button>
                <button className="remove-button" onClick={() => onRemove(event)} type="button">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-areas">
          <h3>No care events yet</h3>
          <p>Record completed watering or fertilizing for {garden.name}.</p>
        </div>
      )}
    </section>
  );
}

function GardenManagement({
  isGardenFormOpen,
  newGardenName,
  onAddGarden,
  onDeleteGarden,
  onOpenGardenForm,
  onRenameGarden,
  onSetGardenFormOpen,
  onSetNewGardenName,
  onSetRenameGardenName,
  renameGardenName,
  headingRef,
}: {
  isGardenFormOpen: boolean;
  newGardenName: string;
  onAddGarden: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteGarden: () => void;
  onOpenGardenForm: () => void;
  onRenameGarden: (event: FormEvent<HTMLFormElement>) => void;
  onSetGardenFormOpen: (open: boolean) => void;
  onSetNewGardenName: (name: string) => void;
  onSetRenameGardenName: (name: string) => void;
  renameGardenName: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <section
      className="management-section"
      aria-labelledby="garden-management-heading"
    >
      <div className="section-header">
        <div>
          <p className="section-eyebrow">Garden setup</p>
          <h2 id="garden-management-heading" ref={headingRef} tabIndex={-1}>
            Garden Management
          </h2>
        </div>
        <button
          className="primary-button"
          onClick={onOpenGardenForm}
          type="button"
        >
          Add garden
        </button>
      </div>
      <form className="garden-form" onSubmit={onRenameGarden}>
        <label htmlFor="rename-garden">Garden name</label>
        <div className="inline-form-row">
          <input
            id="rename-garden"
            onChange={(event) => onSetRenameGardenName(event.target.value)}
            value={renameGardenName}
          />
          <button className="secondary-button" type="submit">
            Save garden name
          </button>
          <button
            className="remove-button"
            onClick={onDeleteGarden}
            type="button"
          >
            Delete garden
          </button>
        </div>
      </form>
      {isGardenFormOpen ? (
        <form className="garden-form" onSubmit={onAddGarden}>
          <label htmlFor="new-garden">New garden name</label>
          <div className="inline-form-row">
            <input
              autoFocus
              id="new-garden"
              onChange={(event) => onSetNewGardenName(event.target.value)}
              required
              value={newGardenName}
            />
            <button className="primary-button" type="submit">
              Create garden
            </button>
            <button
              className="secondary-button"
              onClick={() => onSetGardenFormOpen(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function PlantingAreas({
  areaKind,
  areaName,
  editingAreaDetailsId,
  garden,
  isAreaFormOpen,
  onDelete,
  onOpenForm,
  onSave,
  onSetAreaKind,
  onSetAreaName,
  onSetFormOpen,
  onSetEditingId,
  onSetLayout,
}: {
  areaKind: GrowingAreaKind;
  areaName: string;
  editingAreaDetailsId?: string;
  garden: Garden;
  isAreaFormOpen: boolean;
  onDelete: (area: GrowingArea) => void;
  onOpenForm: (area?: GrowingArea) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onSetAreaKind: (kind: GrowingAreaKind) => void;
  onSetAreaName: (name: string) => void;
  onSetFormOpen: (open: boolean) => void;
  onSetEditingId: (id: string | undefined) => void;
  onSetLayout: (id: string) => void;
}) {
  return (
    <section
      className="management-section"
      aria-labelledby="planting-areas-heading"
    >
      <div className="section-header">
        <div>
          <p className="section-eyebrow">Garden setup</p>
          <h2 id="planting-areas-heading">Planting areas</h2>
        </div>
        <button
          className="primary-button"
          onClick={() => onOpenForm()}
          type="button"
        >
          Add planting area
        </button>
      </div>
      {isAreaFormOpen ? (
        <form className="area-form" onSubmit={onSave}>
          <h3>
            {editingAreaDetailsId ? "Edit planting area" : "Add planting area"}
          </h3>
          <div className="field">
            <label htmlFor="planting-area-name">Planting-area name</label>
            <input
              autoFocus
              id="planting-area-name"
              onChange={(event) => onSetAreaName(event.target.value)}
              required
              value={areaName}
            />
          </div>
          <div className="field">
            <label htmlFor="planting-area-kind">Planting-area type</label>
            <select
              id="planting-area-kind"
              onChange={(event) =>
                onSetAreaKind(event.target.value as GrowingAreaKind)
              }
              value={areaKind}
            >
              {growingAreaKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {growingAreaKindLabels[kind]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button className="primary-button" type="submit">
              Save planting area
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                onSetFormOpen(false);
                onSetEditingId(undefined);
              }}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      {garden.growingAreas.length ? (
        <ul className="growing-area-list">
          {garden.growingAreas.map((area) => (
            <li className="growing-area-item" key={area.id}>
              <div>
                <h3>{area.name}</h3>
                <p>
                  {growingAreaKindLabels[area.kind]}
                  {area.layout
                    ? ` · ${area.layout.widthMeters} m long × ${area.layout.depthMeters} m wide`
                    : " · Layout not set up"}
                </p>
              </div>
              <div className="area-actions">
                <button
                  aria-label={`Edit ${area.name} details`}
                  className="text-button"
                  onClick={() => onOpenForm(area)}
                  type="button"
                >
                  Edit details
                </button>
                <button
                  aria-label={`${area.layout ? "Edit" : "Set up"} ${area.name} layout`}
                  className="text-button"
                  onClick={() => onSetLayout(area.id)}
                  type="button"
                >
                  {area.layout ? "Edit layout" : "Set up layout"}
                </button>
                <button
                  aria-label={`Delete ${area.name}`}
                  className="remove-button"
                  onClick={() => onDelete(area)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-areas">
          <h3>No planting areas yet</h3>
          <p>Add the spaces where you grow plants.</p>
        </div>
      )}
    </section>
  );
}

function PlantingManagement({
  garden,
  editingPlantingId,
  isOpen,
  onAdd,
  onCancel,
  onEdit,
  onRemove,
  onSave,
  plantingForm,
  setPlantingForm,
  headingRef,
}: {
  garden: Garden;
  editingPlantingId?: string;
  isOpen: boolean;
  onAdd: () => void;
  onCancel: () => void;
  onEdit: (planting: PlantingRecord) => void;
  onRemove: (planting: PlantingRecord) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  plantingForm: PlantingForm;
  setPlantingForm: (form: PlantingForm) => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <section
      className="plantings-section management-section"
      aria-labelledby="plantings-heading"
    >
      <div className="section-header">
        <div>
          <p className="section-eyebrow">Garden records</p>
          <h2 id="plantings-heading" ref={headingRef} tabIndex={-1}>
            Planting records
          </h2>
        </div>
        <button className="primary-button" onClick={onAdd} type="button">
          Add planting
        </button>
      </div>
      {isOpen ? (
        <form className="planting-form" onSubmit={onSave}>
          <h3>{editingPlantingId ? "Edit planting" : "Add planting"}</h3>
          <div className="field">
            <label htmlFor="planting-common-name">Plant name</label>
            <input
              autoFocus
              id="planting-common-name"
              onChange={(event) =>
                setPlantingForm({
                  ...plantingForm,
                  commonName: event.target.value,
                })
              }
              value={plantingForm.commonName}
            />
          </div>
          <div className="field">
            <label htmlFor="planting-crop-family">Crop family</label>
            <select
              id="planting-crop-family"
              onChange={(event) =>
                setPlantingForm({
                  ...plantingForm,
                  cropFamily: event.target.value as PlantingCropFamily,
                })
              }
              value={plantingForm.cropFamily}
            >
              <option value="">Choose a crop family</option>
              {plantingCropFamilies.map((family) => (
                <option key={family} value={family}>
                  {plantingCropFamilyLabels[family]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="planting-quantity">Quantity</label>
            <input
              id="planting-quantity"
              min="1"
              onChange={(event) =>
                setPlantingForm({
                  ...plantingForm,
                  quantity: event.target.value,
                })
              }
              step="1"
              type="number"
              value={plantingForm.quantity}
            />
          </div>
          <div className="field">
            <label htmlFor="planting-date">Planting date</label>
            <input
              id="planting-date"
              onChange={(event) =>
                setPlantingForm({
                  ...plantingForm,
                  plantingDate: event.target.value,
                })
              }
              type="date"
              value={plantingForm.plantingDate}
            />
          </div>
          <div className="field">
            <label htmlFor="planting-growing-area">Planting area</label>
            <select
              id="planting-growing-area"
              onChange={(event) =>
                setPlantingForm({
                  ...plantingForm,
                  growingAreaId: event.target.value,
                })
              }
              value={plantingForm.growingAreaId}
            >
              <option value="">Choose a planting area</option>
              {garden.growingAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>
          <label className="checkbox-field">
            <input
              checked={plantingForm.isActive}
              onChange={(event) =>
                setPlantingForm({
                  ...plantingForm,
                  isActive: event.target.checked,
                })
              }
              type="checkbox"
            />{" "}
            Active planting
          </label>
          <div className="form-actions">
            <button className="primary-button" type="submit">
              {editingPlantingId ? "Save planting" : "Add planting"}
            </button>
            <button
              className="secondary-button"
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      {garden.plantings.length ? (
        <div className="planting-groups">
          {garden.growingAreas.map((area) => {
            const records = garden.plantings.filter(
              (planting) => planting.growingAreaId === area.id,
            );
            return records.length ? (
              <section className="planting-group" key={area.id}>
                <h3>{area.name}</h3>
                <ul className="planting-list">
                  {records.map((planting) => (
                    <li key={planting.id}>
                      <div>
                        <strong>{planting.commonName}</strong>
                        <p>
                          {plantingCropFamilyLabels[planting.cropFamily]} ·{" "}
                          {planting.quantity} · {planting.plantingDate} ·{" "}
                          {planting.isActive ? "Active" : "Archived"}
                        </p>
                      </div>
                      <div className="area-actions">
                        <button
                          className="text-button"
                          onClick={() => onEdit(planting)}
                          type="button"
                        >
                          Edit planting
                        </button>
                        <button
                          className="remove-button"
                          onClick={() => onRemove(planting)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null;
          })}
        </div>
      ) : (
        <div className="empty-areas">
          <h3>No planting records yet</h3>
          <p>Record what you planted in each planting area.</p>
        </div>
      )}
    </section>
  );
}

function Status({ message }: { message: string }) {
  return (
    <p aria-live="polite" className="workspace-message" role="status">
      {message}
    </p>
  );
}

type PlantingForm = {
  commonName: string;
  cropFamily: PlantingCropFamily | "";
  quantity: string;
  plantingDate: string;
  growingAreaId: string;
  isActive: boolean;
};

type CareForm = {
  type: CareEventType;
  date: string;
  note: string;
  targetScope: CareEventTargetScope;
  growingAreaId: string;
  plantingRecordId: string;
  fertilizerProduct: string;
  fertilizerAmount: string;
  fertilizerUnit: string;
};

function emptyPlantingForm(): PlantingForm {
  return {
    commonName: "",
    cropFamily: "",
    quantity: "",
    plantingDate: "",
    growingAreaId: "",
    isActive: true,
  };
}

function emptyCareForm(): CareForm {
  return {
    type: "watering",
    date: "",
    note: "",
    targetScope: "garden",
    growingAreaId: "",
    plantingRecordId: "",
    fertilizerProduct: "",
    fertilizerAmount: "",
    fertilizerUnit: "",
  };
}

function careTargetLabel(event: CareEvent) {
  if (event.targetScope === "garden") return "Whole garden";
  if (event.targetScope === "plant-group")
    return event.targetPlantingRecordDeleted
      ? `Former plant group: ${event.plantingRecordName}`
      : event.plantingRecordName ?? "Plant group";
  return event.targetAreaDeleted
    ? `Former planting area: ${event.growingAreaName}`
    : event.growingAreaName ?? "Planting area";
}

function plantGroupDisplayName(planting: PlantingRecord, garden: Garden) {
  const area = garden.growingAreas.find(
    (candidate) => candidate.id === planting.growingAreaId,
  );
  return `${planting.commonName} · ${area?.name ?? "Planting area"}`;
}

function careFertilizerDetails(event: CareEvent) {
  const amount =
    event.fertilizerAmount === undefined
      ? undefined
      : `${event.fertilizerAmount}${event.fertilizerUnit ? ` ${event.fertilizerUnit}` : ""}`;
  return [
    event.fertilizerProduct,
    amount,
    amount ? undefined : event.fertilizerUnit,
  ]
    .filter(Boolean)
    .join(" · ");
}

function isCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function createId(prefix: string) {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}
