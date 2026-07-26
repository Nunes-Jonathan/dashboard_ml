const ODATA_ENTRY = "https://data-connector.geotab.com/odata/v4/svc";
const REVALIDATE_SECONDS = 600;
/** Every request needs a timeout — a stalled connection with none hangs a serverless invocation forever. */
const DEFAULT_TIMEOUT_MS = 45000;

function authHeader(): string {
  const database = process.env.GEOTAB_DATABASE;
  const username = process.env.GEOTAB_USERNAME;
  const password = process.env.GEOTAB_PASSWORD;
  if (!database || !username || !password) {
    throw new Error("Missing GEOTAB_DATABASE/GEOTAB_USERNAME/GEOTAB_PASSWORD env vars");
  }
  const token = Buffer.from(`${database}/${username}:${password}`).toString("base64");
  return `Basic ${token}`;
}

/**
 * The stable entry point (`data-connector.geotab.com`) 302-redirects to a
 * per-account shard (e.g. `odata-connector-5.geotab.com`). Testing showed
 * requests THROUGH that redirect are noticeably flaky under Node's fetch
 * (repeated 403s that didn't reproduce via curl or via direct shard
 * requests) — resolving the shard once and hitting it directly for entity
 * requests was reliable across every repeat test. Cached at module scope so
 * a warm serverless instance only resolves it once.
 */
let resolvedBasePromise: Promise<string> | null = null;

/** Caches the in-flight promise (not just the resolved value) so concurrent callers share one resolution request instead of each firing their own. */
async function resolveBase(): Promise<string> {
  if (!resolvedBasePromise) {
    resolvedBasePromise = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(`${ODATA_ENTRY}/`, {
          headers: { Authorization: authHeader() },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      if (!res.ok) throw new Error(`Failed to resolve Geotab OData shard: HTTP ${res.status}`);
      await res.text();
      const url = new URL(res.url);
      return `${url.origin}${url.pathname}`.replace(/\/$/, "");
    })();
  }
  try {
    return await resolvedBasePromise;
  } catch (err) {
    resolvedBasePromise = null;
    throw err;
  }
}

/**
 * The connector has also been observed to return a transient 403 even on the
 * resolved shard occasionally — retried up to 3 attempts with growing
 * backoff.
 */
