"use client";

import { useMemo, useRef, useState, type MouseEvent } from "react";
import { useChartColors } from "@/lib/colors";
import type { TendenciaPoint } from "@/lib/externalTelemetria";

const WIDTH = 900;
const HEIGHT = 200;
const PADDING = { top: 16, right: 12, bottom: 24, left: 36 };

function formatDateLabel(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

export default function TrendLineChart({ points }: { points: TendenciaPoint[] }) {
  const { chrome, sequential } = useChartColors();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { path, xScale, yScale, minY, maxY } = useMemo(() => {
    const values = points.map((p) => p.pct_offline);
    const minY = values.length ? Math.min(...values) : 0;
    const maxY = values.length ? Math.max(...values) : 1;
    const yRange = maxY - minY || 1;
    const innerWidth = WIDTH - PADDING.left - PADDING.right;
    const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

    const xScale = (i: number) =>
      PADDING.left + (points.length <= 1 ? 0 : (i / (points.length - 1)) * innerWidth);
    const yScale = (v: number) =>
      PADDING.top + innerHeight - ((v - minY) / yRange) * innerHeight;

    const d = points
      .map(
        (p, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(p.pct_offline).toFixed(1)}`
      )
      .join(" ");

    return { path: d, xScale, yScale, minY, maxY };
  }, [points]);

  if (points.length === 0) {
    return <p className="text-sm text-[var(--ink-muted)]">Sem dados.</p>;
  }

  function handleMouseMove(e: MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const innerWidth = WIDTH - PADDING.left - PADDING.right;
    const ratio = Math.min(1, Math.max(0, (relX - PADDING.left) / innerWidth));
    const idx = Math.round(ratio * (points.length - 1));
    setHoverIndex(Math.min(points.length - 1, Math.max(0, idx)));
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const labelStep = Math.max(1, Math.round(points.length / 8));

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ height: HEIGHT }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <line
          x1={PADDING.left}
          x2={WIDTH - PADDING.right}
          y1={HEIGHT - PADDING.bottom}
          y2={HEIGHT - PADDING.bottom}
          stroke={chrome.axis}
          strokeWidth={1}
        />
        <path
          d={path}
          fill="none"
          stroke={sequential[3]}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {hoverIndex !== null && hovered && (
          <>
            <line
              x1={xScale(hoverIndex)}
              x2={xScale(hoverIndex)}
              y1={PADDING.top}
              y2={HEIGHT - PADDING.bottom}
              stroke={chrome.gridline}
              strokeWidth={1}
            />
            <circle
              cx={xScale(hoverIndex)}
              cy={yScale(hovered.pct_offline)}
              r={4}
              fill={sequential[3]}
              stroke={chrome.surface}
              strokeWidth={2}
            />
          </>
        )}
        {points.map((p, i) =>
          i % labelStep === 0 ? (
            <text
              key={p.data_referencia}
              x={xScale(i)}
              y={HEIGHT - 6}
              fontSize={9}
              textAnchor="middle"
              fill={chrome.inkMuted}
            >
              {formatDateLabel(p.data_referencia)}
            </text>
          ) : null
        )}
        <text x={PADDING.left - 4} y={PADDING.top + 4} fontSize={9} textAnchor="end" fill={chrome.inkMuted}>
          {maxY.toFixed(0)}%
        </text>
        <text
          x={PADDING.left - 4}
          y={HEIGHT - PADDING.bottom}
          fontSize={9}
          textAnchor="end"
          fill={chrome.inkMuted}
        >
          {minY.toFixed(0)}%
        </text>
      </svg>
      {hovered && (
        <div
          className="pointer-events-none absolute rounded-md border px-2 py-1 text-xs bg-[var(--surface)] text-[var(--ink)] shadow-sm"
          style={{
            borderColor: "var(--border)",
            left: `${(xScale(hoverIndex as number) / WIDTH) * 100}%`,
            top: 4,
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-medium">{formatDateLabel(hovered.data_referencia)}</div>
          <div className="text-[var(--ink-secondary)]">
            {hovered.pct_offline.toFixed(1)}% offline ({hovered.offline})
          </div>
        </div>
      )}
    </div>
  );
}
