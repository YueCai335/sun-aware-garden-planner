"use client";

import { useEffect, useState } from "react";

import { Toolbar } from "@/components/Toolbar";
import { YardCanvas } from "@/components/YardCanvas";
import type { DrawingTool, Point, ShapeKind, YardElement, YardProject } from "@/lib/types";

const STORAGE_KEY = "sun-aware-garden-planner:yard-project:v1";

const elementDefaults: Record<ShapeKind, Omit<YardElement, "id" | "kind" | "x" | "y">> = {
  yard: { width: 76, height: 76 },
  house: { width: 27, height: 20, obstacleHeightMeters: 6 },
  tree: { width: 13, height: 13, obstacleHeightMeters: 7 },
  fence: { width: 32, height: 4, obstacleHeightMeters: 1.8 },
  "planting-bed": { width: 27, height: 15 }
};

const demoProject: YardProject = {
  location: "",
  date: "",
  elements: [
    { id: "demo-yard", kind: "yard", x: 10, y: 10, width: 80, height: 80 },
    { id: "demo-house", kind: "house", x: 19, y: 18, width: 27, height: 20, obstacleHeightMeters: 6 },
    { id: "demo-tree", kind: "tree", x: 70, y: 18, width: 13, height: 13, obstacleHeightMeters: 7 },
    { id: "demo-fence", kind: "fence", x: 56, y: 67, width: 28, height: 4, obstacleHeightMeters: 1.8 },
    { id: "demo-bed", kind: "planting-bed", x: 54, y: 62, width: 27, height: 15 }
  ]
};

export function YardEditor() {
  const [project, setProject] = useState<YardProject>(demoProject);
  const [tool, setTool] = useState<DrawingTool>("select");
  const [selectedId, setSelectedId] = useState<string>();
  const [message, setMessage] = useState("Your yard changes save in this browser.");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedProject = window.localStorage.getItem(STORAGE_KEY);
    if (savedProject) {
      try {
        const parsedProject = JSON.parse(savedProject);
        if (isYardProject(parsedProject)) {
          setProject(parsedProject);
          setMessage(parsedProject.elements.length ? "Saved yard restored." : "Your yard is empty. Choose a drawing tool to start.");
        } else {
          setMessage("Saved yard data could not be read. The demo yard is available.");
        }
      } catch {
        setMessage("Saved yard data could not be read. The demo yard is available.");
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    }
  }, [isLoaded, project]);

  const selectedElement = project.elements.find((element) => element.id === selectedId);

  const updateProject = (update: Partial<YardProject>) => {
    setProject((current) => ({ ...current, ...update }));
  };

  const addElement = (kind: ShapeKind, point: Point) => {
    if (kind === "yard" && project.elements.some((element) => element.kind === "yard")) {
      setMessage("Select the existing yard boundary to edit it, or delete it before adding another.");
      return;
    }

    const defaults = elementDefaults[kind];
    const element: YardElement = {
      id: window.crypto.randomUUID(),
      kind,
      ...defaults,
      x: clamp(point.x - defaults.width / 2, 0, 100 - defaults.width),
      y: clamp(point.y - defaults.height / 2, 0, 100 - defaults.height)
    };
    updateProject({ elements: [...project.elements, element] });
    setSelectedId(element.id);
    setMessage(`${labelFor(kind)} added. Drag it or edit its values in the panel.`);
  };

  const moveElement = (id: string, point: Point) => {
    updateProject({
      elements: project.elements.map((element) => (element.id === id ? { ...element, ...point } : element))
    });
  };

  const updateSelectedNumber = (
    field: "x" | "y" | "width" | "height" | "obstacleHeightMeters",
    rawValue: string
  ) => {
    const value = Number(rawValue);
    if (!selectedElement || rawValue === "" || !Number.isFinite(value)) {
      setMessage("Enter a number to update the selected element.");
      return;
    }
    if (field === "obstacleHeightMeters" && value <= 0) {
      setMessage("Obstacle height must be greater than zero.");
      return;
    }
    if ((field === "width" || field === "height") && value < 2) {
      setMessage("Width and depth must be at least 2.");
      return;
    }
    if ((field === "x" || field === "y") && value < 0) {
      setMessage("Geometry values cannot be negative.");
      return;
    }

    const nextElement = { ...selectedElement, [field]: value };
    if (field === "x") {
      nextElement.x = clamp(value, 0, 100 - nextElement.width);
    } else if (field === "y") {
      nextElement.y = clamp(value, 0, 100 - nextElement.height);
    } else if (field === "width") {
      nextElement.width = clamp(value, 2, 100);
      nextElement.x = clamp(nextElement.x, 0, 100 - nextElement.width);
    } else if (field === "height") {
      nextElement.height = clamp(value, 2, 100);
      nextElement.y = clamp(nextElement.y, 0, 100 - nextElement.height);
    }

    updateProject({
      elements: project.elements.map((element) => (element.id === selectedElement.id ? nextElement : element))
    });
    setMessage(`${labelFor(selectedElement.kind)} updated.`);
  };

  const deleteSelected = () => {
    if (!selectedElement) {
      return;
    }
    updateProject({ elements: project.elements.filter((element) => element.id !== selectedElement.id) });
    setSelectedId(undefined);
    setMessage(`${labelFor(selectedElement.kind)} deleted.`);
  };

  const clearProject = () => {
    updateProject({ elements: [], location: "", date: "" });
    setSelectedId(undefined);
    setTool("select");
    setMessage("Your yard is empty. Choose a drawing tool to start.");
  };

  const loadDemo = () => {
    setProject(demoProject);
    setSelectedId(undefined);
    setTool("select");
    setMessage("Demo yard loaded.");
  };

  return (
    <>
      <Toolbar
        date={project.date}
        hasElements={project.elements.length > 0}
        location={project.location}
        message={message}
        onClear={clearProject}
        onDateChange={(date) => updateProject({ date })}
        onDelete={deleteSelected}
        onLoadDemo={loadDemo}
        onLocationChange={(location) => updateProject({ location })}
        onSelectedNumberChange={updateSelectedNumber}
        onToolChange={setTool}
        selectedElement={selectedElement}
        tool={tool}
      />
      <YardCanvas
        elements={project.elements}
        onAdd={addElement}
        onMove={moveElement}
        onSelect={setSelectedId}
        selectedId={selectedId}
        tool={tool}
      />
    </>
  );
}

function isYardProject(value: unknown): value is YardProject {
  if (!value || typeof value !== "object") {
    return false;
  }
  const project = value as Partial<YardProject>;
  return (
    typeof project.location === "string" &&
    typeof project.date === "string" &&
    Array.isArray(project.elements) &&
    project.elements.every(isYardElement)
  );
}

function isYardElement(value: unknown): value is YardElement {
  if (!value || typeof value !== "object") {
    return false;
  }
  const element = value as Partial<YardElement>;
  return (
    typeof element.id === "string" &&
    isShapeKind(element.kind) &&
    [element.x, element.y, element.width, element.height].every((item) => typeof item === "number" && Number.isFinite(item)) &&
    (element.obstacleHeightMeters === undefined ||
      (typeof element.obstacleHeightMeters === "number" && Number.isFinite(element.obstacleHeightMeters)))
  );
}

function isShapeKind(value: unknown): value is ShapeKind {
  return value === "yard" || value === "house" || value === "tree" || value === "fence" || value === "planting-bed";
}

function labelFor(kind: ShapeKind) {
  return kind === "planting-bed" ? "Planting bed" : kind === "yard" ? "Yard boundary" : kind[0].toUpperCase() + kind.slice(1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
