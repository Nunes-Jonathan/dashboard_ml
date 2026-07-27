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
import { Globe, TrendingUp, SlidersHorizontal, Wrench, ListChecks } from "lucide-react";
import FilterBar from "@/components/FilterBar";
import KpiCard from "@/components/KpiCard";
import HeroKpi from "@/components/HeroKpi";
import SectionHeader from "@/components/SectionHeader";
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

  const pctAccent = o.pct_offline >= 15 ? "critical" : o.pct_offline >= 10 ? "warning" : undefined;

  return (
    <div className="flex flex-col gap-8">
      <FilterBar filters={filters} onChange={setFilters} options={filterOptions} />

      <section className="flex flex-col gap-3">
        <SectionHeader icon={Globe}>
          Frota completa (não filtrado) — {overview.snapshotInfo.data_snapshot}
        </SectionHeader>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 self-start">
            <HeroKpi
              label="Total offline"
              value={String(o.total_offline)}
              sub={`${round1(o.pct_offline)}% de ${o.total_ff} veículos na frota completa da Mercado Livre`}
              accent={pctAccent}
            />
          </div>
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-3">
            <KpiCard
              label="Offline em rota"
              value={String(o.em_rota_off)}
              sub="Status Ativo/Bipando, mas sem comunicação — deveriam estar em rota"
              accent="critical"
            />
            <KpiCard
              label="Em manutenção"
              value={String(o.manut_off)}
              sub="Veículos offline atualmente com status Em manutenção"
              accent="warning"
            />
            <KpiCard
              label="Frota ociosa"
              value={String(o.ociosa_off)}
              sub="Veículos offline atualmente classificados como frota ociosa"
            />
            <KpiCard
              label="Novos offline (semana)"
              value={String(weekComparison.novos_offline)}
              sub={`Ficaram offline pela 1ª vez esta semana — ${weekComparison.recorrentes_offline} já eram offline recorrentes`}
            />
            <KpiCard
              label="3-29 dias offline"
              value={String(o.off_3_29)}
              sub="Nº de veículos sem comunicação há 3 a 29 dias"
            />
            <KpiCard
              label="30-99 dias offline"
              value={String(o.off_30_99)}
              sub="Nº de veículos sem comunicação há 30 a 99 dias"
            />
            <KpiCard
              label="100-199 dias offline"
              value={String(o.off_100_200)}
              sub="Nº de veículos sem comunicação há 100 a 199 dias"
              accent="warning"
            />
            <KpiCard
              label="200+ dias offline"
              value={String(o.off_200_plus)}
              sub="Nº de veículos sem comunicação há 200 dias ou mais"
              accent="critical"
            />
          </div>
        </div>
        <p className="text-xs text-[var(--ink-muted)]">
          Nossa planilha própria acompanha uma frota bem menor — esta seção usa a base completa da
          Mercado Livre (via API de telemetria), independente dos filtros acima. {o.sem_instalacao}{" "}
          sem instalação e {o.sem_device} sem device (não contabilizados como offline).
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader icon={TrendingUp}>Tendência — últimos 60 dias</SectionHeader>
        <ChartCard
          title="% da frota offline"
          subtitle="Percentual da frota completa sem comunicação, por dia — passe o mouse para ver cada dia"
        >
          <TrendLineChart points={tendencia} />
        </ChartCard>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader icon={SlidersHorizontal}>
          Detalhamento (aplica filtros) — {filteredPlacas.length} de {placas.length} veículos
        </SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <ChartCard
            title="Dias offline"
            subtitle="Quantidade de veículos offline por faixa de dias sem comunicação (mesmas faixas da API: 3-29 / 30-99 / 100-199 / 200+)"
            className="md:col-span-2"
          >
            <AgingChart items={agingItems} />
          </ChartCard>
          <ChartCard
            title="Status do veículo"
            subtitle="Quantidade de veículos offline por status atual"
          >
            <StatusVecChart items={statusVeiculoItems} />
          </ChartCard>
          <ChartCard title="Regional" subtitle="Quantidade de veículos offline por regional">
            <BarList items={regionalItems} />
          </ChartCard>
          <ChartCard
            title="Sub-regional"
            subtitle="Quantidade de veículos offline por sub-regional — frota completa, não filtrável (sem esse campo no detalhe)"
          >
            <BarList items={subRegionalItems} />
          </ChartCard>
          <ChartCard
            title="Transportadora"
            subtitle="Top 10 transportadoras por nº de veículos offline"
          >
            <BarList items={transportadoraItems} />
          </ChartCard>
          <ChartCard
            title="SVC"
            subtitle="Top 10 SVCs (centros de serviço) por nº de veículos offline"
          >
            <BarList items={svcItems} />
          </ChartCard>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader icon={Wrench}>Risco de manutenção</SectionHeader>
        <p className="text-xs text-[var(--ink-muted)]">
          Veículos atualmente em manutenção com histórico indicando risco de voltar offline.
        </p>
        <ManutencaoRiscoTable data={filteredManutencaoRisco ?? null} />
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader icon={ListChecks}>Lista de ação — frota offline completa</SectionHeader>
        <OfflineActionableTable rows={actionableRows} />
      </section>
    </div>
  );
}
