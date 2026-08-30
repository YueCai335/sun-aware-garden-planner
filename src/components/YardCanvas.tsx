"use client";

import dynamic from "next/dynamic";

import type { YardCanvasProps } from "@/components/YardCanvasClient";

export const YardCanvas = dynamic<YardCanvasProps>(
  () => import("@/components/YardCanvasClient").then((module) => module.YardCanvasClient),
  { ssr: false }
);
