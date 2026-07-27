import { KPI_STATUS_TEXT } from "@/components/KpiCard";

export interface HeroKpiProps {
  label: string;
  value: string;
  sub?: string;
  accent?: "good" | "warning" | "critical";
}

/**
 * The one headline number a page leads with — bigger, its own card, placed
 * beside (not inside) the secondary KPI grid. Per the dataviz skill's
 * hero-figure guidance: exactly one per view, comfortably ≥48px.
 */
export default function HeroKpi({ label, value, sub, accent }: HeroKpiProps) {
  return (
    <div
      className="rounded-xl border p-6 flex flex-col gap-2 bg-[var(--surface)]"
      style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}
    >
      <span className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">{label}</span>
      <span
        className="text-6xl font-semibold leading-none"
        style={{ color: accent ? KPI_STATUS_TEXT[accent] : "var(--ink)" }}
      >
        {value}
      </span>
      {sub && <span className="text-sm text-[var(--ink-secondary)] leading-snug mt-1">{sub}</span>}
    </div>
  );
}
