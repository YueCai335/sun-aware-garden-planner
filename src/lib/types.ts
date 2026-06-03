export type Point = {
  x: number;
  y: number;
};

export type ShapeKind = "yard" | "house" | "tree" | "fence" | "planting-bed";

export type YardShape = {
  id: string;
  kind: ShapeKind;
  points: Point[];
  heightMeters?: number;
};

export type SunZone = {
  label: string;
  minHours: number;
  maxHours: number;
};
