import type {
  DeviceGroupRow,
  FaultMonitoringRow,
  LatestVehicleMetadataRow,
  VehicleKpiDailyRow,
} from "./geotab";
import type { TicketRow } from "./types";
import { indexByPlaca, normPlaca, resolveCliente, type FilterState } from "./metrics";

/** Some devices (spares/newly provisioned) have no DeviceName at all in practice. */
export function parsePlacaFromDeviceName(deviceName: string | null | undefined): string {
  if (!deviceName) return "";
  const [first] = deviceName.split(" | ");
  return (first ?? deviceName).trim();
}

export interface DeviceDimensions {
  regional: string;
  svc: string;
  mlp: string;
  locadora: string;
}

/**
 * DeviceGroups membership encodes our existing Regional/SVC/MLP/Locadora
 * taxonomy in its GroupName prefixes (e.g. "SVC_SPA1 - Belém", "MLP_RODACOOP",
 * "Regional MG"/"RG_NONECO") — this is the crosswalk from Geotab devices into
 * the same dimensions the rest of the app filters by.
 */
export function buildDeviceGroupMap(groups: DeviceGroupRow[]): Map<string, DeviceDimensions> {
  const map = new Map<string, DeviceDimensions>();
  for (const g of groups) {
    const dims = map.get(g.DeviceId) ?? { regional: "", svc: "", mlp: "", locadora: "" };
    const name = g.GroupName;
    if (name.startsWith("SVC_")) {
      dims.svc = name.slice(4).split(" - ")[0].trim();
    } else if (name.startsWith("MLP_")) {
      dims.mlp = name.slice(4).trim();
    } else if (name.startsWith("LOC_")) {
      dims.locadora = name.slice(4).trim();
    } else if (name.startsWith("Regional ")) {
      dims.regional = name.slice("Regional ".length).trim();
    }
    map.set(g.DeviceId, dims);
  }
  return map;
}

/**
 * LatestVehicleMetadata is mostly historical stubs (measured ~73% of the
 * table) from past vehicle↔device assignment periods — only the row with
 * this far-future DateTo sentinel reflects the device's actual current
 * state. Naively deduping by "first occurrence" picks essentially a random
 * (usually stale) record, which was producing a wildly wrong fleet-wide
 * offline percentage.
 */
function isCurrentRecord(row: LatestVehicleMetadataRow): boolean {
  return Boolean(row.DateTo && row.DateTo > "2030-01-01");
}

export function buildDeviceIdToPlacaMap(latest: LatestVehicleMetadataRow[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of latest) {
    if (!isCurrentRecord(row) || map.has(row.DeviceId)) continue;
    const placa = parsePlacaFromDeviceName(row.DeviceName);
    if (placa) map.set(row.DeviceId, placa);
  }
  return map;
}

export interface GeotabActionableRow {
  placa: string;
  deviceId: string;
  regional: string;
  svc: string;
  mlp: string;
  locadora: string;
  deviceHealth: string;
  isOffline: boolean;
  lastGpsDateTime: string | null;
  lastOdometerKm: number | null;
  activeVehicleFaults: number;
  activeDeviceFaults: number;
  cliente: string;
  prioridadeGuerra: string;
  situacao: string;
  responsavel: string;
  acaoSugerida: string;
  temChamado: string;
}

function isOfflineHealth(health: string): boolean {
  return health.toLowerCase().includes("did not communicate");
}

/**
 * Only the current record per device (see isCurrentRecord) is used — the
 * rest of the table is historical noise. Devices with no DeviceName
 * (spares/newly provisioned, not yet assigned to a plate) or with no current
 * record at all (no active assignment) are skipped.
 */
