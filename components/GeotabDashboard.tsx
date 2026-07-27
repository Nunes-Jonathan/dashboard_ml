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
import { Wifi, TrendingUp, SlidersHorizontal, AlertTriangle, ListChecks } from "lucide-react";
import FilterBar from "@/components/FilterBar";
import KpiCard from "@/components/KpiCard";
import HeroKpi from "@/components/HeroKpi";
import SectionHeader from "@/components/SectionHeader";
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
  const offlineAccent = offlinePct >= 50 ? "critical" : offlinePct >= 25 ? "warning" : undefined;
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
    <div className="flex flex-col gap-8">
      <FilterBar filters={filters} onChange={setFilters} options={filterOptions} />

      <section className="flex flex-col gap-3">
        <SectionHeader icon={Wifi}>Conectividade (fonte Geotab)</SectionHeader>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 self-start">
            <HeroKpi
              label="Não comunicando (24h)"
              value={String(offlineDevices)}
              sub={`${round1(offlinePct)}% dos ${totalDevices} dispositivos não enviaram dados nas últimas 24h`}
              accent={offlineAccent}
            />
          </div>
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-3">
            <KpiCard
              label="Dispositivos"
              value={String(totalDevices)}
              sub="Total de dispositivos Geotab com vínculo ativo a um veículo"
            />
            <KpiCard
              label="Com falhas ativas"
              value={String(devicesWithFaults)}
              sub="Dispositivos com pelo menos 1 falha ativa nas últimas 24h"
              accent={devicesWithFaults > 0 ? "warning" : undefined}
            />
            <KpiCard
              label="Falhas ativas (registros)"
              value={String(activeFaultRecords)}
              sub="Soma de falhas de veículo + de dispositivo, últimas 24h"
            />
          </div>
        </div>
        <p className="text-xs text-[var(--ink-muted)]">
          Dados direto do conector OData da Geotab (fabricante do rastreador) — a fonte mais
          upstream deste painel. &quot;Não comunicando&quot; usa o campo nativo{" "}
          <code>Device_Health</code> da Geotab.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader icon={TrendingUp}>Tendência — últimos {trendDays} dias</SectionHeader>
        <ChartCard
          title="% de dispositivos não comunicando por dia"
          subtitle={`Percentual de dispositivos sem comunicação, por dia, nos últimos ${trendDays} dias`}
        >
          <TrendLineChart points={trend} />
        </ChartCard>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader icon={SlidersHorizontal}>Detalhamento (aplica filtros)</SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <ChartCard
            title="MLP"
            subtitle="Top 10 MLPs (transportadoras) por nº de dispositivos"
            className="md:col-span-2"
          >
            <BarList items={mlpItems} />
          </ChartCard>
          <ChartCard title="Regional" subtitle="Quantidade de dispositivos por regional">
            <BarList items={regionalItems} />
          </ChartCard>
          <ChartCard title="SVC" subtitle="Top 10 SVCs (centros de serviço) por nº de dispositivos">
            <BarList items={svcItems} />
          </ChartCard>
          <ChartCard
            title="Locadora"
            subtitle="Quantidade de dispositivos por locadora (quando aplicável)"
          >
            <BarList items={locadoraItems} />
          </ChartCard>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader icon={AlertTriangle}>Falhas ativas</SectionHeader>
        <p className="text-xs text-[var(--ink-muted)]">
          Visão da frota completa (top 10 tipos de falha, top {topFaultRows.length} registros por
          nº de ocorrências) — não filtrável pelos filtros acima, dado o volume de dados (~62 mil
          registros de falha no total).
        </p>
        <ChartCard
          title="Principais falhas ativas"
          subtitle="Top 10 tipos de falha mais frequentes, por nº de ocorrências"
        >
          <BarList items={topFaultItems} />
        </ChartCard>
        <GeotabFaultTable rows={topFaultRows} />
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader icon={ListChecks}>Lista de ação — dispositivos Geotab</SectionHeader>
        <GeotabActionableTable rows={filteredRows} />
      </section>
    </div>
  );
}
