import type { DashboardKpis } from "@/lib/metrics";
import { round1 } from "@/lib/metrics";
import KpiCard from "@/components/KpiCard";

function statusForNoTicketPct(pct: number): "good" | "warning" | "critical" {
  if (pct >= 50) return "critical";
  if (pct >= 20) return "warning";
  return "good";
}

export default function KpiHeader({ kpis }: { kpis: DashboardKpis }) {
  const noTicketAccent = statusForNoTicketPct(kpis.noTicketPct);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <KpiCard label="Veículos no painel" value={String(kpis.totalVehicles)} />
      <KpiCard
        label="Offline"
        value={String(kpis.offlineCount)}
        sub={`${round1(kpis.offlinePct)}% da frota`}
        accent={kpis.offlinePct >= 50 ? "critical" : kpis.offlinePct >= 25 ? "warning" : undefined}
      />
      <KpiCard
        label="Sem chamado aberto"
        value={String(kpis.noTicketCount)}
        sub={`${round1(kpis.noTicketPct)}% dos casos`}
        accent={noTicketAccent}
      />
      <KpiCard
        label="Dias offline (média)"
        value={round1(kpis.avgDiasOffline)}
        sub={kpis.maxDiasOffline !== null ? `máx. ${kpis.maxDiasOffline} dias` : undefined}
      />
      <KpiCard label="Casos em aberto" value={String(kpis.openCases)} sub={`de ${kpis.totalCases}`} />
      <KpiCard
        label="Taxa de resolução"
        value={`${round1(kpis.resolvedPct)}%`}
        accent={kpis.resolvedPct >= 50 ? "good" : undefined}
      />
    </div>
  );
}

export function StatusKpiRow({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KpiCard
        label="Offline em rota"
        value={String(kpis.offlineEmRota)}
        sub="Offline com status ativo"
        accent="critical"
      />
      <KpiCard label="Pendente" value={String(kpis.statusPendente)} accent="warning" />
      <KpiCard label="Em tratativa" value={String(kpis.statusTratativa)} />
      <KpiCard label="Agendado" value={String(kpis.statusAgendado)} accent="good" />
    </div>
  );
}
