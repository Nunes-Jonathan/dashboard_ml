"use client";

import BarList from "@/components/BarList";
import { useChartColors } from "@/lib/colors";
import type { CountItem } from "@/lib/metrics";

function colorForPriority(label: string, status: ReturnType<typeof useChartColors>["status"], fallback: string) {
  const l = label.toLowerCase();
  if (l.includes("crítica") || l.includes("critica")) return status.critical;
  if (l.includes("alta")) return status.serious;
  if (l.includes("média") || l.includes("media")) return status.warning;
  if (l.includes("revisar")) return status.warning;
  return fallback;
}

export default function PriorityChart({ items }: { items: CountItem[] }) {
  const { status, categorical } = useChartColors();
  return (
    <BarList
      items={items}
      colorFor={(label) => colorForPriority(label, status, categorical[0])}
    />
  );
}
