export type Point = {
  x: number;
  y: number;
};

export type ShapeKind = "yard" | "house" | "tree" | "fence" | "planting-bed";

export type DrawingTool = "select" | ShapeKind;

export type YardElement = {
  id: string;
  kind: ShapeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  obstacleHeightMeters?: number;
};

export type YardProject = {
  location: string;
  date: string;
  elements: YardElement[];
};

export type SunZone = {
  label: string;
  minHours: number;
  maxHours: number;
};
