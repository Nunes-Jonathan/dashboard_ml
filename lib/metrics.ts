import type { ActionableRow, FleetRow, TicketRow } from "./types";

export interface CountItem {
  label: string;
  count: number;
}

function normLabel(v: string): string {
  const t = v.trim();
  if (t === "" || t.toUpperCase() === "#N/A") return "Não informado";
  return t;
}

export function countBy(values: string[]): CountItem[] {
  const map = new Map<string, number>();
  for (const v of values) {
    const label = normLabel(v);
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export function topN(items: CountItem[], n: number): CountItem[] {
  if (items.length <= n) return items;
  const head = items.slice(0, n);
  const rest = items.slice(n).reduce((sum, i) => sum + i.count, 0);
  return rest > 0 ? [...head, { label: "Outros", count: rest }] : head;
}

const OFFLINE_BUCKETS: [number, number, string][] = [
  [0, 0, "0 dias"],
  [1, 3, "1-3 dias"],
  [4, 7, "4-7 dias"],
  [8, 30, "8-30 dias"],
  [31, 90, "31-90 dias"],
  [91, Infinity, "90+ dias"],
];

function bucketValues(values: (number | null)[], buckets: [number, number, string][]): CountItem[] {
  const counts = buckets.map(([, , label]) => ({ label, count: 0 }));
  for (const v of values) {
    if (v === null) continue;
    const idx = buckets.findIndex(([min, max]) => v >= min && v <= max);
    if (idx >= 0) counts[idx].count += 1;
  }
  return counts;
}

export function bucketDiasOffline(values: (number | null)[]): CountItem[] {
  return bucketValues(values, OFFLINE_BUCKETS);
}

const ACAO_BUCKETS: [number, number, string][] = [
  [0, 1, "0-1 dias"],
  [2, 3, "2-3 dias"],
  [4, 7, "4-7 dias"],
  [8, 14, "8-14 dias"],
  [15, Infinity, "15+ dias"],
];

export function bucketDiasDesdeAcao(values: (number | null)[]): CountItem[] {
  return bucketValues(values, ACAO_BUCKETS);
}

/**
 * Groups timestamp strings like "2026-07-14 10:32:00" by calendar day and
 * returns them in chronological order (a time series, unlike countBy/topN
 * which rank by magnitude), filling gaps between the first and last day with
 * zero counts so the chart reads as a continuous calendar, not just the days
 * that happened to have activity.
 */
export function countByDate(values: string[]): CountItem[] {
  const counts = new Map<string, number>();
  for (const v of values) {
    const isoDay = v.trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) continue;
    counts.set(isoDay, (counts.get(isoDay) ?? 0) + 1);
  }
  if (counts.size === 0) return [];

  const days = [...counts.keys()].sort();
  const cursor = new Date(`${days[0]}T00:00:00Z`);
  const end = new Date(`${days[days.length - 1]}T00:00:00Z`);
  const out: CountItem[] = [];
  while (cursor.getTime() <= end.getTime()) {
    const isoDay = cursor.toISOString().slice(0, 10);
    const [, month, day] = isoDay.split("-");
    out.push({ label: `${day}/${month}`, count: counts.get(isoDay) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export interface DashboardKpis {
  totalVehicles: number;
  offlineCount: number;
  offlinePct: number;
  noTicketCount: number;
  noTicketPct: number;
  avgDiasOffline: number | null;
  maxDiasOffline: number | null;
  openCases: number;
  totalCases: number;
  resolvedPct: number;
  offlineEmRota: number;
  statusPendente: number;
  statusTratativa: number;
  statusAgendado: number;
}

export function computeKpis(fleet: FleetRow[], tickets: TicketRow[]): DashboardKpis {
  const totalVehicles = fleet.length;
  const offline = fleet.filter((f) => (f.diasOffline ?? 0) > 0);
  const diasOfflineValues = offline.map((f) => f.diasOffline as number);

  const totalCases = tickets.length;
  const noTicket = tickets.filter((t) => t.temChamado.trim().toLowerCase() === "não");
  const open = tickets.filter((t) => t.statusNorm.trim().toLowerCase() === "aberto");
  const resolved = tickets.filter((t) =>
    t.statusNorm.trim().toLowerCase().startsWith("fechado")
  );

  const offlineEmRota = offline.filter((f) =>
    f.statusVec.trim().toLowerCase().startsWith("ativo")
  ).length;
  const statusPendente = fleet.filter((f) => f.status.trim().toLowerCase() === "pendente").length;
  const statusTratativa = fleet.filter(
    (f) => f.status.trim().toLowerCase() === "em tratativa"
  ).length;
  const statusAgendado = fleet.filter((f) => f.status.trim().toLowerCase() === "agendado").length;

  return {
    totalVehicles,
    offlineCount: offline.length,
    offlinePct: totalVehicles ? (offline.length / totalVehicles) * 100 : 0,
    noTicketCount: noTicket.length,
    noTicketPct: totalCases ? (noTicket.length / totalCases) * 100 : 0,
    avgDiasOffline: avg(diasOfflineValues),
    maxDiasOffline: diasOfflineValues.length ? Math.max(...diasOfflineValues) : null,
    openCases: open.length,
    totalCases,
    resolvedPct: totalCases ? (resolved.length / totalCases) * 100 : 0,
    offlineEmRota,
    statusPendente,
    statusTratativa,
    statusAgendado,
  };
}

function normPlaca(v: string): string {
  return v.trim().toUpperCase();
}

export function buildActionableRows(fleet: FleetRow[], tickets: TicketRow[]): ActionableRow[] {
  const fleetByPlaca = new Map<string, FleetRow>();
  for (const f of fleet) {
    if (f.placa) fleetByPlaca.set(normPlaca(f.placa), f);
  }

  return tickets
    .filter((t) => t.placa)
    .map((t) => {
      const fleetRow = fleetByPlaca.get(normPlaca(t.placa));
      return {
        placa: t.placa,
        cliente: t.clienteOrigem || t.cliente || fleetRow?.mlp || "",
        mlp: fleetRow?.mlp ?? "",
        svc: fleetRow?.svc ?? "",
        regional: fleetRow?.regional ?? "",
        statusVec: fleetRow?.statusVec ?? "",
        diasOffline: fleetRow?.diasOffline ?? null,
        temChamado: t.temChamado,
        prioridadeGuerra: t.prioridadeGuerra,
        situacao: t.situacao,
        responsavel: t.responsavel,
        acaoSugerida: t.acaoSugerida,
      };
    });
}

export function round1(n: number | null): string {
  if (n === null) return "—";
  return n.toFixed(1).replace(".", ",");
}
