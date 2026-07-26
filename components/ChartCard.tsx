import type { ReactNode } from "react";

export default function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-3 bg-[var(--surface)]"
      style={{ borderColor: "var(--border)" }}
    >
      <div>
        <h3 className="text-sm font-semibold text-[var(--ink)]">{title}</h3>
        {subtitle && (
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
