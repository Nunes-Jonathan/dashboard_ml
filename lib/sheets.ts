import Papa from "papaparse";
import type { FleetRow, TicketRow } from "./types";

const SHEET_ID =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID ??
  "1cXG0i1o2agxd2OBZ56sEVPQ3PnOGFV4KyH0QCVrXBRI";

const REVALIDATE_SECONDS = 300;

function sheetUrl(sheetName: string): string {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    sheetName
  )}`;
}

/** Brazilian-formatted numbers use a comma decimal separator ("1,00"). */
function parseNum(value: string | undefined): number | null {
  if (!value) return null;
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/**
 * Fetches a sheet tab as CSV via the public gviz export (no Google auth
 * required — the sheet is link-shared) and returns rows keyed by trimmed
 * header. Parsed manually (header:false) rather than trusting papaparse's
 * header mode, because this sheet has several trailing blank-header columns.
 */
async function fetchSheetRows(sheetName: string): Promise<Record<string, string>[]> {
  const res = await fetch(sheetUrl(sheetName), {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch sheet "${sheetName}": HTTP ${res.status}`);
  }
  const csvText = await res.text();
  const parsed = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true,
  });
  const rows = parsed.data;
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => (r[0] ?? "").trim() !== "")
    .map((r) => {
      const obj: Record<string, string> = {};
      header.forEach((key, i) => {
        if (!key) return;
        obj[key] = (r[i] ?? "").trim();
      });
      return obj;
    });
}

export async function fetchFleetRows(): Promise<FleetRow[]> {
  const raw = await fetchSheetRows("Relação Geral");
  return raw.map((r) => ({
    placa: r["Placas"] ?? "",
    mlp: r["MLP"] ?? "",
    regional: r["regional"] ?? "",
    svc: r["SVC"] ?? "",
    statusVec: r["STATUS VEC"] ?? "",
    statusVeiculo: r["status_veiculo"] ?? "",
    statusAgendamento: r["status_agendamento"] ?? "",
    diasOffline: parseNum(r["dias_offline"]),
    ultimaComunicacao: r["ultima_comunicacao"] ?? "",
    estado: r["Estado"] ?? "",
    endereco: r["Endereço"] ?? "",
    ticket: r["Ticket"] ?? "",
    status: r["Status"] ?? "",
    statusDetalhado: r["Status detalhado"] ?? "",
    dataAgendamentoInicial: r["Data de agendamento Inicial"] ?? "",
    dataReagendamento: r["Data de REagendamento"] ?? "",
    qtdReagendamentos: parseNum(r["Qtd de Reagendamentos"]),
    dataComunicacao: r["Data de comunicação"] ?? "",
    dataHoraOffline: r["Data | Hora que identificou que ficar offline"] ?? "",
    os: r["OS"] ?? "",
    reincidente: parseNum(r["Veículo Reincidentes _ Voltou a ficar OFFLINE"]),
    observacoes: r["Observações"] ?? "",
    visibilidadeDash: r["Visibilidade Dash"] ?? "",
  }));
}

export async function fetchTicketRows(): Promise<TicketRow[]> {
  const raw = await fetchSheetRows("AGENDAMENTO");
  return raw.map((r) => ({
    placa: r["Placa"] ?? "",
    statusGeotab: r["status geotab"] ?? "",
    temChamado: r["Tem chamado?"] ?? "",
    qtdChamados: parseNum(r["Qtd chamados encontrados"]),
    chamadoPrincipal: r["Chamado principal"] ?? "",
    abertoEm: r["Aberto em"] ?? "",
    ultimaAcao: r["Última ação"] ?? "",
    diasDesdeUltimaAcao: parseNum(r["Dias desde última ação"]),
    situacao: r["Situação"] ?? "",
    prioridadeGuerra: r["Prioridade guerra"] ?? "",
    acaoSugerida: r["Ação sugerida"] ?? "",
    cliente: r["Cliente"] ?? "",
    clienteOrigem: r["Cliente Origem"] ?? "",
    responsavel: r["Responsável"] ?? "",
    statusOriginal: r["Status original"] ?? "",
    statusNorm: r["status norm"] ?? "",
    justificativa: r["Justificativa"] ?? "",
  }));
}

export async function fetchDashboardData() {
  const [fleet, tickets] = await Promise.all([fetchFleetRows(), fetchTicketRows()]);
  return { fleet, tickets };
}
