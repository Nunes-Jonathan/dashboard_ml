import type { GeotabFaultRow } from "@/lib/geotabMetrics";

export default function GeotabFaultTable({ rows }: { rows: GeotabFaultRow[] }) {
  const sorted = [...rows].sort((a, b) => b.activeCount - a.activeCount).slice(0, 100);

  if (sorted.length === 0) {
    return <p className="text-sm text-[var(--ink-muted)]">Nenhuma falha ativa no momento.</p>;
  }

  return (
    <div
      className="overflow-auto rounded-lg border max-h-[400px]"
      style={{ borderColor: "var(--border)" }}
    >
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-[var(--surface)]">
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">Placa</th>
            <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">MLP</th>
            <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">Regional</th>
            <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">SVC</th>
            <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">Falha</th>
            <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">Tipo</th>
            <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">Ocorrências</th>
            <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">
              Risco de quebra
            </th>
            <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">Última vez</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr
              key={`${r.deviceId}-${r.faultCodeDescription}-${i}`}
              style={{ borderBottom: "1px solid var(--border)" }}
              className="hover:bg-[var(--page)]"
            >
              <td className="px-3 py-2 font-medium tabular-nums text-[var(--ink)]">{r.placa}</td>
              <td className="px-3 py-2 text-[var(--ink-secondary)]">{r.mlp || "—"}</td>
              <td className="px-3 py-2 text-[var(--ink-secondary)]">{r.regional || "—"}</td>
              <td className="px-3 py-2 text-[var(--ink-secondary)]">{r.svc || "—"}</td>
              <td className="px-3 py-2 text-[var(--ink-secondary)] max-w-xs truncate" title={r.faultCodeDescription}>
                {r.faultCodeDescription}
              </td>
              <td className="px-3 py-2 text-[var(--ink-secondary)]">{r.diagnosticType}</td>
              <td className="px-3 py-2 tabular-nums text-[var(--ink)]">{r.activeCount}</td>
              <td className="px-3 py-2 text-[var(--ink-secondary)]">{r.breakdownRisk ?? "—"}</td>
              <td className="px-3 py-2 text-[var(--ink-muted)]">
                {r.activeDateTimeLastSeen ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
