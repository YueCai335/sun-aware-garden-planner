"use client";

import { Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

import type { DrawingTool, Point, YardObject, YardObjectKind } from "@/lib/types";

type Corner = "nw" | "ne" | "se" | "sw";
type KonvaPointerEvent = KonvaEventObject<PointerEvent | DragEvent>;
export type YardCanvasProps = {
  grid: { widthMeters: number; depthMeters: number };
  boundary: Point[];
  objects: YardObject[];
  northBearingDegrees: number;
  selectedId?: string;
  selectedVertexIndex?: number;
  tool: DrawingTool;
  onAdd: (kind: YardObjectKind, point: Point) => void;
  onMove: (id: string, point: Point) => void;
  onResize: (id: string, corner: Corner, point: Point) => void;
  onDelete: (id: string) => void;
  onSelect: (id?: string) => void;
  onMoveBoundaryVertex: (index: number, point: Point) => void;
  onSelectVertex: (index: number) => void;
};

const stageSize = { width: 900, height: 640 };
const origin = { x: 30, y: 40 };
const labels: Record<YardObjectKind, string> = { house: "House", tree: "Tree", fence: "Fence", "planting-bed": "Planting bed" };
const styles: Record<YardObjectKind, { fill: string; stroke: string }> = {
  house: { fill: "rgba(110, 92, 72, 0.72)", stroke: "#4b3e31" }, tree: { fill: "rgba(46, 112, 60, 0.62)", stroke: "#295a35" },
  fence: { fill: "rgba(102, 76, 50, 0.7)", stroke: "#654321" }, "planting-bed": { fill: "rgba(245, 194, 85, 0.42)", stroke: "#c18519" }
};

export function YardCanvasClient(props: YardCanvasProps) {
  const { grid, boundary, objects, northBearingDegrees, selectedId, selectedVertexIndex, tool, onAdd, onMove, onResize, onDelete, onSelect, onMoveBoundaryVertex, onSelectVertex } = props;
  const scale = Math.min(840 / grid.widthMeters, 560 / grid.depthMeters);
  const toPixels = (point: Point) => ({ x: origin.x + point.x * scale, y: origin.y + point.y * scale });
  const toMetres = (event: KonvaPointerEvent): Point => {
    const stage = (event.target as unknown as { getStage?: () => { getPointerPosition: () => Point | null } }).getStage?.();
    const position = stage?.getPointerPosition();
    const nativeEvent = (event.evt ?? event) as PointerEvent;
    const x = position?.x ?? nativeEvent?.clientX ?? 0;
    const y = position?.y ?? nativeEvent?.clientY ?? 0;
    return { x: clamp((x - origin.x) / scale, 0, grid.widthMeters), y: clamp((y - origin.y) / scale, 0, grid.depthMeters) };
  };
  const stop = (event: KonvaPointerEvent) => { event.cancelBubble = true; event.evt?.stopPropagation(); (event as unknown as { stopPropagation?: () => void }).stopPropagation?.(); };
  const boundaryPoints = boundary.flatMap((point) => { const pixels = toPixels(point); return [pixels.x, pixels.y]; });

  return <section className="panel canvas-panel" aria-label="Yard editor drawing plane">
    <div className="compass" aria-label={`North bearing ${northBearingDegrees} degrees`}>
      <span className="compass-arrow" style={{ transform: `rotate(${northBearingDegrees}deg)` }}>↑</span><strong>N</strong><small>{northBearingDegrees}°</small>
    </div>
    <Stage aria-label={tool === "select" ? "Select and edit yard objects" : `Click the reference grid to add a ${labels[tool]}`} className="yard-stage" data-yard-stage="true" height={stageSize.height} onPointerDown={(event) => {
      if (tool === "select") { onSelect(undefined); return; }
      onAdd(tool, toMetres(event));
    }} width={stageSize.width}>
      <Layer>
        {Array.from({ length: Math.floor(grid.widthMeters) + 1 }, (_, index) => <Line key={`vertical-${index}`} points={[origin.x + index * scale, origin.y, origin.x + index * scale, origin.y + grid.depthMeters * scale]} stroke="rgba(47, 107, 63, 0.16)" strokeWidth={1} />)}
        {Array.from({ length: Math.floor(grid.depthMeters) + 1 }, (_, index) => <Line key={`horizontal-${index}`} points={[origin.x, origin.y + index * scale, origin.x + grid.widthMeters * scale, origin.y + index * scale]} stroke="rgba(47, 107, 63, 0.16)" strokeWidth={1} />)}
        <Rect height={grid.depthMeters * scale} listening={false} stroke="#7b856e" strokeWidth={2} width={grid.widthMeters * scale} x={origin.x} y={origin.y} />
        <Line closed fill="rgba(78, 142, 86, 0.18)" listening={false} points={boundaryPoints} stroke="#356b41" strokeWidth={3} />
        <Text fill="#1d4f2b" fontSize={15} fontStyle="bold" listening={false} text="Yard boundary" x={origin.x + 12} y={origin.y + 12} />
        {objects.map((object) => <YardObjectShape key={object.id} object={object} scale={scale} selected={object.id === selectedId} toPixels={toPixels} toMetres={toMetres} onMove={onMove} onResize={onResize} onDelete={onDelete} onSelect={onSelect} stop={stop} />)}
        {boundary.map((vertex, index) => { const pixels = toPixels(vertex); return <Circle fill={index === selectedVertexIndex ? "#d36b2f" : "#ffffff"} key={`vertex-${index}`} onDragEnd={(event) => onMoveBoundaryVertex(index, toMetres(event))} onPointerDown={(event) => { stop(event); onSelectVertex(index); }} radius={index === selectedVertexIndex ? 8 : 6} stroke="#1d4f2b" strokeWidth={2} draggable x={pixels.x} y={pixels.y} />; })}
        <Text fill="#374034" fontSize={14} text={`Reference grid · ${grid.widthMeters} m × ${grid.depthMeters} m`} x={origin.x} y={12} />
      </Layer>
    </Stage>
  </section>;
}

function YardObjectShape({ object, scale, selected, toPixels, toMetres, onMove, onResize, onDelete, onSelect, stop }: {
  object: YardObject; scale: number; selected: boolean; toPixels: (point: Point) => Point; toMetres: (event: KonvaPointerEvent) => Point;
  onMove: (id: string, point: Point) => void; onResize: (id: string, corner: Corner, point: Point) => void; onDelete: (id: string) => void; onSelect: (id: string) => void; stop: (event: KonvaPointerEvent) => void;
}) {
  const position = toPixels(object), width = object.width * scale, depth = object.depth * scale, style = styles[object.kind];
  const select = (event: KonvaPointerEvent) => { stop(event); onSelect(object.id); };
  const drag = (event: KonvaPointerEvent) => onMove(object.id, nodeMetres(event, toMetres, scale, object.kind === "tree" ? -width / 2 : 0, object.kind === "tree" ? -depth / 2 : 0));
  return <Group>
    {object.kind === "tree" ? <Circle fill={style.fill} onDragEnd={drag} onPointerDown={select} radius={Math.min(width, depth) / 2} stroke={selected ? "#1d4f2b" : style.stroke} strokeWidth={selected ? 4 : 2} draggable x={position.x + width / 2} y={position.y + depth / 2} /> : <Rect data-testid={`yard-object-${object.id}`} fill={style.fill} height={depth} onDragEnd={drag} onPointerDown={select} stroke={selected ? "#1d4f2b" : style.stroke} strokeWidth={selected ? 4 : 2} width={width} x={position.x} y={position.y} draggable />}
    <Text fill="#263026" fontSize={14} listening={false} text={`${labels[object.kind]} ${object.width} m × ${object.depth} m${object.obstacleHeightMeters ? ` · ${object.obstacleHeightMeters} m high` : ""}`} x={position.x + 6} y={position.y + 6} />
    {selected ? <ResizeControls object={object} position={position} width={width} depth={depth} scale={scale} toMetres={toMetres} onResize={onResize} stop={stop} /> : null}
    {selected ? <DeleteControl object={object} position={position} width={width} onDelete={onDelete} stop={stop} /> : null}
  </Group>;
}

function DeleteControl({ object, position, width, onDelete, stop }: { object: YardObject; position: Point; width: number; onDelete: (id: string) => void; stop: (event: KonvaPointerEvent) => void }) {
  const x = position.x + width - 10, y = position.y + 10;
  return <Group>
    <Circle aria-label={`Delete ${labels[object.kind]}`} fill="#b44d3a" onPointerDown={(event) => { stop(event); onDelete(object.id); }} radius={10} stroke="#fffdf8" strokeWidth={2} x={x} y={y} />
    <Text align="center" fill="#ffffff" fontSize={16} listening={false} text="×" verticalAlign="middle" width={20} x={x - 10} y={y - 10} />
  </Group>;
}

function ResizeControls({ object, position, width, depth, scale, toMetres, onResize, stop }: { object: YardObject; position: Point; width: number; depth: number; scale: number; toMetres: (event: KonvaPointerEvent) => Point; onResize: (id: string, corner: Corner, point: Point) => void; stop: (event: KonvaPointerEvent) => void }) {
  const corners: Array<[Corner, number, number]> = [["nw", position.x, position.y], ["ne", position.x + width, position.y], ["se", position.x + width, position.y + depth], ["sw", position.x, position.y + depth]];
  return <>{corners.map(([corner, x, y]) => <Rect aria-label={`Resize ${labels[object.kind]} ${corner}`} fill="#ffffff" height={12} key={corner} onDragEnd={(event) => onResize(object.id, corner, nodeMetres(event, toMetres, scale, 6, 6))} onPointerDown={stop} stroke="#1d4f2b" strokeWidth={2} width={12} x={x - 6} y={y - 6} draggable />)}</>;
}

function nodeMetres(event: KonvaPointerEvent, fallback: (event: KonvaPointerEvent) => Point, scale: number, offsetX: number, offsetY: number) {
  const target = event.target as unknown as { x?: () => number; y?: () => number };
  const x = target.x?.(), y = target.y?.();
  return typeof x === "number" && typeof y === "number" ? { x: (x + offsetX - origin.x) / scale, y: (y + offsetY - origin.y) / scale } : fallback(event);
}

function clamp(value: number, min: number, max: number) { return Math.min(Math.max(value, min), max); }
