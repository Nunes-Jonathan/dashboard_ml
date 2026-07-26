import { fetchExternalTelemetriaData } from "@/lib/externalTelemetria";
import { fetchTicketRows } from "@/lib/sheets";
import SiteHeader from "@/components/SiteHeader";
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
    <div className="min-h-screen bg-[var(--page)]">
      <SiteHeader
        title="Frota Offline — Detalhado"
        subtitle="Base completa da frota (API de telemetria) cruzada com AGENDAMENTO — atualiza a cada 10 min"
      />
      <OfflineDashboard
        overview={external.overview}
        placas={external.placas}
        tendencia={external.tendencia}
        weekComparison={external.weekComparison}
        manutencaoRisco={external.manutencaoRisco}
        tickets={tickets}
      />
    </div>
  );
}
