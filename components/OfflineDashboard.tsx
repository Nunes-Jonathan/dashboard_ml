"use client";

import { useEffect, useMemo, useState } from "react";
import type { FleetRow, TicketRow } from "@/lib/types";
import {
  EMPTY_FILTERS,
  applyFilters,
  computeStatusCounts,
  countBy,
  countByDate,
  topN,
  uniqueSorted,
  type FilterState,
} from "@/lib/metrics";
import { applyOfflineFilters, buildOfflineActionableRows } from "@/lib/offlineMetrics";
import type {
  ManutencaoRiscoResponse,
  OverviewResponse,
  PlacaOfflineRow,
  TendenciaPoint,
} from "@/lib/externalTelemetria";
import FilterBar from "@/components/FilterBar";
import KpiCard from "@/components/KpiCard";
import ChartCard from "@/components/ChartCard";
import BarList from "@/components/BarList";
import AgendamentoPorDataChart from "@/components/charts/AgendamentoPorDataChart";
import TrendLineChart from "@/components/TrendLineChart";
import ManutencaoRiscoTable from "@/components/ManutencaoRiscoTable";
import OfflineActionableTable from "@/components/OfflineActionableTable";

const EMPTY_PLACAS: PlacaOfflineRow[] = [];

export default function OfflineDashboard({
  overview,
  placas,
  tendencia,
  tickets,
  fleet,
}: {
  overview: OverviewResponse;
  placas: PlacaOfflineRow[];
  tendencia: TendenciaPoint[];
  tickets: TicketRow[];
  fleet: FleetRow[];
}) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const filterOptions = useMemo(
    () => ({
      mlps: uniqueSorted(placas.map((p) => p.transportadora)),
      svcs: uniqueSorted(placas.map((p) => p.svc)),
      regionais: uniqueSorted(placas.map((p) => p.regional)),
    }),
    [placas]
  );

  const o = overview.overview;

  // BigQuery-backed data is fetched as a filtered D-1 snapshot, since that
  // upstream API supports `date` + dimension filters together on every
  // endpoint. manutencao-risco is fetched in its own effect/request (see
  // telemetria-d1-manutencao/route.ts) because that specific upstream
  // endpoint is known to be slow/flaky, and must not delay the faster
  // overview+placas path (KPI card, bar lists, actionable table) on every
  // filter change. Loading is derived by comparing request keys rather than
  // set synchronously in the effect body, to avoid a cascading-render lint
  // error.
  const d1RequestKey = useMemo(() => JSON.stringify(filters), [filters]);

  const [d1Result, setD1Result] = useState<{
    key: string;
    dataSnapshot: string | null;
    emRotaOff: number | null;
    placas: PlacaOfflineRow[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams({ baseDate: overview.snapshotInfo.data_snapshot });
    if (filters.mlp) params.set("transportadora", filters.mlp);
    if (filters.svc) params.set("svc", filters.svc);
    if (filters.regional) params.set("regional", filters.regional);

    fetch(`/api/telemetria-d1?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("fetch failed"))))
      .then((data) => {
        if (cancelled) return;
        setD1Result({
          key: d1RequestKey,
          dataSnapshot: data?.dataSnapshot ?? null,
          emRotaOff: data?.overview?.em_rota_off ?? null,
          placas: Array.isArray(data?.placas) ? data.placas : [],
        });
      })
      .catch(() => {
        if (!cancelled) {
          setD1Result({ key: d1RequestKey, dataSnapshot: null, emRotaOff: null, placas: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [d1RequestKey, filters, overview.snapshotInfo.data_snapshot]);

  const d1Loading = d1Result?.key !== d1RequestKey;
  const d1 = d1Loading ? null : d1Result;
  const d1Placas = useMemo(() => d1?.placas ?? EMPTY_PLACAS, [d1]);

  const [manutencaoResult, setManutencaoResult] = useState<{
    key: string;
    data: ManutencaoRiscoResponse | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams({ baseDate: overview.snapshotInfo.data_snapshot });
    if (filters.mlp) params.set("transportadora", filters.mlp);
    if (filters.svc) params.set("svc", filters.svc);
    if (filters.regional) params.set("regional", filters.regional);

    fetch(`/api/telemetria-d1-manutencao?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("fetch failed"))))
      .then((data) => {
        if (!cancelled) setManutencaoResult({ key: d1RequestKey, data: data?.manutencaoRisco ?? null });
      })
      .catch(() => {
        if (!cancelled) setManutencaoResult({ key: d1RequestKey, data: null });
      });

    return () => {
      cancelled = true;
    };
  }, [d1RequestKey, filters, overview.snapshotInfo.data_snapshot]);

  const manutencaoLoading = manutencaoResult?.key !== d1RequestKey;
  const manutencaoRiscoD1 = manutencaoLoading ? null : manutencaoResult.data;

  const { tickets: filteredTickets } = useMemo(
    () => applyOfflineFilters(d1Placas, tickets, filters),
    [d1Placas, tickets, filters]
  );

  const actionableRows = useMemo(
    () => buildOfflineActionableRows(d1Placas, filteredTickets),
    [d1Placas, filteredTickets]
  );

  const agendamentoPorDataItems = useMemo(
    () => countByDate(filteredTickets.map((t) => t.abertoEm)),
    [filteredTickets]
  );

  const regionalItems = useMemo(() => countBy(d1Placas.map((p) => p.regional)), [d1Placas]);
  const transportadoraItems = useMemo(
    () => topN(countBy(d1Placas.map((p) => p.transportadora)), 10),
    [d1Placas]
  );
  const svcItems = useMemo(() => topN(countBy(d1Placas.map((p) => p.svc)), 10), [d1Placas]);

  const { fleet: filteredFleet } = useMemo(
    () => applyFilters(fleet, tickets, filters),
    [fleet, tickets, filters]
  );
  const { statusPendente, statusTratativa, statusAgendado } = useMemo(
    () => computeStatusCounts(filteredFleet),
    [filteredFleet]
  );

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col gap-6">
      <FilterBar filters={filters} onChange={setFilters} options={filterOptions} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--ink-secondary)] uppercase tracking-wide">
          Visão geral (aplica filtros) — {overview.snapshotInfo.data_snapshot}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard
            label="Offline em rota (D-1)"
            value={d1Loading ? "…" : d1?.emRotaOff !== null && d1 ? String(d1.emRotaOff) : "—"}
            sub={
              d1?.dataSnapshot
                ? `Ativo/bipando mas offline · ${d1.dataSnapshot}`
                : "Ativo/bipando mas offline"
            }
            accent="critical"
          />
          <KpiCard label="Pendente" value={String(statusPendente)} accent="warning" />
          <KpiCard label="Em tratativa" value={String(statusTratativa)} />
          <KpiCard label="Agendado" value={String(statusAgendado)} accent="good" />
        </div>
        <p className="text-xs text-[var(--ink-muted)]">
          Nossa planilha própria acompanha uma frota bem menor — &ldquo;Offline em rota&rdquo; usa
          a base completa da Mercado Livre (via API de telemetria), com um dia de defasagem
          (D-1); &ldquo;Pendente&rdquo;, &ldquo;Em tratativa&rdquo; e &ldquo;Agendado&rdquo; usam
          nossa planilha, em tempo real. {o.sem_instalacao} sem instalação e {o.sem_device} sem
          device (não contabilizados como offline).
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
          Detalhamento (D-1, aplica filtros)
          {d1?.dataSnapshot ? ` — ${d1Placas.length} veículos — dados de ${d1.dataSnapshot}` : ""}
        </h2>
        {d1Loading ? (
          <p className="text-sm text-[var(--ink-muted)]">Carregando dados de ontem…</p>
        ) : (
          <>
            <ChartCard title="Chamados abertos por data" subtitle="Aberto em, por dia">
              <AgendamentoPorDataChart items={agendamentoPorDataItems} />
            </ChartCard>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <ChartCard title="Regional">
                <BarList items={regionalItems} />
              </ChartCard>
              <ChartCard title="Transportadora" subtitle="Top 10">
                <BarList items={transportadoraItems} />
              </ChartCard>
              <ChartCard title="SVC" subtitle="Top 10">
                <BarList items={svcItems} />
              </ChartCard>
            </div>
          </>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--ink-secondary)] uppercase tracking-wide">
          Risco de manutenção (D-1)
        </h2>
        <p className="text-xs text-[var(--ink-muted)]">
          Veículos atualmente em manutenção com histórico indicando risco de voltar offline.
        </p>
        {manutencaoLoading ? (
          <p className="text-sm text-[var(--ink-muted)]">Carregando dados de ontem…</p>
        ) : (
          <ManutencaoRiscoTable data={manutencaoRiscoD1} />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--ink-secondary)] uppercase tracking-wide">
          Lista de ação — frota offline completa (D-1)
        </h2>
        {d1Loading ? (
          <p className="text-sm text-[var(--ink-muted)]">Carregando dados de ontem…</p>
        ) : (
          <OfflineActionableTable rows={actionableRows} />
        )}
      </section>
    </main>
  );
}
