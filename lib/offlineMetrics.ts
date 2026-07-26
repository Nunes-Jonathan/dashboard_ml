import type { PlacaOfflineRow } from "./externalTelemetria";
import type { TicketRow } from "./types";
import { bucketValues, indexByPlaca, normPlaca, resolveCliente, type CountItem, type FilterState } from "./metrics";

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
 * transportadora here. Cliente/Responsável/Prioridade live only on the
 * ticket side, so ticket-driven filters are cross-checked against the
 * joined placa row and vice versa.
 */
export function applyOfflineFilters(
  placas: PlacaOfflineRow[],
  tickets: TicketRow[],
  filters: FilterState
): { placas: PlacaOfflineRow[]; tickets: TicketRow[] } {
  const ticketByPlaca = indexByPlaca(tickets);
  const placaByPlaca = indexByPlaca(placas);

  const filteredPlacas = placas.filter((p) => {
    if (filters.mlp && p.transportadora !== filters.mlp) return false;
    if (filters.svc && p.svc !== filters.svc) return false;
    if (filters.regional && p.regional !== filters.regional) return false;
    const t = ticketByPlaca.get(normPlaca(p.placa));
    if (filters.cliente && (resolveCliente(t, undefined) || p.transportadora) !== filters.cliente)
      return false;
    if (filters.responsavel && (t?.responsavel ?? "") !== filters.responsavel) return false;
    if (filters.prioridade && (t?.prioridadeGuerra ?? "") !== filters.prioridade) return false;
    return true;
  });

  const filteredTickets = tickets.filter((t) => {
    const p = placaByPlaca.get(normPlaca(t.placa));
    if (filters.mlp && (p?.transportadora ?? "") !== filters.mlp) return false;
    if (filters.svc && (p?.svc ?? "") !== filters.svc) return false;
    if (filters.regional && (p?.regional ?? "") !== filters.regional) return false;
    if (filters.cliente && (resolveCliente(t, undefined) || p?.transportadora || "") !== filters.cliente)
      return false;
    if (filters.responsavel && t.responsavel !== filters.responsavel) return false;
    if (filters.prioridade && t.prioridadeGuerra !== filters.prioridade) return false;
    return true;
  });

  return { placas: filteredPlacas, tickets: filteredTickets };
}

/** Same 4-bucket aging scheme the external API uses (off_3_29/off_30_99/off_100_200/off_200_plus). */
export function bucketDiasOfflineExternal(values: number[]): CountItem[] {
  return bucketValues(values, [
    [3, 29, "3-29 dias"],
    [30, 99, "30-99 dias"],
    [100, 199, "100-199 dias"],
    [200, Infinity, "200+ dias"],
  ]);
}
