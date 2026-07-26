"use client";

import { useMemo, useState } from "react";
import type { TicketRow } from "@/lib/types";
import type {
  DeviceGroupRow,
  FaultMonitoringRow,
  LatestVehicleMetadataRow,
  VehicleKpiDailyRow,
} from "@/lib/geotab";
import {
  buildDailyHealthTrend,
  buildDeviceGroupMap,
  buildDeviceIdToPlacaMap,
  buildGeotabActionableRows,
  buildGeotabFaultRows,
  applyGeotabFilters,
} from "@/lib/geotabMetrics";
import { EMPTY_FILTERS, countBy, topN, uniqueSorted, round1, type FilterState } from "@/lib/metrics";
import FilterBar from "@/components/FilterBar";
import KpiCard from "@/components/KpiCard";
import ChartCard from "@/components/ChartCard";
import BarList from "@/components/BarList";
import TrendLineChart from "@/components/TrendLineChart";
import GeotabFaultTable from "@/components/GeotabFaultTable";
import GeotabActionableTable from "@/components/GeotabActionableTable";

export default function GeotabDashboard({
  latestVehicleMetadata,
  faultMonitoring,
  deviceGroups,
  vehicleKpiDaily,
  trendDays,
  tickets,
}: {
  latestVehicleMetadata: LatestVehicleMetadataRow[];
  faultMonitoring: FaultMonitoringRow[];
  deviceGroups: DeviceGroupRow[];
  vehicleKpiDaily: VehicleKpiDailyRow[];
  trendDays: number;
  tickets: TicketRow[];
}) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const groupMap = useMemo(() => buildDeviceGroupMap(deviceGroups), [deviceGroups]);
  const deviceIdToPlaca = useMemo(
    () => buildDeviceIdToPlacaMap(latestVehicleMetadata),
    [latestVehicleMetadata]
  );

  const allRows = useMemo(
    () => buildGeotabActionableRows(latestVehicleMetadata, groupMap, tickets),
    [latestVehicleMetadata, groupMap, tickets]
  );

  const faultRows = useMemo(
    () => buildGeotabFaultRows(faultMonitoring, deviceIdToPlaca, groupMap),
    [faultMonitoring, deviceIdToPlaca, groupMap]
  );

  const trend = useMemo(() => buildDailyHealthTrend(vehicleKpiDaily), [vehicleKpiDaily]);

  const filterOptions = useMemo(
    () => ({
      mlps: uniqueSorted(allRows.map((r) => r.mlp)),
      svcs: uniqueSorted(allRows.map((r) => r.svc)),
      regionais: uniqueSorted(allRows.map((r) => r.regional)),
      clientes: uniqueSorted(tickets.map((t) => t.clienteOrigem || t.cliente)),
      responsaveis: uniqueSorted(tickets.map((t) => t.responsavel)),
      prioridades: uniqueSorted(tickets.map((t) => t.prioridadeGuerra)),
    }),
    [allRows, tickets]
  );

  const filteredRows = useMemo(
    () => applyGeotabFilters(allRows, filters),
    [allRows, filters]
  );

  const filteredFaultRows = useMemo(() => {
    const noFilters = !filters.mlp && !filters.svc && !filters.regional;
    if (noFilters) return faultRows;
    return faultRows.filter((r) => {
      if (filters.mlp && r.mlp !== filters.mlp) return false;
      if (filters.svc && r.svc !== filters.svc) return false;
      if (filters.regional && r.regional !== filters.regional) return false;
      return true;
    });
  }, [faultRows, filters]);

  const totalDevices = filteredRows.length;
  const offlineDevices = filteredRows.filter((r) => r.isOffline).length;
  const offlinePct = totalDevices ? (offlineDevices / totalDevices) * 100 : 0;
  const devicesWithFaults = filteredRows.filter((r) => r.activeVehicleFaults > 0).length;

  const regionalItems = useMemo(() => countBy(filteredRows.map((r) => r.regional)), [filteredRows]);
  const svcItems = useMemo(() => topN(countBy(filteredRows.map((r) => r.svc)), 10), [filteredRows]);
  const mlpItems = useMemo(() => topN(countBy(filteredRows.map((r) => r.mlp)), 10), [filteredRows]);
  const locadoraItems = useMemo(() => countBy(filteredRows.map((r) => r.locadora)), [filteredRows]);
  const topFaultItems = useMemo(
    () => topN(countBy(filteredFaultRows.map((r) => r.faultCodeDescription)), 10),
    [filteredFaultRows]
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
          <KpiCard label="Falhas ativas (registros)" value={String(filteredFaultRows.length)} />
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
        <ChartCard title="% de dispositivos não comunicando por dia" subtitle="VehicleKpi_Daily, Device_Health">
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
          <ChartCard title="Principais falhas ativas" subtitle="Top 10 por nº de dispositivos">
            <BarList items={topFaultItems} />
          </ChartCard>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--ink-secondary)] uppercase tracking-wide">
          Falhas ativas por veículo
        </h2>
        <GeotabFaultTable rows={filteredFaultRows} />
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
