"use client";

import { useMemo, useState } from "react";
import type { TicketRow } from "@/lib/types";
import {
  EMPTY_FILTERS,
  countBy,
  topN,
  uniqueSorted,
  round1,
  type FilterState,
} from "@/lib/metrics";
import {
  applyOfflineFilters,
  bucketDiasOfflineExternal,
  buildOfflineActionableRows,
} from "@/lib/offlineMetrics";
import type {
  ManutencaoRiscoResponse,
  OverviewResponse,
  PlacaOfflineRow,
  TendenciaPoint,
  WeekComparisonResponse,
} from "@/lib/externalTelemetria";
import FilterBar from "@/components/FilterBar";
import KpiCard from "@/components/KpiCard";
import ChartCard from "@/components/ChartCard";
import BarList from "@/components/BarList";
import StatusVecChart from "@/components/charts/StatusVecChart";
import AgingChart from "@/components/charts/AgingChart";
import TrendLineChart from "@/components/TrendLineChart";
import ManutencaoRiscoTable from "@/components/ManutencaoRiscoTable";
import OfflineActionableTable from "@/components/OfflineActionableTable";

export default function OfflineDashboard({
  overview,
  placas,
  tendencia,
  weekComparison,
  manutencaoRisco,
  tickets,
}: {
  overview: OverviewResponse;
  placas: PlacaOfflineRow[];
  tendencia: TendenciaPoint[];
  weekComparison: WeekComparisonResponse;
  manutencaoRisco: ManutencaoRiscoResponse | null;
  tickets: TicketRow[];
}) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const filterOptions = useMemo(
    () => ({
      mlps: uniqueSorted(placas.map((p) => p.transportadora)),
      svcs: uniqueSorted(placas.map((p) => p.svc)),
      regionais: uniqueSorted(placas.map((p) => p.regional)),
      clientes: uniqueSorted(tickets.map((t) => t.clienteOrigem || t.cliente)),
      responsaveis: uniqueSorted(tickets.map((t) => t.responsavel)),
      prioridades: uniqueSorted(tickets.map((t) => t.prioridadeGuerra)),
    }),
    [placas, tickets]
  );

  const { placas: filteredPlacas, tickets: filteredTickets } = useMemo(
    () => applyOfflineFilters(placas, tickets, filters),
    [placas, tickets, filters]
  );

  const actionableRows = useMemo(
    () => buildOfflineActionableRows(filteredPlacas, filteredTickets),
    [filteredPlacas, filteredTickets]
  );

  const statusVeiculoItems = useMemo(
    () => countBy(filteredPlacas.map((p) => p.status_veiculo)),
    [filteredPlacas]
  );
  const agingItems = useMemo(
    () => bucketDiasOfflineExternal(filteredPlacas.map((p) => p.dias_offline)),
    [filteredPlacas]
  );
  const regionalItems = useMemo(
    () => countBy(filteredPlacas.map((p) => p.regional)),
    [filteredPlacas]
  );
  const transportadoraItems = useMemo(
    () => topN(countBy(filteredPlacas.map((p) => p.transportadora)), 10),
    [filteredPlacas]
  );
  const svcItems = useMemo(() => topN(countBy(filteredPlacas.map((p) => p.svc)), 10), [
    filteredPlacas,
  ]);

  const subRegionalItems = useMemo(
    () =>
      [...overview.sub_regionais]
        .sort((a, b) => b.offline - a.offline)
        .map((s) => ({ label: s.sub_regional, count: s.offline })),
    [overview.sub_regionais]
  );

  const filteredManutencaoRisco = useMemo(() => {
    if (!manutencaoRisco) return manutencaoRisco;
    const noFilters =
      !filters.mlp && !filters.svc && !filters.regional;
    if (noFilters) return manutencaoRisco;
    return {
      ...manutencaoRisco,
      rows: manutencaoRisco.rows.filter((r) => {
        if (filters.mlp && r.transportadora !== filters.mlp) return false;
        if (filters.svc && r.svc !== filters.svc) return false;
        if (filters.regional && r.regional !== filters.regional) return false;
        return true;
      }),
    };
  }, [manutencaoRisco, filters]);

  const o = overview.overview;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col gap-6">
      <FilterBar filters={filters} onChange={setFilters} options={filterOptions} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--ink-secondary)] uppercase tracking-wide">
          Frota completa (não filtrado) — {overview.snapshotInfo.data_snapshot}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard label="Total offline" value={String(o.total_offline)} sub={`de ${o.total_ff} veículos`} />
          <KpiCard
            label="% offline"
            value={`${round1(o.pct_offline)}%`}
            accent={o.pct_offline >= 15 ? "critical" : o.pct_offline >= 10 ? "warning" : undefined}
          />
          <KpiCard
            label="Offline em rota"
            value={String(o.em_rota_off)}
            sub="Ativo/bipando mas offline"
            accent="critical"
          />
          <KpiCard label="Em manutenção" value={String(o.manut_off)} accent="warning" />
          <KpiCard label="Frota ociosa" value={String(o.ociosa_off)} />
          <KpiCard
            label="Novos offline (semana)"
            value={String(weekComparison.novos_offline)}
            sub={`${weekComparison.recorrentes_offline} recorrentes`}
          />
          <KpiCard label="3-29 dias" value={String(o.off_3_29)} />
          <KpiCard label="30-99 dias" value={String(o.off_30_99)} />
          <KpiCard label="100-199 dias" value={String(o.off_100_200)} accent="warning" />
          <KpiCard label="200+ dias" value={String(o.off_200_plus)} accent="critical" />
        </div>
        <p className="text-xs text-[var(--ink-muted)]">
          Nossa planilha própria acompanha uma frota bem menor — esta seção usa a base completa da
          Mercado Livre (via API de telemetria), independente dos filtros acima. {o.sem_instalacao}{" "}
          sem instalação e {o.sem_device} sem device (não contabilizados como offline).
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--ink-secondary)] uppercase tracking-wide">
          Tendência — últimos 60 dias
        </h2>
        <ChartCard title="% da frota offline" subtitle="Passe o mouse para ver cada dia">
          <TrendLineChart points={tendencia} />
        </ChartCard>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--ink-secondary)] uppercase tracking-wide">
          Detalhamento (aplica filtros) — {filteredPlacas.length} de {placas.length} veículos
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard title="Status do veículo">
            <StatusVecChart items={statusVeiculoItems} />
          </ChartCard>
          <ChartCard title="Dias offline" subtitle="Mesmas faixas da API (3-29 / 30-99 / 100-199 / 200+)">
            <AgingChart items={agingItems} />
          </ChartCard>
          <ChartCard title="Regional">
            <BarList items={regionalItems} />
          </ChartCard>
          <ChartCard title="Sub-regional" subtitle="Frota completa — não filtrável (sem esse campo no detalhe)">
            <BarList items={subRegionalItems} />
          </ChartCard>
          <ChartCard title="Transportadora" subtitle="Top 10">
            <BarList items={transportadoraItems} />
          </ChartCard>
          <ChartCard title="SVC" subtitle="Top 10">
            <BarList items={svcItems} />
          </ChartCard>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--ink-secondary)] uppercase tracking-wide">
          Risco de manutenção
        </h2>
        <p className="text-xs text-[var(--ink-muted)]">
          Veículos atualmente em manutenção com histórico indicando risco de voltar offline.
        </p>
        <ManutencaoRiscoTable data={filteredManutencaoRisco ?? null} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--ink-secondary)] uppercase tracking-wide">
          Lista de ação — frota offline completa
        </h2>
        <OfflineActionableTable rows={actionableRows} />
      </section>
    </main>
  );
}
