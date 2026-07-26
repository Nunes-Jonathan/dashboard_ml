"use client";

import { useChartColors } from "@/lib/colors";
import type { CountItem } from "@/lib/metrics";

interface BarListProps {
  items: CountItem[];
  colorFor?: (label: string, index: number) => string;
  formatValue?: (count: number) => string;
  maxItems?: number;
}

export default function BarList({ items, colorFor, formatValue, maxItems }: BarListProps) {
  const { categorical, chrome } = useChartColors();
  const shown = maxItems ? items.slice(0, maxItems) : items;
  const max = Math.max(1, ...shown.map((i) => i.count));
  const total = items.reduce((a, b) => a + b.count, 0) || 1;
  const defaultColor = categorical[0];

  if (shown.length === 0) {
    return <p className="text-sm text-[var(--ink-muted)]">Sem dados.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {shown.map((item, i) => {
        const pct = (item.count / max) * 100;
        const share = ((item.count / total) * 100).toFixed(1);
        const color = colorFor ? colorFor(item.label, i) : defaultColor;
        return (
          <div
            key={item.label}
            className="group flex items-center gap-3"
            title={`${item.label}: ${item.count} (${share}%)`}
          >
            <span
              className="w-28 sm:w-36 shrink-0 truncate text-xs text-[var(--ink-secondary)]"
            >
              {item.label}
            </span>
            <div
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ background: chrome.gridline }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <span className="w-12 shrink-0 text-right text-xs tabular-nums text-[var(--ink)]">
              {formatValue ? formatValue(item.count) : item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
