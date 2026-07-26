import { fetchDashboardData } from "@/lib/sheets";
import Dashboard from "@/components/Dashboard";
import ThemeToggle from "@/components/ThemeToggle";
import RefreshButton from "@/components/RefreshButton";

export const revalidate = 300;

export default async function DashboardPage() {
  const { fleet: allFleet, tickets } = await fetchDashboardData();
  const fleet = allFleet.filter((f) => f.visibilidadeDash.trim().toLowerCase() === "sim");

  return (
    <div className="min-h-screen bg-[var(--page)]">
      <header className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-[var(--ink)]">
              Painel de Telemetria — Frota Offline
            </h1>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5">
              Dados ao vivo da planilha &quot;Telemetria Offlines Geral&quot; — atualiza a cada 5 min
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <RefreshButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <Dashboard fleet={fleet} tickets={tickets} />
    </div>
  );
}
