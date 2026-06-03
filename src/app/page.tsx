import { HeatmapLegend } from "@/components/HeatmapLegend";
import { Toolbar } from "@/components/Toolbar";
import { YardCanvas } from "@/components/YardCanvas";

export default function Home() {
  return (
    <main className="app-shell">
      <section className="workspace">
        <Toolbar />
        <YardCanvas />
        <HeatmapLegend />
      </section>
    </main>
  );
}
