import type { Point } from "@/lib/types";

const EPSILON = 0.000001;

export function validateBoundary(
  points: Point[],
  grid: { widthMeters: number; depthMeters: number }
): string | undefined {
  if (points.length < 3) return "A yard boundary needs at least three vertices.";
  if (points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.y < 0 || point.x > grid.widthMeters || point.y > grid.depthMeters)) return "Boundary vertices must stay inside the reference grid.";
  for (let index = 0; index < points.length; index += 1) {
    const nextIndex = (index + 1) % points.length;
    if (samePoint(points[index], points[nextIndex])) return "Boundary vertices cannot overlap.";
    for (let otherIndex = index + 1; otherIndex < points.length; otherIndex += 1) {
      const otherNextIndex = (otherIndex + 1) % points.length;
      if (nextIndex === otherIndex || otherNextIndex === index) continue;
      if (segmentsIntersect(points[index], points[nextIndex], points[otherIndex], points[otherNextIndex])) return "Boundary edges cannot cross. Move the vertex to keep one simple yard outline.";
    }
  }
  if (Math.abs(polygonArea(points)) < EPSILON) return "A yard boundary needs an enclosed area.";
}

export function polygonArea(points: Point[]) {
  return points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length];
    return area + point.x * next.y - next.x * point.y;
  }, 0) / 2;
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point) {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  if (Math.abs(abC) < EPSILON && onSegment(a, b, c)) return true;
  if (Math.abs(abD) < EPSILON && onSegment(a, b, d)) return true;
  if (Math.abs(cdA) < EPSILON && onSegment(c, d, a)) return true;
  if (Math.abs(cdB) < EPSILON && onSegment(c, d, b)) return true;
  return (abC > 0) !== (abD > 0) && (cdA > 0) !== (cdB > 0);
}

function orientation(a: Point, b: Point, c: Point) { return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x); }
function onSegment(a: Point, b: Point, point: Point) { return point.x >= Math.min(a.x, b.x) - EPSILON && point.x <= Math.max(a.x, b.x) + EPSILON && point.y >= Math.min(a.y, b.y) - EPSILON && point.y <= Math.max(a.y, b.y) + EPSILON; }
function samePoint(a: Point, b: Point) { return Math.abs(a.x - b.x) < EPSILON && Math.abs(a.y - b.y) < EPSILON; }
