"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import RefreshButton from "@/components/RefreshButton";

const NAV_LINKS = [
  { href: "/", label: "Visão Geral" },
  { href: "/frota-offline", label: "Frota Offline Detalhado" },
];

export default function SiteHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const pathname = usePathname();

  return (
    <header className="border-b" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--ink)]">{title}</h1>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <RefreshButton />
          <ThemeToggle />
        </div>
      </div>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 pb-3 flex items-center gap-4">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-medium pb-1"
              style={{
                color: active ? "var(--ink)" : "var(--ink-muted)",
                borderBottom: active ? "2px solid var(--ink)" : "2px solid transparent",
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
