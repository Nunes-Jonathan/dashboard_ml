import type { ManutencaoRiscoResponse } from "@/lib/externalTelemetria";

function classificacaoLabel(c: string): string {
  if (c === "RISCO_SAIR_OFFLINE") return "Risco de sair offline";
  if (c === "OK_ANTES_MANUTENCAO") return "OK antes da manutenção";
  return c.replaceAll("_", " ").toLowerCase();
}

export default function ManutencaoRiscoTable({ data }: { data: ManutencaoRiscoResponse | null }) {
  if (!data) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        Não foi possível carregar esta seção agora — a consulta de risco de manutenção está lenta
        no momento. Tente atualizar a página em instantes.
      </p>
    );
  }

  const rows = [...data.rows]
    .sort((a, b) => b.dias_offline_atual - a.dias_offline_atual)
    .slice(0, 100);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-4 text-xs text-[var(--ink-secondary)]">
        <span>
          <strong className="text-[var(--ink)]">{data.summary.base_manut_offline}</strong> em
          manutenção offline
        </span>
        <span style={{ color: "#d03b3b" }}>
          <strong>{data.summary.risco_sair_offline}</strong> com risco de sair offline
        </span>
        <span>
          <strong className="text-[var(--ink)]">{data.summary.ok_antes_manutencao}</strong> OK
          antes da manutenção
        </span>
      </div>
      <div
        className="overflow-auto rounded-lg border max-h-[400px]"
        style={{ borderColor: "var(--border)" }}
      >
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[var(--surface)]">
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">Placa</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">
                Transportadora
              </th>
              <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">Regional</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">Sub-regional</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">SVC</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">
                Dias offline
              </th>
              <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">
                Entrada manutenção
              </th>
              <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">
                Classificação
              </th>
              <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">Ação</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={`${r.placa}-${i}`}
                style={{ borderBottom: "1px solid var(--border)" }}
                className="hover:bg-[var(--page)]"
              >
                <td className="px-3 py-2 font-medium tabular-nums text-[var(--ink)]">{r.placa}</td>
                <td className="px-3 py-2 text-[var(--ink-secondary)]">{r.transportadora}</td>
                <td className="px-3 py-2 text-[var(--ink-secondary)]">{r.regional}</td>
                <td className="px-3 py-2 text-[var(--ink-secondary)]">{r.sub_regional}</td>
                <td className="px-3 py-2 text-[var(--ink-secondary)]">{r.svc}</td>
                <td className="px-3 py-2 tabular-nums text-[var(--ink)]">{r.dias_offline_atual}</td>
                <td className="px-3 py-2 text-[var(--ink-secondary)]">{r.data_entrada_manutencao}</td>
                <td className="px-3 py-2">
                  <span
                    style={{
                      color: r.classificacao === "RISCO_SAIR_OFFLINE" ? "#d03b3b" : "var(--ink-secondary)",
                    }}
                  >
                    {classificacaoLabel(r.classificacao)}
                  </span>
                </td>
                <td className="px-3 py-2 text-[var(--ink-muted)]">{r.acao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
