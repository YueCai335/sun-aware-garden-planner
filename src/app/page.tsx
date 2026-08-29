import { HeatmapLegend } from "@/components/HeatmapLegend";
import { YardEditor } from "@/components/YardEditor";

export default function Home() {
  return (
    <main className="app-shell">
      <section className="workspace">
        <YardEditor />
        <HeatmapLegend />
      </section>
    </main>
  );
}
