"use client";

import { useMemo, useState } from "react";
import type { FleetRow, TicketRow } from "@/lib/types";
import {
  EMPTY_FILTERS,
  applyFilters,
  buildActionableRows,
  bucketDiasDesdeAcao,
  bucketDiasOffline,
  computeKpis,
  countBy,
  countByDate,
  round1,
  topN,
  uniqueSorted,
  type FilterState,
} from "@/lib/metrics";
import { Ticket, ListChecks, Truck } from "lucide-react";
import FilterBar from "@/components/FilterBar";
import KpiHeader, { StatusKpiRow } from "@/components/KpiHeader";
import HeroKpi from "@/components/HeroKpi";
import SectionHeader from "@/components/SectionHeader";
import ChartCard from "@/components/ChartCard";
import BarList from "@/components/BarList";
import StatusVecChart from "@/components/charts/StatusVecChart";
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
      clientes: uniqueSorted(tickets.map((t) => t.clienteOrigem || t.cliente)),
      responsaveis: uniqueSorted(tickets.map((t) => t.responsavel)),
      prioridades: uniqueSorted(tickets.map((t) => t.prioridadeGuerra)),
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

  const statusVecItems = useMemo(
    () => countBy(filteredFleet.map((f) => f.statusVec)),
    [filteredFleet]
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
  const offlineAgingItems = useMemo(
    () => bucketDiasOffline(filteredFleet.map((f) => f.diasOffline)),
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

  const noTicketAccent = kpis.noTicketPct >= 50 ? "critical" : kpis.noTicketPct >= 20 ? "warning" : "good";

  return (
    <div className="flex flex-col gap-8">
      <FilterBar filters={filters} onChange={setFilters} options={filterOptions} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 self-start">
          <HeroKpi
            label="Sem chamado aberto"
            value={String(kpis.noTicketCount)}
            sub={`${round1(kpis.noTicketPct)}% dos casos de AGENDAMENTO não têm chamado — o maior gargalo deste painel`}
            accent={noTicketAccent}
          />
        </div>
        <div className="lg:col-span-3">
          <KpiHeader kpis={kpis} />
        </div>
      </div>
      <StatusKpiRow kpis={kpis} />

      <section className="flex flex-col gap-3">
        <SectionHeader icon={Truck}>Status da frota (Relação Geral)</SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <ChartCard
            title="Dias offline"
            subtitle="Quantidade de veículos offline, agrupados por dias sem comunicação"
            className="md:col-span-2"
          >
            <AgingChart items={offlineAgingItems} />
          </ChartCard>
          <ChartCard
            title="Status do veículo"
            subtitle="Quantidade de veículos por status atual (Ativo, Manutenção, Frota ociosa...)"
          >
            <StatusVecChart items={statusVecItems} />
          </ChartCard>
          <ChartCard title="Regional" subtitle="Quantidade de veículos por regional">
            <BarList items={regionalItems} />
          </ChartCard>
          <ChartCard title="Estado" subtitle="Top 8 estados por nº de veículos">
            <BarList items={estadoItems} />
          </ChartCard>
          <ChartCard title="Clientes (MLP)" subtitle="Top 10 clientes por nº de veículos na frota">
            <BarList items={clienteFrotaItems} />
          </ChartCard>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader icon={Ticket}>Triagem de chamados (AGENDAMENTO)</SectionHeader>
        <ChartCard
          title="Chamados abertos por data"
          subtitle="Quantidade de chamados abertos por dia (campo Aberto em)"
        >
          <AgendamentoPorDataChart items={agendamentoPorDataItems} />
        </ChartCard>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <ChartCard title="Prioridade" subtitle="Quantidade de chamados por nível de prioridade">
            <PriorityChart items={prioridadeItems} />
          </ChartCard>
          <ChartCard title="Situação" subtitle="Quantidade de chamados por situação atual">
            <SituacaoChart items={situacaoItems} />
          </ChartCard>
          <ChartCard
            title="Tem chamado aberto?"
            subtitle="Quantos veículos offline têm um chamado aberto vs. nenhum chamado"
          >
            <BarList items={temChamadoItems} />
          </ChartCard>
          <ChartCard
            title="Dias desde última ação"
            subtitle="Quantidade de chamados por tempo sem nenhuma atualização — casos parados há mais tempo"
          >
            <AgingChart items={acaoAgingItems} />
          </ChartCard>
          <ChartCard
            title="Carga por responsável"
            subtitle="Top 8 responsáveis por nº de chamados atribuídos"
          >
            <BarList items={responsavelItems} />
          </ChartCard>
          <ChartCard title="Clientes" subtitle="Top 10 clientes por nº de chamados abertos">
            <BarList items={clienteTicketItems} />
          </ChartCard>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader icon={ListChecks}>Lista de ação</SectionHeader>
        <ActionableTable rows={actionableRows} />
      </section>
    </div>
  );
}
