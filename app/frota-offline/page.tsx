import { fetchExternalTelemetriaData } from "@/lib/externalTelemetria";
import { fetchTicketRows } from "@/lib/sheets";
import OfflineDashboard from "@/components/OfflineDashboard";

export const revalidate = 600;

export const metadata = {
  title: "Frota Offline Detalhado — Painel de Telemetria",
};

export default async function FrotaOfflinePage() {
  const [external, tickets] = await Promise.all([
    fetchExternalTelemetriaData(),
    fetchTicketRows(),
  ]);

  return (
    <OfflineDashboard
      overview={external.overview}
      placas={external.placas}
      tendencia={external.tendencia}
      weekComparison={external.weekComparison}
      manutencaoRisco={external.manutencaoRisco}
      tickets={tickets}
    />
  );
}
