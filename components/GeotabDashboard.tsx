"use client";

import { useMemo, useState } from "react";
import type { DailyHealthPoint, GeotabActionableRow, GeotabFaultRow } from "@/lib/geotabMetrics";
import { applyGeotabFilters } from "@/lib/geotabMetrics";
import {
  EMPTY_FILTERS,
  countBy,
  topN,
  round1,
  type CountItem,
  type FilterState,
} from "@/lib/metrics";
import FilterBar from "@/components/FilterBar";
import KpiCard from "@/components/KpiCard";
import ChartCard from "@/components/ChartCard";
import BarList from "@/components/BarList";
import TrendLineChart from "@/components/TrendLineChart";
import GeotabFaultTable from "@/components/GeotabFaultTable";
import GeotabActionableTable from "@/components/GeotabActionableTable";

interface FilterOptions {
  mlps: string[];
  svcs: string[];
  regionais: string[];
  clientes: string[];
  responsaveis: string[];
  prioridades: string[];
}

export default function GeotabDashboard({
  actionableRows,
  topFaultRows,
  topFaultItems,
  trend,
  trendDays,
  filterOptions,
}: {
  actionableRows: GeotabActionableRow[];
  topFaultRows: GeotabFaultRow[];
  topFaultItems: CountItem[];
  trend: DailyHealthPoint[];
  trendDays: number;
  filterOptions: FilterOptions;
}) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const filteredRows = useMemo(
    () => applyGeotabFilters(actionableRows, filters),
    [actionableRows, filters]
  );

  const totalDevices = filteredRows.length;
  const offlineDevices = filteredRows.filter((r) => r.isOffline).length;
  const offlinePct = totalDevices ? (offlineDevices / totalDevices) * 100 : 0;
  const devicesWithFaults = filteredRows.filter((r) => r.activeVehicleFaults > 0).length;
  const activeFaultRecords = filteredRows.reduce(
    (sum, r) => sum + r.activeVehicleFaults + r.activeDeviceFaults,
    0
  );

  const regionalItems = useMemo(() => countBy(filteredRows.map((r) => r.regional)), [filteredRows]);
  const svcItems = useMemo(() => topN(countBy(filteredRows.map((r) => r.svc)), 10), [filteredRows]);
  const mlpItems = useMemo(() => topN(countBy(filteredRows.map((r) => r.mlp)), 10), [filteredRows]);
  const locadoraItems = useMemo(
    () => countBy(filteredRows.map((r) => r.locadora)),
    [filteredRows]
  );

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col gap-6">
      <FilterBar filters={filters} onChange={setFilters} options={filterOptions} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--ink-secondary)] uppercase tracking-wide">
          Conectividade (fonte Geotab)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Dispositivos" value={String(totalDevices)} />
          <KpiCard
            label="Não comunicando (24h)"
            value={String(offlineDevices)}
            sub={`${round1(offlinePct)}% dos dispositivos`}
            accent={offlinePct >= 50 ? "critical" : offlinePct >= 25 ? "warning" : undefined}
          />
          <KpiCard
            label="Com falhas ativas"
            value={String(devicesWithFaults)}
            accent={devicesWithFaults > 0 ? "warning" : undefined}
          />
          <KpiCard label="Falhas ativas (registros)" value={String(activeFaultRecords)} />
        </div>
        <p className="text-xs text-[var(--ink-muted)]">
          Dados direto do conector OData da Geotab (fabricante do rastreador) — a fonte mais
          upstream deste painel. &quot;Não comunicando&quot; usa o campo nativo{" "}
          <code>Device_Health</code> da Geotab.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--ink-secondary)] uppercase tracking-wide">
          Tendência — últimos {trendDays} dias
        </h2>
        <ChartCard
          title="% de dispositivos não comunicando por dia"
          subtitle="VehicleKpi_Daily, Device_Health"
        >
          <TrendLineChart points={trend} />
        </ChartCard>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--ink-secondary)] uppercase tracking-wide">
          Detalhamento (aplica filtros)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard title="Regional">
            <BarList items={regionalItems} />
          </ChartCard>
          <ChartCard title="SVC" subtitle="Top 10">
            <BarList items={svcItems} />
          </ChartCard>
          <ChartCard title="MLP" subtitle="Top 10">
            <BarList items={mlpItems} />
          </ChartCard>
          <ChartCard title="Locadora">
            <BarList items={locadoraItems} />
          </ChartCard>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--ink-secondary)] uppercase tracking-wide">
          Falhas ativas
        </h2>
        <p className="text-xs text-[var(--ink-muted)]">
          Visão da frota completa (top 10 tipos de falha, top {topFaultRows.length} registros por
          nº de ocorrências) — não filtrável pelos filtros acima, dado o volume de dados (~62 mil
          registros de falha no total).
        </p>
        <ChartCard title="Principais falhas ativas" subtitle="Top 10 por nº de ocorrências">
          <BarList items={topFaultItems} />
        </ChartCard>
        <GeotabFaultTable rows={topFaultRows} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--ink-secondary)] uppercase tracking-wide">
          Lista de ação — dispositivos Geotab
        </h2>
        <GeotabActionableTable rows={filteredRows} />
      </section>
    </main>
  );
}
