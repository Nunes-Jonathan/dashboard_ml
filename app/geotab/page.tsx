import { fetchGeotabData } from "@/lib/geotab";
import { fetchTicketRows } from "@/lib/sheets";
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

export default async function GeotabPage() {
  const [geotab, tickets] = await Promise.all([
    fetchGeotabData(TREND_DAYS),
    fetchTicketRows(),
  ]);

  return (
    <div className="min-h-screen bg-[var(--page)]">
      <SiteHeader
        title="Geotab — Fonte Nativa"
        subtitle="Conectividade e falhas direto do conector Geotab, cruzado com AGENDAMENTO — atualiza a cada 10 min"
      />
      <GeotabDashboard
        latestVehicleMetadata={geotab.latestVehicleMetadata}
        faultMonitoring={geotab.faultMonitoring}
        deviceGroups={geotab.deviceGroups}
        vehicleKpiDaily={geotab.vehicleKpiDaily}
        trendDays={TREND_DAYS}
        tickets={tickets}
      />
    </div>
  );
}
