"use client";

import { useEffect, useRef, useState } from "react";

import type { DrawingTool, Point, ShapeKind, YardElement } from "@/lib/types";

type YardCanvasProps = {
  elements: YardElement[];
  selectedId?: string;
  tool: DrawingTool;
  onAdd: (kind: ShapeKind, point: Point) => void;
  onMove: (id: string, point: Point) => void;
  onSelect: (id?: string) => void;
};

export function YardCanvas({ elements, selectedId, tool, onAdd, onMove, onSelect }: YardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ id: string; offset: Point } | undefined>(undefined);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      setCanvasSize({ width: bounds.width, height: bounds.height });
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0 || canvasSize.height === 0) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const scale = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * scale;
    canvas.height = canvasSize.height * scale;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    drawYard(context, canvasSize.width, canvasSize.height, elements, selectedId);
  }, [canvasSize, elements, selectedId]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = getPoint(event);
    if (tool !== "select") {
      onAdd(tool, point);
      return;
    }

    const target = [...elements].reverse().find((element) => containsPoint(element, point));
    onSelect(target?.id);
    if (target) {
      dragRef.current = {
        id: target.id,
        offset: { x: point.x - target.x, y: point.y - target.y }
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    const element = drag && elements.find((item) => item.id === drag.id);
    if (!drag || !element) {
      return;
    }

    const point = getPoint(event);
    onMove(drag.id, {
      x: clamp(point.x - drag.offset.x, 0, 100 - element.width),
      y: clamp(point.y - drag.offset.y, 0, 100 - element.height)
    });
  };

  const stopDragging = (event: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = undefined;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <section className="panel canvas-panel" aria-label="Yard drawing canvas">
      <canvas
        aria-label={tool === "select" ? "Select and move yard elements" : `Click to add a ${tool}`}
        className="yard-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        ref={canvasRef}
      />
    </section>
  );
}

function drawYard(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  elements: YardElement[],
  selectedId?: string
) {
  context.clearRect(0, 0, width, height);

  if (elements.length === 0) {
    context.fillStyle = "#586152";
    context.font = "16px system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText("Choose a drawing tool and click here to add your first yard element.", width / 2, height / 2);
    return;
  }

  elements.forEach((element) => drawElement(context, element, width, height, element.id === selectedId));
}

function drawElement(
  context: CanvasRenderingContext2D,
  element: YardElement,
  canvasWidth: number,
  canvasHeight: number,
  selected: boolean
) {
  const x = (element.x / 100) * canvasWidth;
  const y = (element.y / 100) * canvasHeight;
  const width = (element.width / 100) * canvasWidth;
  const height = (element.height / 100) * canvasHeight;
  const style = styles[element.kind];

  context.fillStyle = style.fill;
  context.strokeStyle = selected ? "#1d4f2b" : style.stroke;
  context.lineWidth = selected ? 4 : 2;
  context.beginPath();
  if (element.kind === "tree") {
    context.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
  } else {
    context.roundRect(x, y, width, height, element.kind === "fence" ? 2 : 6);
  }
  context.fill();
  context.stroke();

  context.fillStyle = "#263026";
  context.font = "14px system-ui, sans-serif";
  context.textAlign = "left";
  context.fillText(labels[element.kind], x + 10, y + Math.min(25, height / 2 + 5));
}

const labels: Record<ShapeKind, string> = {
  yard: "Yard boundary",
  house: "House",
  tree: "Tree",
  fence: "Fence",
  "planting-bed": "Planting bed"
};

const styles: Record<ShapeKind, { fill: string; stroke: string }> = {
  yard: { fill: "rgba(78, 142, 86, 0.16)", stroke: "#356b41" },
  house: { fill: "rgba(110, 92, 72, 0.65)", stroke: "#4b3e31" },
  tree: { fill: "rgba(46, 112, 60, 0.55)", stroke: "#295a35" },
  fence: { fill: "rgba(102, 76, 50, 0.65)", stroke: "#654321" },
  "planting-bed": { fill: "rgba(245, 194, 85, 0.32)", stroke: "#c18519" }
};

function containsPoint(element: YardElement, point: Point) {
  return (
    point.x >= element.x &&
    point.x <= element.x + element.width &&
    point.y >= element.y &&
    point.y <= element.y + element.height
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
