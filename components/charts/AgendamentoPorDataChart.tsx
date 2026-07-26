"use client";

import { useChartColors } from "@/lib/colors";
import type { CountItem } from "@/lib/metrics";

const CHART_HEIGHT = 160;

export default function AgendamentoPorDataChart({ items }: { items: CountItem[] }) {
  const { chrome, sequential } = useChartColors();

  if (items.length === 0) {
    return <p className="text-sm text-[var(--ink-muted)]">Sem dados.</p>;
  }

  const max = Math.max(1, ...items.map((i) => i.count));
  const barColor = sequential[3];
  const showEveryLabel = items.length <= 14;

  return (
    <div className="flex flex-col gap-1">
      <div
        className="flex items-end gap-[3px] border-b"
        style={{ height: CHART_HEIGHT, borderColor: chrome.axis }}
      >
        {items.map((item) => {
          const heightPct = (item.count / max) * 100;
          return (
            <div
              key={item.label}
              className="group relative flex-1 flex flex-col items-center justify-end h-full"
              title={`${item.label}: ${item.count} chamado${item.count === 1 ? "" : "s"}`}
            >
              <div
                className="w-full rounded-t-sm min-h-[2px] transition-[height] duration-300"
                style={{
                  height: `${Math.max(heightPct, item.count > 0 ? 2 : 0)}%`,
                  background: item.count > 0 ? barColor : chrome.gridline,
                }}
              />
              <span className="sr-only">
                {item.label}: {item.count}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-[3px]">
        {items.map((item, i) => (
          <div key={item.label} className="flex-1 text-center">
            {(showEveryLabel || i % 2 === 0) && (
              <span className="text-[10px] text-[var(--ink-muted)] tabular-nums">
                {item.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
