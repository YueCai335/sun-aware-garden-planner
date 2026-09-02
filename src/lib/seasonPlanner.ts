import {
  plantingCropFamilyLabels,
  type PlantingCropFamily,
} from "@/lib/gardenWorkspace";

type PairingPlant = {
  id: string;
  commonName: string;
  plantType?: string;
  cropFamily: PlantingCropFamily;
};

export type PairingNote = {
  kind: "helpful" | "space" | "caution";
  message: string;
  sourceLabel: string;
  sourceUrl: string;
};

const companionSource = {
  sourceLabel: "University of Minnesota Extension",
  sourceUrl: "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/companion-planting-in-home-gardens",
};

const familySource = {
  sourceLabel: "Penn State Extension",
  sourceUrl: "https://extension.psu.edu/plant-rotation-in-the-garden-based-on-plant-families",
};

export function companionNotes<T extends PairingPlant>(plantings: T[]): PairingNote[] {
  const names = plantings.map((planting) => normalizePlantName(planting));
  const notes: PairingNote[] = [];

  if (hasPlant(names, ["tomato", "番茄"]) && hasPlant(names, ["basil", "罗勒"])) {
    notes.push({
      kind: "helpful",
      message: "Tomato + basil: research-supported companion note for reducing some tomato pest pressure.",
      ...companionSource,
    });
  }
  if (hasPlant(names, ["tomato", "番茄"]) && hasPlant(names, ["lettuce", "莴笋", "生菜"])) {
    notes.push({
      kind: "space",
      message: "Tomato + lettuce: lettuce can use early-season space before tomato canopy fills in.",
      ...companionSource,
    });
  }

  const families = new Map<PlantingCropFamily, Set<string>>();
  for (const planting of plantings) {
    if (planting.cropFamily === "other") continue;
    const namesInFamily = families.get(planting.cropFamily) ?? new Set<string>();
    namesInFamily.add(planting.commonName);
    families.set(planting.cropFamily, namesInFamily);
  }
  for (const [family, namesInFamily] of families) {
    if (namesInFamily.size < 2) continue;
    notes.push({
      kind: "caution",
      message: `${plantingCropFamilyLabels[family]} crops share pest and disease pressure. Keep spacing and monitoring in view.`,
      ...familySource,
    });
  }

  return notes;
}

function normalizePlantName(planting: PairingPlant) {
  return `${planting.plantType ?? ""} ${planting.commonName}`.toLocaleLowerCase();
}

function hasPlant(names: string[], terms: string[]) {
  return names.some((name) => terms.some((term) => name.includes(term)));
}
