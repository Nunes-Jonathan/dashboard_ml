import { NextRequest, NextResponse } from "next/server";

const EXTERNAL_BASE = "https://telemetria-dashboard-one.vercel.app";
const TIMEOUT_MS = 20000;

function subtractOneDay(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Proxies the external manutencao-risco endpoint for a filtered, day-old
 * ("D-1") snapshot, kept separate from telemetria-d1/route.ts so its known
 * slowness/flakiness (50s+ sometimes, matching fetchManutencaoRisco in
 * lib/externalTelemetria.ts) never blocks the faster overview/placas path.
 * Best-effort: returns manutencaoRisco: null on failure/timeout rather than
 * a 502, so the page can still render everything else.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const baseDate = searchParams.get("baseDate");
  if (!baseDate || !/^\d{4}-\d{2}-\d{2}$/.test(baseDate)) {
    return NextResponse.json({ error: "baseDate (YYYY-MM-DD) is required" }, { status: 400 });
  }
  const date = subtractOneDay(baseDate);

  const manutencaoUrl = new URL(`${EXTERNAL_BASE}/api/telemetria/manutencao-risco`);
  manutencaoUrl.searchParams.set("limit", "1000");
  manutencaoUrl.searchParams.set("date", date);
  for (const key of ["regional", "transportadora", "svc"] as const) {
    const value = searchParams.get(key);
    if (value) manutencaoUrl.searchParams.set(key, value);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(manutencaoUrl.toString(), { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const manutencaoRisco = await res.json();
    return NextResponse.json({ manutencaoRisco });
  } catch {
    return NextResponse.json({ manutencaoRisco: null });
  } finally {
    clearTimeout(timer);
  }
}
