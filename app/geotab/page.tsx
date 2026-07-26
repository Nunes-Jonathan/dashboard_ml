import { fetchGeotabData } from "@/lib/geotab";
import { fetchTicketRows } from "@/lib/sheets";
import {
  buildDailyHealthTrend,
  buildDeviceGroupMap,
  buildDeviceIdToPlacaMap,
  buildGeotabActionableRows,
  buildGeotabFaultRows,
} from "@/lib/geotabMetrics";
import { countBy, topN, uniqueSorted } from "@/lib/metrics";
import SiteHeader from "@/components/SiteHeader";
import GeotabDashboard from "@/components/GeotabDashboard";

export const revalidate = 600;

export const metadata = {
  title: "Geotab — Painel de Telemetria",
};

// VehicleKpi_Daily is per-device-per-day and large (30 days measured ~97k
// rows / 115MB / ~50s from this connector) — 7 days keeps the trend chart
// meaningful while staying fast; fetchVehicleKpiDaily degrades to an empty
// series rather than failing the page if it's still slow.
const TREND_DAYS = 7;

// FaultMonitoring has ~62k rows fleet-wide — shipping all of them to the
// client (as a prop into a "use client" component) blew this page's static
// output past Vercel's 19.07MB ISR limit (measured ~250MB), since Next.js
// serializes everything passed into a client component into the page's
// hydration payload. Only the top N by severity get shipped for the table;
// the "top fault types" chart is computed here from the full set instead.
const TOP_FAULT_ROWS_LIMIT = 300;

export default async function GeotabPage() {
  const [geotab, tickets] = await Promise.all([fetchGeotabData(TREND_DAYS), fetchTicketRows()]);

  // All the heavy joining/aggregation happens here, server-side, over the
  // full raw datasets. Only small, pre-aggregated results are passed to the
  // client component below — see TOP_FAULT_ROWS_LIMIT comment for why.
  const groupMap = buildDeviceGroupMap(geotab.deviceGroups);
  const deviceIdToPlaca = buildDeviceIdToPlacaMap(geotab.latestVehicleMetadata);
  const actionableRows = buildGeotabActionableRows(geotab.latestVehicleMetadata, groupMap, tickets);
  const allFaultRows = buildGeotabFaultRows(geotab.faultMonitoring, deviceIdToPlaca, groupMap);
  const trend = buildDailyHealthTrend(geotab.vehicleKpiDaily);

  const topFaultItems = topN(countBy(allFaultRows.map((r) => r.faultCodeDescription)), 10);
  const topFaultRows = [...allFaultRows]
    .sort((a, b) => b.activeCount - a.activeCount)
    .slice(0, TOP_FAULT_ROWS_LIMIT);

  const filterOptions = {
    mlps: uniqueSorted(actionableRows.map((r) => r.mlp)),
    svcs: uniqueSorted(actionableRows.map((r) => r.svc)),
    regionais: uniqueSorted(actionableRows.map((r) => r.regional)),
    clientes: uniqueSorted(tickets.map((t) => t.clienteOrigem || t.cliente)),
    responsaveis: uniqueSorted(tickets.map((t) => t.responsavel)),
    prioridades: uniqueSorted(tickets.map((t) => t.prioridadeGuerra)),
  };

  return (
    <div className="min-h-screen bg-[var(--page)]">
      <SiteHeader
        title="Geotab — Fonte Nativa"
        subtitle="Conectividade e falhas direto do conector Geotab, cruzado com AGENDAMENTO — atualiza a cada 10 min"
      />
      <GeotabDashboard
        actionableRows={actionableRows}
        topFaultRows={topFaultRows}
        topFaultItems={topFaultItems}
        trend={trend}
        trendDays={TREND_DAYS}
        filterOptions={filterOptions}
      />
    </div>
  );
}