async function fetchGeotabEntity<T>(path: string, timeoutMs?: number): Promise<T[]> {
  async function attempt(): Promise<T[]> {
    const base = await resolveBase();
    const init: RequestInit & { next?: { revalidate: number } } = {
      headers: { Authorization: authHeader() },
      next: { revalidate: REVALIDATE_SECONDS },
    };
    if (!timeoutMs) {
      const res = await fetch(`${base}${path}`, init);
      if (!res.ok) throw new Error(`Geotab OData request failed for ${path}: HTTP ${res.status}`);
      const data = (await res.json()) as { value: T[] };
      return data.value;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${base}${path}`, { ...init, signal: controller.signal });
      if (!res.ok) throw new Error(`Geotab OData request failed for ${path}: HTTP ${res.status}`);
      const data = (await res.json()) as { value: T[] };
      return data.value;
    } finally {
      clearTimeout(timer);
    }
  }

  const backoffsMs = [1500, 4000];
  for (const backoff of backoffsMs) {
    try {
      return await attempt();
    } catch {
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  return attempt();
}

export interface LatestVehicleMetadataRow {
  DeviceId: string;
  DeviceName: string | null;
  SerialNo: string;
  VIN: string | null;
  /** "2050-01-01T00:00:00Z" sentinel marks the currently-active record — most rows are superseded historical stubs (measured ~73% of the table), so DO NOT dedupe by "first occurrence"; select the row with this sentinel per DeviceId. */
  DateTo: string | null;
  LastGps_DateTime: string | null;
  LastGps_Latitude: number | null;
  LastGps_Longitude: number | null;
  LastGps_Speed: number | null;
  LastOdometer_DateTime: string | null;
  LastOdometer_Km: number | null;
  Last24Hours_ActiveVehicleFaults: number | null;
  Last24Hours_ActiveDeviceFaults: number | null;
  Device_Health: string;
  DeviceTimeZoneId: string | null;
}

/** Measured true table size ~51k rows (not capped by this $top) — includes historical stubs, see DateTo doc above. */
export function fetchLatestVehicleMetadata(): Promise<LatestVehicleMetadataRow[]> {
  return fetchGeotabEntity<LatestVehicleMetadataRow>(
    "/LatestVehicleMetadata?$top=60000",
    DEFAULT_TIMEOUT_MS
  );
}

export interface FaultMonitoringRow {
  DeviceId: string;
  FaultCode: string;
  FaultCodeDescription: string;
  DiagnosticType: string;
  ActiveDateTimeFirstSeen: string | null;
  ActiveDateTimeLastSeen: string | null;
  ActiveCount: number | null;
  PendingCount: number | null;
  ConfirmedCount: number | null;
  BreakdownRisk: string | null;
}

/** Measured true table size ~62k rows — the earlier $top=20000 was silently truncating two-thirds of it. */
export function fetchFaultMonitoring(): Promise<FaultMonitoringRow[]> {
  return fetchGeotabEntity<FaultMonitoringRow>("/FaultMonitoring?$top=70000", DEFAULT_TIMEOUT_MS);
}

export interface DeviceGroupRow {
  DeviceId: string;
  GroupId: string;
  GroupName: string;
}

const RELEVANT_GROUP_PREFIXES = ["SVC_", "MLP_", "LOC_", "Regional"];

/**
 * This table is enormous (measured 300k+ rows total — a full org hierarchy:
 * asset type, powertrain, reports, etc, not just the 4 dimensions we care
 * about) and doesn't support an `or` filter (confirmed via testing — the
 * connector 400s on it), so fetch one `startswith` query per prefix instead
 * of trying to raise `$top` to cover the whole table.
 */
export async function fetchDeviceGroups(): Promise<DeviceGroupRow[]> {
  const results = await Promise.all(
    RELEVANT_GROUP_PREFIXES.map((prefix) =>
      fetchGeotabEntity<DeviceGroupRow>(
        `/DeviceGroups?$filter=startswith(GroupName,'${prefix}')&$top=30000`,
        DEFAULT_TIMEOUT_MS
      )
    )
  );
  return results.flat();
}

export interface VehicleKpiDailyRow {
  Local_Date: string;
  DeviceId: string;
  Distance_Km: number | null;
  Trip_Count: number | null;
  Stops_Count: number | null;
  Device_Health: string;
}

/**
 * Local_Date is Edm.Date — the connector rejects a quoted string literal,
 * confirmed via testing. This table only actually retains ~7 days of history
 * (measured: a "last 7 days" and a "last 30 days" filter both returned the
 * identical 97,103 rows — the table simply has no older data), so there's no
 * value in requesting a wider window. It's still large for what it is
 * (~13.9k rows/day, ~115MB/~44-50s for the full 7 days), so this is
 * best-effort with a generous timeout: returns [] rather than failing the
 * whole page if it's ever slower than that.
 */
export async function fetchVehicleKpiDaily(days: number): Promise<VehicleKpiDailyRow[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  const sinceIso = since.toISOString().slice(0, 10);
  try {
    return await fetchGeotabEntity<VehicleKpiDailyRow>(
      `/VehicleKpi_Daily?$filter=Local_Date ge ${sinceIso}&$top=200000`,
      70000
    );
  } catch {
    return [];
  }
}

/**
 * The earlier flakiness traced back to requests going through the
 * redirecting entry URL, not to concurrency itself (see resolveBase above) —
 * resolving the shard first, then firing the three fast entities
 * concurrently against it, was reliable in testing. VehicleKpi_Daily is kept
 * separate: it's much larger/slower with its own timeout+fallback, so it
 * shouldn't hold up the page's static-generation budget alongside the rest.
 */
export async function fetchGeotabData(days: number) {
  await resolveBase();
  const [latestVehicleMetadata, faultMonitoring, deviceGroups] = await Promise.all([
    fetchLatestVehicleMetadata(),
    fetchFaultMonitoring(),
    fetchDeviceGroups(),
  ]);
  const vehicleKpiDaily = await fetchVehicleKpiDaily(days);
  return { latestVehicleMetadata, faultMonitoring, deviceGroups, vehicleKpiDaily };
}
