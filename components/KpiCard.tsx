export const KPI_STATUS_TEXT = {
  good: "var(--success-text)",
  warning: "#fab219",
  critical: "#d03b3b",
};

export interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: "good" | "warning" | "critical";
}

export default function KpiCard({ label, value, sub, accent }: KpiCardProps) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-1 bg-[var(--surface)]"
      style={{ borderColor: "var(--border)" }}
    >
      <span className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">{label}</span>
      <span
        className="text-2xl font-semibold"
        style={{ color: accent ? KPI_STATUS_TEXT[accent] : "var(--ink)" }}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-[var(--ink-secondary)]">{sub}</span>}
    </div>
  );
}
