import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function SectionHeader({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--ink)]">
      <Icon size={18} strokeWidth={2} style={{ color: "var(--ink-secondary)" }} />
      {children}
    </h2>
  );
}
