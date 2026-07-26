"use client";

import { useMemo, useState } from "react";
import type { ActionableRow } from "@/lib/types";

type SortKey = keyof Pick<
  ActionableRow,
  | "placa"
  | "cliente"
  | "mlp"
  | "svc"
  | "regional"
  | "diasOffline"
  | "prioridadeGuerra"
  | "situacao"
  | "responsavel"
>;

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "placa", label: "Placa" },
  { key: "mlp", label: "MLP" },
  { key: "cliente", label: "Cliente" },
  { key: "regional", label: "Regional" },
  { key: "svc", label: "SVC" },
  { key: "diasOffline", label: "Dias offline" },
  { key: "prioridadeGuerra", label: "Prioridade" },
  { key: "situacao", label: "Situação" },
  { key: "responsavel", label: "Responsável" },
];

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function priorityRank(label: string): number {
  const l = label.toLowerCase();
  if (l.includes("crítica") || l.includes("critica")) return 0;
  if (l.includes("alta")) return 1;
  if (l.includes("média") || l.includes("media")) return 2;
  return 3;
}

export default function ActionableTable({ rows }: { rows: ActionableRow[] }) {
  const [search, setSearch] = useState("");
  const [cliente, setCliente] = useState("");
  const [mlp, setMlp] = useState("");
  const [svc, setSvc] = useState("");
  const [regional, setRegional] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [semChamadoOnly, setSemChamadoOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("diasOffline");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const clientes = useMemo(() => uniqueSorted(rows.map((r) => r.cliente)), [rows]);
  const mlps = useMemo(() => uniqueSorted(rows.map((r) => r.mlp)), [rows]);
  const svcs = useMemo(() => uniqueSorted(rows.map((r) => r.svc)), [rows]);
  const regionais = useMemo(() => uniqueSorted(rows.map((r) => r.regional)), [rows]);
  const responsaveis = useMemo(() => uniqueSorted(rows.map((r) => r.responsavel)), [rows]);
  const prioridades = useMemo(() => uniqueSorted(rows.map((r) => r.prioridadeGuerra)), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    let out = rows.filter((r) => {
      if (q && !r.placa.toUpperCase().includes(q)) return false;
      if (cliente && r.cliente !== cliente) return false;
      if (mlp && r.mlp !== mlp) return false;
      if (svc && r.svc !== svc) return false;
      if (regional && r.regional !== regional) return false;
      if (responsavel && r.responsavel !== responsavel) return false;
      if (prioridade && r.prioridadeGuerra !== prioridade) return false;
      if (semChamadoOnly && r.temChamado.trim().toLowerCase() !== "não") return false;
      return true;
    });

    out = out.sort((a, b) => {
      let cmp: number;
      if (sortKey === "diasOffline") {
        cmp = (a.diasOffline ?? -1) - (b.diasOffline ?? -1);
      } else if (sortKey === "prioridadeGuerra") {
        cmp = priorityRank(a.prioridadeGuerra) - priorityRank(b.prioridadeGuerra);
      } else {
        cmp = (a[sortKey] as string).localeCompare(b[sortKey] as string, "pt-BR");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return out;
  }, [
    rows,
    search,
    cliente,
    mlp,
    svc,
    regional,
    responsavel,
    prioridade,
    semChamadoOnly,
    sortKey,
    sortDir,
  ]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const selectClass =
    "rounded-md border bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--ink)]";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Buscar placa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${selectClass} w-40`}
          style={{ borderColor: "var(--border)" }}
        />
        <select
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          className={selectClass}
          style={{ borderColor: "var(--border)" }}
        >
          <option value="">Todos os clientes</option>
          {clientes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={mlp}
          onChange={(e) => setMlp(e.target.value)}
          className={selectClass}
          style={{ borderColor: "var(--border)" }}
        >
          <option value="">Todos os MLPs</option>
          {mlps.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={svc}
          onChange={(e) => setSvc(e.target.value)}
          className={selectClass}
          style={{ borderColor: "var(--border)" }}
        >
          <option value="">Todos os SVC</option>
          {svcs.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={regional}
          onChange={(e) => setRegional(e.target.value)}
          className={selectClass}
          style={{ borderColor: "var(--border)" }}
        >
          <option value="">Todas as regionais</option>
          {regionais.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          className={selectClass}
          style={{ borderColor: "var(--border)" }}
        >
          <option value="">Todos os responsáveis</option>
          {responsaveis.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={prioridade}
          onChange={(e) => setPrioridade(e.target.value)}
          className={selectClass}
          style={{ borderColor: "var(--border)" }}
        >
          <option value="">Todas as prioridades</option>
          {prioridades.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-[var(--ink-secondary)]">
          <input
            type="checkbox"
            checked={semChamadoOnly}
            onChange={(e) => setSemChamadoOnly(e.target.checked)}
          />
          Só sem chamado
        </label>
        <span className="ml-auto text-xs text-[var(--ink-muted)] tabular-nums">
          {filtered.length} de {rows.length}
        </span>
      </div>

      <div
        className="overflow-auto rounded-lg border max-h-[560px]"
        style={{ borderColor: "var(--border)" }}
      >
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[var(--surface)]">
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  {col.label}
                  {sortKey === col.key && (sortDir === "asc" ? " ▲" : " ▼")}
                </th>
              ))}
              <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">
                Ação sugerida
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map((r, i) => (
              <tr
                key={`${r.placa}-${i}`}
                style={{ borderBottom: "1px solid var(--border)" }}
                className="hover:bg-[var(--page)]"
              >
                <td className="px-3 py-2 font-medium tabular-nums text-[var(--ink)]">{r.placa}</td>
                <td className="px-3 py-2 text-[var(--ink-secondary)]">{r.mlp || "—"}</td>
                <td className="px-3 py-2 text-[var(--ink-secondary)]">{r.cliente || "—"}</td>
                <td className="px-3 py-2 text-[var(--ink-secondary)]">{r.regional || "—"}</td>
                <td className="px-3 py-2 text-[var(--ink-secondary)]">{r.svc || "—"}</td>
                <td className="px-3 py-2 tabular-nums text-[var(--ink)]">
                  {r.diasOffline ?? "—"}
                </td>
                <td className="px-3 py-2 text-[var(--ink-secondary)]">{r.prioridadeGuerra || "—"}</td>
                <td className="px-3 py-2 text-[var(--ink-secondary)]">{r.situacao || "—"}</td>
                <td className="px-3 py-2 text-[var(--ink-secondary)]">{r.responsavel || "—"}</td>
                <td className="px-3 py-2 text-[var(--ink-muted)] max-w-xs truncate" title={r.acaoSugerida}>
                  {r.acaoSugerida || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > 200 && (
        <p className="text-xs text-[var(--ink-muted)]">
          Mostrando 200 de {filtered.length} resultados — refine os filtros para ver mais.
        </p>
      )}
    </div>
  );
}
