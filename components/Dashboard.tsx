"use client";

import { useMemo, useState } from "react";
import type { FleetRow, TicketRow } from "@/lib/types";
import {
  EMPTY_FILTERS,
  applyFilters,
  buildActionableRows,
  bucketDiasDesdeAcao,
  computeKpis,
  countBy,
  countByDate,
  topN,
  uniqueSorted,
  type FilterState,
} from "@/lib/metrics";
import FilterBar from "@/components/FilterBar";
import KpiHeader, { StatusKpiRow } from "@/components/KpiHeader";
import ChartCard from "@/components/ChartCard";
import BarList from "@/components/BarList";
import PriorityChart from "@/components/charts/PriorityChart";
import SituacaoChart from "@/components/charts/SituacaoChart";
import AgingChart from "@/components/charts/AgingChart";
import AgendamentoPorDataChart from "@/components/charts/AgendamentoPorDataChart";
import ActionableTable from "@/components/ActionableTable";

export default function Dashboard({
  fleet,
  tickets,
}: {
  fleet: FleetRow[];
  tickets: TicketRow[];
}) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const filterOptions = useMemo(
    () => ({
      mlps: uniqueSorted(fleet.map((f) => f.mlp)),
      svcs: uniqueSorted(fleet.map((f) => f.svc)),
      regionais: uniqueSorted(fleet.map((f) => f.regional)),
    }),
    [fleet, tickets]
  );

  const { fleet: filteredFleet, tickets: filteredTickets } = useMemo(
    () => applyFilters(fleet, tickets, filters),
    [fleet, tickets, filters]
  );

  const kpis = useMemo(
    () => computeKpis(filteredFleet, filteredTickets),
    [filteredFleet, filteredTickets]
  );
  const actionableRows = useMemo(
    () => buildActionableRows(filteredFleet, filteredTickets),
    [filteredFleet, filteredTickets]
  );

  const regionalItems = useMemo(
    () => countBy(filteredFleet.map((f) => f.regional)),
    [filteredFleet]
  );
  const estadoItems = useMemo(
    () => topN(countBy(filteredFleet.map((f) => f.estado)), 8),
    [filteredFleet]
  );
  const clienteFrotaItems = useMemo(
    () => topN(countBy(filteredFleet.map((f) => f.mlp)), 10),
    [filteredFleet]
  );
  const prioridadeItems = useMemo(
    () => countBy(filteredTickets.map((t) => t.prioridadeGuerra)),
    [filteredTickets]
  );
  const situacaoItems = useMemo(
    () => countBy(filteredTickets.map((t) => t.situacao)),
    [filteredTickets]
  );
  const temChamadoItems = useMemo(
    () => countBy(filteredTickets.map((t) => t.temChamado)),
    [filteredTickets]
  );
  const responsavelItems = useMemo(
    () =>
      topN(
        countBy(filteredTickets.filter((t) => t.responsavel.trim()).map((t) => t.responsavel)),
        8
      ),
    [filteredTickets]
  );
  const clienteTicketItems = useMemo(
    () => topN(countBy(filteredTickets.map((t) => t.clienteOrigem || t.cliente)), 10),
    [filteredTickets]
  );
  const acaoAgingItems = useMemo(
    () => bucketDiasDesdeAcao(filteredTickets.map((t) => t.diasDesdeUltimaAcao)),
    [filteredTickets]
  );
  const agendamentoPorDataItems = useMemo(
    () => countByDate(filteredTickets.map((t) => t.abertoEm)),
    [filteredTickets]
  );

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col gap-6">
      <FilterBar filters={filters} onChange={setFilters} options={filterOptions} />

      <KpiHeader kpis={kpis} />
      <StatusKpiRow kpis={kpis} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--ink-secondary)] uppercase tracking-wide">
          Status da frota (Relação Geral)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
        <ChartCard title="Chamados abertos por data" subtitle="Aberto em, por dia">
          <AgendamentoPorDataChart items={agendamentoPorDataItems} />
        </ChartCard>
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
  );
}
