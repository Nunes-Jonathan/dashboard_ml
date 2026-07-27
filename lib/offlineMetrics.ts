import type { PlacaOfflineRow } from "./externalTelemetria";
import type { TicketRow } from "./types";
import { indexByPlaca, normPlaca, resolveCliente, type FilterState } from "./metrics";

export interface OfflineActionableRow {
  placa: string;
  transportadora: string;
  regional: string;
  svc: string;
  statusVeiculo: string;
  diasOffline: number;
  classificacaoAgendamento: string;
  agendado: boolean;
  ultimaComunicacao: string;
  cliente: string;
  prioridadeGuerra: string;
  situacao: string;
  responsavel: string;
  acaoSugerida: string;
  temChamado: string;
}

/**
 * Joins the external app's offline-vehicle list with our own AGENDAMENTO
 * triage sheet by placa, the same pattern as buildActionableRows in
 * lib/metrics.ts. The external rows don't carry a "cliente" field of their
 * own, so resolveCliente falls back to the ticket's Cliente Origem/Cliente,
 * then to the external row's transportadora.
 */
export function buildOfflineActionableRows(
  placas: PlacaOfflineRow[],
  tickets: TicketRow[]
): OfflineActionableRow[] {
  const ticketByPlaca = indexByPlaca(tickets);

  return placas
    .filter((p) => p.placa)
    .map((p) => {
      const t = ticketByPlaca.get(normPlaca(p.placa));
      return {
        placa: p.placa,
        transportadora: p.transportadora,
        regional: p.regional,
        svc: p.svc,
        statusVeiculo: p.status_veiculo,
        diasOffline: p.dias_offline,
        classificacaoAgendamento: p.classificacao_agendamento,
        agendado: p.agendado,
        ultimaComunicacao: p.ultima_comunicacao,
        cliente: t ? resolveCliente(t, undefined) || p.transportadora : p.transportadora,
        prioridadeGuerra: t?.prioridadeGuerra ?? "",
        situacao: t?.situacao ?? "",
        responsavel: t?.responsavel ?? "",
        acaoSugerida: t?.acaoSugerida ?? "",
        temChamado: t?.temChamado ?? "",
      };
    });
}

/**
 * Same "shared slicer" idea as applyFilters in lib/metrics.ts: mlp maps to
 * transportadora here, cross-checked against the joined placa/ticket row.
 */
export function applyOfflineFilters(
  placas: PlacaOfflineRow[],
  tickets: TicketRow[],
  filters: FilterState
): { placas: PlacaOfflineRow[]; tickets: TicketRow[] } {
  const placaByPlaca = indexByPlaca(placas);

  const filteredPlacas = placas.filter((p) => {
    if (filters.mlp && p.transportadora !== filters.mlp) return false;
    if (filters.svc && p.svc !== filters.svc) return false;
    if (filters.regional && p.regional !== filters.regional) return false;
    return true;
  });

  const filteredTickets = tickets.filter((t) => {
    const p = placaByPlaca.get(normPlaca(t.placa));
    if (filters.mlp && (p?.transportadora ?? "") !== filters.mlp) return false;
    if (filters.svc && (p?.svc ?? "") !== filters.svc) return false;
    if (filters.regional && (p?.regional ?? "") !== filters.regional) return false;
    return true;
  });

  return { placas: filteredPlacas, tickets: filteredTickets };
}
