"use client";

import type { FilterState } from "@/lib/metrics";

interface FilterBarProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  options: {
    mlps: string[];
    svcs: string[];
    regionais: string[];
    clientes: string[];
    responsaveis: string[];
    prioridades: string[];
  };
}

const selectClass = "rounded-md border bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--ink)]";

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={selectClass}
      style={{ borderColor: "var(--border)" }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export default function FilterBar({ filters, onChange, options }: FilterBarProps) {
  const active = Object.values(filters).some(Boolean);

  function set(key: keyof FilterState, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-xl border p-3 bg-[var(--surface)]"
      style={{ borderColor: "var(--border)" }}
    >
      <span className="text-xs font-medium text-[var(--ink-muted)] mr-1">Filtros:</span>
      <FilterSelect
        value={filters.mlp}
        onChange={(v) => set("mlp", v)}
        placeholder="Todos os MLPs"
        options={options.mlps}
      />
      <FilterSelect
        value={filters.svc}
        onChange={(v) => set("svc", v)}
        placeholder="Todos os SVC"
        options={options.svcs}
      />
      <FilterSelect
        value={filters.regional}
        onChange={(v) => set("regional", v)}
        placeholder="Todas as regionais"
        options={options.regionais}
      />
      <FilterSelect
        value={filters.cliente}
        onChange={(v) => set("cliente", v)}
        placeholder="Todos os clientes"
        options={options.clientes}
      />
      <FilterSelect
        value={filters.responsavel}
        onChange={(v) => set("responsavel", v)}
        placeholder="Todos os responsáveis"
        options={options.responsaveis}
      />
      <FilterSelect
        value={filters.prioridade}
        onChange={(v) => set("prioridade", v)}
        placeholder="Todas as prioridades"
        options={options.prioridades}
      />
      {active && (
        <button
          type="button"
          onClick={() =>
            onChange({
              mlp: "",
              svc: "",
              regional: "",
              cliente: "",
              responsavel: "",
              prioridade: "",
            })
          }
          className="text-xs text-[var(--ink-secondary)] hover:text-[var(--ink)] underline ml-auto"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
