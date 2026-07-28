const EXTERNAL_BASE = "https://telemetria-dashboard-one.vercel.app";
const REVALIDATE_SECONDS = 600;

export interface DimensionBreakdown {
  total: number;
  online: number;
  offline: number;
  off_3_29: number;
  off_30_99: number;
  off_100_200: number;
  off_200_plus: number;
  em_rota_off: number;
  ativo_off: number;
  manut_off: number;
  ociosa_off: number;
  pct_offline: number;
  pct_em_rota_off: number;
}

export interface RegionalBreakdown extends DimensionBreakdown {
  regional: string;
  sem_instalacao: number;
}

export interface SubRegionalBreakdown extends DimensionBreakdown {
  sub_regional: string;
}

export interface TransportadoraBreakdown extends DimensionBreakdown {
  transportadora: string;
}

export interface SvcBreakdown extends DimensionBreakdown {
  svc: string;
}

export interface OverviewOverview {
  total_ff: number;
  online: number;
  total_offline: number;
  off_3_29: number;
  off_30_99: number;
  off_100_200: number;
  off_200_plus: number;
  sem_instalacao: number;
  sem_device: number;
  em_rota_off: number;
  ativo_off: number;
  manut_off: number;
  ociosa_off: number;
  implantacao_off: number;
  pct_offline: number;
  pct_online: number;
  pct_em_rota_off: number;
}

export interface OverviewResponse {
  updatedAt: string;
  snapshotInfo: {
    data_snapshot: string;
    geotab_api_pulled_at: string;
    vecfleet_ingested_at: string;
  };
  overview: OverviewOverview;
  regionais: RegionalBreakdown[];
  sub_regionais: SubRegionalBreakdown[];
  transportadoras: TransportadoraBreakdown[];
  svcs: SvcBreakdown[];
}

export interface PlacaOfflineRow {
  placa: string;
  transportadora: string;
  regional: string;
  svc: string;
  status_veiculo: string;
  status_agendamento: string;
  classificacao_agendamento: string;
  agendado: boolean;
  dias_offline: number;
  ultima_comunicacao: string;
}

interface PlacasResponse {
  updatedAt: string;
  total: number;
  rows: PlacaOfflineRow[];
}

export interface TendenciaPoint {
  data_referencia: string;
  semana: number;
  total_ff: number;
  online: number;
  offline: number;
  em_rota_off: number;
  manut_off: number;
  ociosa_off: number;
  pct_offline: number;
  pct_em_rota_off: number;
}

interface TendenciaResponse {
  updatedAt: string;
  geral: TendenciaPoint[];
}

export interface ManutencaoRiscoRow {
  placa: string;
  transportadora: string;
  regional: string;
  sub_regional: string;
  svc: string;
  dias_offline_atual: number;
  data_entrada_manutencao: string;
  classificacao: string;
  acao: string;
}

export interface ManutencaoRiscoResponse {
  updatedAt: string;
  summary: {
    base_manut_offline: number;
    classificados: number;
    ok_antes_manutencao: number;
    risco_sair_offline: number;
  };
  rows: ManutencaoRiscoRow[];
}

async function fetchJson<T>(url: string, timeoutMs?: number): Promise<T> {
  const init: RequestInit & { next?: { revalidate: number } } = {
    next: { revalidate: REVALIDATE_SECONDS },
  };
  if (!timeoutMs) {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
    return (await res.json()) as T;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function fetchOverview(): Promise<OverviewResponse> {
  return fetchJson<OverviewResponse>(`${EXTERNAL_BASE}/api/telemetria`);
}

export async function fetchOfflinePlacas(): Promise<PlacaOfflineRow[]> {
  const data = await fetchJson<PlacasResponse>(
    `${EXTERNAL_BASE}/api/telemetria/placas?faixa=todas_offline&limit=50000`
  );
  return data.rows;
}

export async function fetchTendencia(days: number): Promise<TendenciaPoint[]> {
  const data = await fetchJson<TendenciaResponse>(
    `${EXTERNAL_BASE}/api/telemetria/tendencia?granularidade=dia&days=${days}`
  );
  return data.geral;
}

export async function fetchExternalTelemetriaData() {
  const [overview, placas, tendencia] = await Promise.all([
    fetchOverview(),
    fetchOfflinePlacas(),
    fetchTendencia(60),
  ]);
  return { overview, placas, tendencia };
}
