"use client";

import BarList from "@/components/BarList";
import { useChartColors } from "@/lib/colors";
import type { CountItem } from "@/lib/metrics";

function colorForStatus(label: string, status: ReturnType<typeof useChartColors>["status"], fallback: string) {
  const l = label.toLowerCase();
  if (l.includes("ativo")) return status.good;
  if (l.includes("manuten")) return status.warning;
  if (l.includes("ociosa")) return status.serious;
  if (l.includes("encerrado") || l.includes("quarentena")) return status.critical;
  return fallback;
}

export default function StatusVecChart({ items }: { items: CountItem[] }) {
  const { status, categorical } = useChartColors();
  return (
    <BarList
      items={items}
      colorFor={(label) => colorForStatus(label, status, categorical[0])}
    />
  );
}
