export type Point = { x: number; y: number };

export type YardObjectKind = "house" | "tree" | "fence" | "planting-bed";
export type DrawingTool = "select" | YardObjectKind;

export type YardObject = {
  id: string;
  kind: YardObjectKind;
  x: number;
  y: number;
  width: number;
  depth: number;
  obstacleHeightMeters?: number;
};

export type YardProject = {
  version: 2;
  location: string;
  date: string;
  referenceGrid: { widthMeters: number; depthMeters: number };
  northBearingDegrees: number;
  boundary: Point[];
  objects: YardObject[];
};

export type LegacyYardElement = {
  id: string;
  kind: "yard" | YardObjectKind;
  x: number;
  y: number;
  width: number;
  height: number;
  obstacleHeightMeters?: number;
};

export type LegacyYardProject = { location: string; date: string; elements: LegacyYardElement[] };
export type SunZone = { label: string; minHours: number; maxHours: number };
