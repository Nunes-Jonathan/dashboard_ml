import { fetchDashboardData } from "@/lib/sheets";
import {
  buildActionableRows,
  bucketDiasDesdeAcao,
  bucketDiasOffline,
  computeKpis,
  countBy,
  topN,
} from "@/lib/metrics";
import KpiHeader from "@/components/KpiHeader";
import ChartCard from "@/components/ChartCard";
import BarList from "@/components/BarList";
import StatusVecChart from "@/components/charts/StatusVecChart";
import PriorityChart from "@/components/charts/PriorityChart";
import SituacaoChart from "@/components/charts/SituacaoChart";
import AgingChart from "@/components/charts/AgingChart";
import ActionableTable from "@/components/ActionableTable";
import ThemeToggle from "@/components/ThemeToggle";
import RefreshButton from "@/components/RefreshButton";

export const revalidate = 300;

export default async function DashboardPage() {
  const { fleet: allFleet, tickets } = await fetchDashboardData();
  const fleet = allFleet.filter((f) => f.visibilidadeDash.trim().toLowerCase() === "sim");

  const kpis = computeKpis(fleet, tickets);
  const actionableRows = buildActionableRows(fleet, tickets);

  const statusVecItems = countBy(fleet.map((f) => f.statusVec));
  const regionalItems = countBy(fleet.map((f) => f.regional));
  const estadoItems = topN(countBy(fleet.map((f) => f.estado)), 8);
  const clienteFrotaItems = topN(countBy(fleet.map((f) => f.mlp)), 10);
  const offlineAgingItems = bucketDiasOffline(fleet.map((f) => f.diasOffline));

  const prioridadeItems = countBy(tickets.map((t) => t.prioridadeGuerra));
  const situacaoItems = countBy(tickets.map((t) => t.situacao));
  const temChamadoItems = countBy(tickets.map((t) => t.temChamado));
  const responsavelItems = topN(
    countBy(tickets.filter((t) => t.responsavel.trim()).map((t) => t.responsavel)),
    8
  );
  const clienteTicketItems = topN(
    countBy(tickets.map((t) => t.clienteOrigem || t.cliente)),
    10
  );
  const acaoAgingItems = bucketDiasDesdeAcao(tickets.map((t) => t.diasDesdeUltimaAcao));

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

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col gap-6">
        <KpiHeader kpis={kpis} />

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[var(--ink-secondary)] uppercase tracking-wide">
            Status da frota (Relação Geral)
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChartCard title="Status do veículo" subtitle="STATUS VEC">
              <StatusVecChart items={statusVecItems} />
            </ChartCard>
            <ChartCard title="Dias offline" subtitle="Distribuição por faixa">
              <AgingChart items={offlineAgingItems} />
            </ChartCard>
            <ChartCard title="Regional">
              <BarList items={regionalItems} />
            </ChartCard>
            <ChartCard title="Estado" subtitle="Top 8">
              <BarList items={estadoItems} />
            </ChartCard>
            <ChartCard title="Clientes (MLP)" subtitle="Top 10 por nº de veículos">
              <BarList items={clienteFrotaItems} />
            </ChartCard>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[var(--ink-secondary)] uppercase tracking-wide">
            Triagem de chamados (AGENDAMENTO)
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChartCard title="Prioridade" subtitle="Prioridade guerra">
              <PriorityChart items={prioridadeItems} />
            </ChartCard>
            <ChartCard title="Situação">
              <SituacaoChart items={situacaoItems} />
            </ChartCard>
            <ChartCard title="Tem chamado aberto?">
              <BarList items={temChamadoItems} />
            </ChartCard>
            <ChartCard title="Dias desde última ação" subtitle="Casos parados há mais tempo">
              <AgingChart items={acaoAgingItems} />
            </ChartCard>
            <ChartCard title="Carga por responsável" subtitle="Top 8 — casos com responsável atribuído">
              <BarList items={responsavelItems} />
            </ChartCard>
            <ChartCard title="Clientes" subtitle="Top 10 por nº de casos">
              <BarList items={clienteTicketItems} />
            </ChartCard>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[var(--ink-secondary)] uppercase tracking-wide">
            Lista de ação
          </h2>
          <ActionableTable rows={actionableRows} />
        </section>
      </main>
    </div>
  );
}
