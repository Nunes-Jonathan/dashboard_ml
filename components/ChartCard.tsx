import type { ReactNode } from "react";

export default function ChartCard({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-3 bg-[var(--surface)] ${className ?? ""}`}
      style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}
    >
      <div
        className={subtitle ? "pb-3 border-b" : undefined}
        style={subtitle ? { borderColor: "var(--gridline)" } : undefined}
      >
        <h3 className="text-sm font-semibold text-[var(--ink)]">{title}</h3>
        {subtitle && (
          <p className="text-sm text-[var(--ink-secondary)] leading-snug mt-1">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
