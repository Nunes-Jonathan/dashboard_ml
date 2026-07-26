import { fetchDashboardData } from "@/lib/sheets";
import Dashboard from "@/components/Dashboard";
import SiteHeader from "@/components/SiteHeader";

export const revalidate = 300;

export default async function DashboardPage() {
  const { fleet: allFleet, tickets } = await fetchDashboardData();
  const fleet = allFleet.filter((f) => f.visibilidadeDash.trim().toLowerCase() === "sim");

  return (
    <div className="min-h-screen bg-[var(--page)]">
      <SiteHeader
        title="Painel de Telemetria — Frota Offline"
        subtitle='Dados ao vivo da planilha "Telemetria Offlines Geral" — atualiza a cada 5 min'
      />
      <Dashboard fleet={fleet} tickets={tickets} />
    </div>
  );
}
