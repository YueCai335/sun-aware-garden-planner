"use client";

import { useEffect, useRef } from "react";

export function YardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const bounds = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = bounds.width * scale;
    canvas.height = bounds.height * scale;
    context.scale(scale, scale);

    drawStarterScene(context, bounds.width, bounds.height);
  }, []);

  return (
    <section className="panel canvas-panel" aria-label="Yard drawing canvas">
      <canvas ref={canvasRef} className="yard-canvas" />
    </section>
  );
}

function drawStarterScene(
  context: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  context.clearRect(0, 0, width, height);

  context.fillStyle = "rgba(78, 142, 86, 0.16)";
  context.strokeStyle = "#356b41";
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(80, 70, width - 160, height - 140, 8);
  context.fill();
  context.stroke();

  context.fillStyle = "rgba(110, 92, 72, 0.65)";
  context.strokeStyle = "#4b3e31";
  context.beginPath();
  context.roundRect(145, 120, 220, 145, 6);
  context.fill();
  context.stroke();

  context.fillStyle = "rgba(46, 112, 60, 0.55)";
  context.strokeStyle = "#295a35";
  context.beginPath();
  context.arc(width - 260, 190, 68, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.fillStyle = "rgba(245, 194, 85, 0.32)";
  context.strokeStyle = "#c18519";
  context.beginPath();
  context.roundRect(width - 420, height - 240, 260, 135, 6);
  context.fill();
  context.stroke();

  context.fillStyle = "#263026";
  context.font = "14px system-ui, sans-serif";
  context.fillText("House", 158, 145);
  context.fillText("Tree", width - 278, 194);
  context.fillText("Planting bed", width - 405, height - 214);
}
