"use client";

import BarList from "@/components/BarList";
import { useChartColors } from "@/lib/colors";
import type { CountItem } from "@/lib/metrics";

export default function AgingChart({ items }: { items: CountItem[] }) {
  const { sequential } = useChartColors();
  const order = new Map(items.map((it, i) => [it.label, i]));
  return (
    <BarList
      items={items}
      colorFor={(label) => {
        const i = order.get(label) ?? 0;
        return sequential[Math.min(i, sequential.length - 1)];
      }}
    />
  );
}
