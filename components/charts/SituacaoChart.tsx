"use client";

import BarList from "@/components/BarList";
import { useChartColors } from "@/lib/colors";
import type { CountItem } from "@/lib/metrics";

function colorForSituacao(label: string, status: ReturnType<typeof useChartColors>["status"], fallback: string) {
  const l = label.toLowerCase();
  if (l.includes("finalizado")) return status.good;
  if (l.includes("não encontrada") || l.includes("nao encontrada")) return status.critical;
  if (l.includes("aguardando")) return status.warning;
  return fallback;
}

export default function SituacaoChart({ items }: { items: CountItem[] }) {
  const { status, categorical } = useChartColors();
  return (
    <BarList
      items={items}
      colorFor={(label) => colorForSituacao(label, status, categorical[0])}
    />
  );
}
