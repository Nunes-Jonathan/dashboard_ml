import type { DashboardKpis } from "@/lib/metrics";
import { round1 } from "@/lib/metrics";
import KpiCard from "@/components/KpiCard";

/** "Sem chamado aberto" is rendered separately as this page's HeroKpi — everything else lives here. */
export default function KpiHeader({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <KpiCard
        label="Veículos no painel"
        value={String(kpis.totalVehicles)}
        sub="Total de veículos com Visibilidade Dash = Sim na Relação Geral"
      />
      <KpiCard
        label="Offline"
        value={String(kpis.offlineCount)}
        sub={`${round1(kpis.offlinePct)}% da frota do painel está sem comunicação`}
        accent={kpis.offlinePct >= 50 ? "critical" : kpis.offlinePct >= 25 ? "warning" : undefined}
      />
      <KpiCard
        label="Dias offline (média)"
        value={round1(kpis.avgDiasOffline)}
        sub={
          kpis.maxDiasOffline !== null
            ? `Média entre veículos offline — máx. ${kpis.maxDiasOffline} dias`
            : "Média de dias sem comunicação entre veículos offline"
        }
      />
      <KpiCard
        label="Casos em aberto"
        value={String(kpis.openCases)}
        sub={`De ${kpis.totalCases} chamados no total em AGENDAMENTO`}
      />
      <KpiCard
        label="Taxa de resolução"
        value={`${round1(kpis.resolvedPct)}%`}
        sub="% de chamados já fechados/resolvidos"
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
        sub="Offline com status ativo — veículos que deveriam estar em rota mas pararam de comunicar"
        accent="critical"
      />
      <KpiCard
        label="Pendente"
        value={String(kpis.statusPendente)}
        sub="Veículos com Status = Pendente na Relação Geral"
        accent="warning"
      />
      <KpiCard
        label="Em tratativa"
        value={String(kpis.statusTratativa)}
        sub="Veículos com Status = Em tratativa na Relação Geral"
      />
      <KpiCard
        label="Agendado"
        value={String(kpis.statusAgendado)}
        sub="Veículos com Status = Agendado na Relação Geral"
        accent="good"
      />
    </div>
  );
}
