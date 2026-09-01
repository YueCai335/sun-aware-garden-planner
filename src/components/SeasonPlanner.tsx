"use client";

import { useEffect, useState } from "react";

import {
  growingAreaKindLabels,
  plantingCropFamilies,
  plantingCropFamilyLabels,
  type Garden,
  type PlantingCropFamily,
} from "@/lib/gardenWorkspace";
import {
  loadRotationGuidance,
  type RotationGuidance,
} from "@/lib/gardenWorkspaceApi";

type GuidanceByArea = Record<string, RotationGuidance>;

export function SeasonPlanner({
  gardens,
  isServerBacked,
  workspaceId,
  onRecordPlant,
}: {
  gardens: Garden[];
  isServerBacked: boolean;
  workspaceId?: string;
  onRecordPlant: (
    gardenId: string,
    growingAreaId: string,
    cropFamily?: PlantingCropFamily,
  ) => void;
}) {
  const [gardenFilter, setGardenFilter] = useState("all");
  const [plannedFamilies, setPlannedFamilies] = useState<
    Record<string, PlantingCropFamily | "">
  >({});
  const [guidanceByArea, setGuidanceByArea] = useState<GuidanceByArea>({});
  const [guidanceState, setGuidanceState] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const planningDate = nextSeasonDate();
  const visibleGardens =
    gardenFilter === "all"
      ? gardens
      : gardens.filter((garden) => garden.id === gardenFilter);

  useEffect(() => {
    const filteredGardens =
      gardenFilter === "all"
        ? gardens
        : gardens.filter((garden) => garden.id === gardenFilter);
    const planningAreas = filteredGardens.flatMap((garden) =>
      garden.growingAreas.map((area) => ({ garden, area })),
    );
    if (!isServerBacked || !workspaceId || !planningAreas.length) {
      setGuidanceByArea({});
      setGuidanceState("idle");
      return;
    }

    let active = true;
    setGuidanceState("loading");
    void Promise.all(
      planningAreas.map(async ({ garden, area }) => [
        guidanceKey(garden.id, area.id),
        await loadRotationGuidance(workspaceId, garden.id, {
          growingAreaId: area.id,
          cropFamily: plannedFamilies[guidanceKey(garden.id, area.id)] || "other",
          plantingDate: planningDate,
        }),
      ] as const),
    )
      .then((entries) => {
        if (!active) return;
        setGuidanceByArea(Object.fromEntries(entries));
        setGuidanceState("idle");
      })
      .catch(() => {
        if (!active) return;
        setGuidanceByArea({});
        setGuidanceState("error");
      });

    return () => {
      active = false;
    };
  }, [gardenFilter, gardens, isServerBacked, plannedFamilies, planningDate, workspaceId]);

  return (
    <section className="operations-content season-planner" aria-labelledby="season-planner-heading">
      <div className="section-header">
        <div>
          <p className="section-eyebrow">Garden planning</p>
          <h2 id="season-planner-heading">Next season planner</h2>
          <p className="section-context">
            Review every garden's previous three seasons and prepare next season's plant records.
          </p>
        </div>
        <div className="season-filter">
          <label htmlFor="season-garden-filter">Garden</label>
          <select
            id="season-garden-filter"
            onChange={(event) => setGardenFilter(event.target.value)}
            value={gardenFilter}
          >
            <option value="all">All gardens</option>
            {gardens.map((garden) => (
              <option key={garden.id} value={garden.id}>{garden.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!isServerBacked ? (
        <div className="season-planner-empty">
          <h3>Import gardens to PostgreSQL first</h3>
          <p>Next season planner uses saved planting history from PostgreSQL.</p>
        </div>
      ) : guidanceState === "error" ? (
        <div className="season-planner-empty">
          <h3>Season planning is temporarily unavailable</h3>
          <p>Check the local API and PostgreSQL service, then return to the dashboard and try again.</p>
        </div>
      ) : !visibleGardens.some((garden) => garden.growingAreas.length) ? (
        <div className="season-planner-empty">
          <h3>Add a planting area first</h3>
          <p>Each rotation decision belongs to a raised bed, in-ground area, container group, or greenhouse shelf.</p>
        </div>
      ) : (
        <div className="season-planner-grid">
          {visibleGardens.flatMap((garden) =>
            garden.growingAreas.map((area) => {
              const key = guidanceKey(garden.id, area.id);
              const guidance = guidanceByArea[key];
              const plannedFamily = plannedFamilies[key] ?? "";
              return (
                <article className="season-area-card" key={key}>
                  <div>
                    <p className="section-eyebrow">{garden.name} · {growingAreaKindLabels[area.kind]}</p>
                    <h3>{area.name}</h3>
                  </div>
                  {guidanceState === "loading" && !guidance ? (
                    <p className="section-context">Loading three-season history...</p>
                  ) : guidance ? (
                    <>
                      <p className="season-history">
                        <strong>Recent history</strong>
                        <span>{historySummary(guidance)}</span>
                      </p>
                      {guidance.automatedWarningSupported ? (
                        <>
                          <label className="field" htmlFor={`planned-family-${key}`}>
                            Planned crop family
                            <select
                              id={`planned-family-${key}`}
                              onChange={(event) =>
                                setPlannedFamilies((current) => ({
                                  ...current,
                                  [key]: event.target.value as PlantingCropFamily,
                                }))
                              }
                              value={plannedFamily}
                            >
                              <option value="">Choose a crop family</option>
                              {plantingCropFamilies
                                .filter((family) => family !== "other")
                                .map((family) => (
                                  <option key={family} value={family}>
                                    {plantingCropFamilyLabels[family]}
                                  </option>
                                ))}
                            </select>
                          </label>
                          {plannedFamily && guidance.warning ? (
                            <p className="rotation-warning">
                              Rotation alert: {plantingCropFamilyLabels[guidance.warning.cropFamily]} appears in this area&apos;s recent history. You can still record this planting.
                            </p>
                          ) : plannedFamily ? (
                            <p className="season-clear">No matching crop family appears in this area's previous three seasons.</p>
                          ) : (
                            <p className="section-context">Choose a crop family to check it against this area's recent history.</p>
                          )}
                          <p className="season-candidates">
                            <strong>Rotation-friendly families</strong>
                            <span>{familyList(guidance.rotationFriendlyCropFamilies)}</span>
                          </p>
                        </>
                      ) : (
                        <p className="section-context">This area keeps planting history. Automated rotation guidance currently focuses on soil-based growing areas.</p>
                      )}
                    </>
                  ) : null}
                  <button
                    className="secondary-button"
                    disabled={guidanceState === "loading"}
                    onClick={() => onRecordPlant(garden.id, area.id, plannedFamily || undefined)}
                    type="button"
                  >
                    Record a plant
                  </button>
                </article>
              );
            }),
          )}
        </div>
      )}
    </section>
  );
}

function guidanceKey(gardenId: string, areaId: string) {
  return `${gardenId}:${areaId}`;
}

function nextSeasonDate() {
  return `${new Date().getFullYear() + 1}-05-20`;
}

function historySummary(guidance: RotationGuidance) {
  if (!guidance.history.length) return "No plantings in the previous three seasons.";
  return guidance.history
    .map((planting) => `${planting.season}: ${planting.commonName} (${plantingCropFamilyLabels[planting.cropFamily]})`)
    .join(" · ");
}

function familyList(families: PlantingCropFamily[]) {
  return families.length
    ? families.map((family) => plantingCropFamilyLabels[family]).join(", ")
    : "No family candidates are available from this three-season history.";
}