export function buildGeotabActionableRows(
  latest: LatestVehicleMetadataRow[],
  groupMap: Map<string, DeviceDimensions>,
  tickets: TicketRow[]
): GeotabActionableRow[] {
  const ticketByPlaca = indexByPlaca(tickets);
  const seenDevices = new Set<string>();
  const rows: GeotabActionableRow[] = [];

  for (const row of latest) {
    if (!isCurrentRecord(row) || seenDevices.has(row.DeviceId)) continue;
    seenDevices.add(row.DeviceId);

    const placa = parsePlacaFromDeviceName(row.DeviceName);
    if (!placa) continue;
    const dims = groupMap.get(row.DeviceId) ?? { regional: "", svc: "", mlp: "", locadora: "" };
    const t = ticketByPlaca.get(normPlaca(placa));

    rows.push({
      placa,
      deviceId: row.DeviceId,
      regional: dims.regional,
      svc: dims.svc,
      mlp: dims.mlp,
      locadora: dims.locadora,
      deviceHealth: row.Device_Health,
      isOffline: isOfflineHealth(row.Device_Health),
      lastGpsDateTime: row.LastGps_DateTime,
      lastOdometerKm: row.LastOdometer_Km,
      activeVehicleFaults: row.Last24Hours_ActiveVehicleFaults ?? 0,
      activeDeviceFaults: row.Last24Hours_ActiveDeviceFaults ?? 0,
      cliente: resolveCliente(t, undefined) || dims.mlp,
      prioridadeGuerra: t?.prioridadeGuerra ?? "",
      situacao: t?.situacao ?? "",
      responsavel: t?.responsavel ?? "",
      acaoSugerida: t?.acaoSugerida ?? "",
      temChamado: t?.temChamado ?? "",
    });
  }

  return rows;
}

/** Rows here are already a single joined shape, so filtering is a plain predicate (no cross-join needed). */
export function applyGeotabFilters(
  rows: GeotabActionableRow[],
  filters: FilterState
): GeotabActionableRow[] {
  return rows.filter((r) => {
    if (filters.mlp && r.mlp !== filters.mlp) return false;
    if (filters.svc && r.svc !== filters.svc) return false;
    if (filters.regional && r.regional !== filters.regional) return false;
    return true;
  });
}

export interface GeotabFaultRow {
  placa: string;
  deviceId: string;
  regional: string;
  svc: string;
  mlp: string;
  faultCodeDescription: string;
  diagnosticType: string;
  activeCount: number;
  breakdownRisk: string | null;
  activeDateTimeLastSeen: string | null;
}

export function buildGeotabFaultRows(
  faults: FaultMonitoringRow[],
  deviceIdToPlaca: Map<string, string>,
  groupMap: Map<string, DeviceDimensions>
): GeotabFaultRow[] {
  return faults
    .filter((f) => (f.ActiveCount ?? 0) > 0)
    .map((f) => {
      const dims = groupMap.get(f.DeviceId) ?? { regional: "", svc: "", mlp: "", locadora: "" };
      return {
        placa: deviceIdToPlaca.get(f.DeviceId) ?? f.DeviceId,
        deviceId: f.DeviceId,
        regional: dims.regional,
        svc: dims.svc,
        mlp: dims.mlp,
        faultCodeDescription: f.FaultCodeDescription,
        diagnosticType: f.DiagnosticType,
        activeCount: f.ActiveCount ?? 0,
        breakdownRisk: f.BreakdownRisk,
        activeDateTimeLastSeen: f.ActiveDateTimeLastSeen,
      };
    });
}

export interface DailyHealthPoint {
  data_referencia: string;
  pct_offline: number;
}

export function buildDailyHealthTrend(daily: VehicleKpiDailyRow[]): DailyHealthPoint[] {
  const byDate = new Map<string, { total: number; offline: number }>();
  for (const row of daily) {
    const bucket = byDate.get(row.Local_Date) ?? { total: 0, offline: 0 };
    bucket.total += 1;
    if (isOfflineHealth(row.Device_Health)) bucket.offline += 1;
    byDate.set(row.Local_Date, bucket);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data_referencia, { total, offline }]) => ({
      data_referencia,
      pct_offline: total ? (offline / total) * 100 : 0,
    }));
}
