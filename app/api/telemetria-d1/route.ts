import { NextRequest, NextResponse } from "next/server";

const EXTERNAL_BASE = "https://telemetria-dashboard-one.vercel.app";

function subtractOneDay(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function applyFilterParams(url: URL, searchParams: URLSearchParams): void {
  for (const key of ["regional", "transportadora", "svc"] as const) {
    const value = searchParams.get(key);
    if (value) url.searchParams.set(key, value);
  }
}

/**
 * Proxies the external telemetria BigQuery API (overview + placas) for a
 * filtered, day-old ("D-1") snapshot. Needed because that API sends no CORS
 * headers, so the browser can't call it directly; `date` is derived
 * server-side from `baseDate` (the already-fetched "today" snapshot date)
 * rather than trusting a client-supplied date.
 *
 * manutencao-risco is deliberately NOT included here — see
 * telemetria-d1-manutencao/route.ts — because that upstream endpoint is
 * known to be slow/flaky (50s+ sometimes) and would otherwise delay this
 * fast path (KPI card, bar lists, actionable table) on every filter change.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const baseDate = searchParams.get("baseDate");
  if (!baseDate || !/^\d{4}-\d{2}-\d{2}$/.test(baseDate)) {
    return NextResponse.json({ error: "baseDate (YYYY-MM-DD) is required" }, { status: 400 });
  }
  const date = subtractOneDay(baseDate);

  const overviewUrl = new URL(`${EXTERNAL_BASE}/api/telemetria`);
  overviewUrl.searchParams.set("date", date);
  applyFilterParams(overviewUrl, searchParams);

  const placasUrl = new URL(`${EXTERNAL_BASE}/api/telemetria/placas`);
  placasUrl.searchParams.set("faixa", "todas_offline");
  placasUrl.searchParams.set("limit", "50000");
  placasUrl.searchParams.set("date", date);
  applyFilterParams(placasUrl, searchParams);

  const [overviewRes, placasRes] = await Promise.all([
    fetch(overviewUrl.toString()),
    fetch(placasUrl.toString()),
  ]);
  if (!overviewRes.ok || !placasRes.ok) {
    return NextResponse.json({ error: "upstream error" }, { status: 502 });
  }

  const overviewData = (await overviewRes.json()) as {
    snapshotInfo?: { data_snapshot?: string };
    overview?: { em_rota_off?: number };
  };
  const placasData = (await placasRes.json()) as { rows?: unknown[] };

  return NextResponse.json({
    dataSnapshot: overviewData?.snapshotInfo?.data_snapshot ?? date,
    overview: overviewData?.overview ?? null,
    placas: Array.isArray(placasData?.rows) ? placasData.rows : [],
  });
}
