"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Radio, Satellite, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import RefreshButton from "@/components/RefreshButton";

interface PageInfo {
  title: string;
  subtitle: string;
  navLabel: string;
  icon: LucideIcon;
}

const PAGES: Record<string, PageInfo> = {
  "/": {
    title: "Painel de Telemetria — Frota Offline",
    subtitle: 'Dados ao vivo da planilha "Telemetria Offlines Geral" — atualiza a cada 5 min',
    navLabel: "Visão Geral",
    icon: LayoutDashboard,
  },
  "/frota-offline": {
    title: "Frota Offline — Detalhado",
    subtitle:
      "Base completa da frota (API de telemetria) cruzada com AGENDAMENTO — atualiza a cada 10 min",
    navLabel: "Frota Offline Detalhado",
    icon: Radio,
  },
  "/geotab": {
    title: "Geotab — Fonte Nativa",
    subtitle:
      "Conectividade e falhas direto do conector Geotab, cruzado com AGENDAMENTO — atualiza a cada 10 min",
    navLabel: "Geotab",
    icon: Satellite,
  },
};

const NAV_ORDER = ["/", "/frota-offline", "/geotab"];

function navLinkStyle(active: boolean): React.CSSProperties {
  return {
    color: active ? "var(--ink)" : "var(--ink-secondary)",
    background: active ? "var(--surface)" : "transparent",
    border: `1px solid ${active ? "var(--border)" : "transparent"}`,
    boxShadow: active ? "var(--shadow-card)" : "none",
  };
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const current = PAGES[pathname] ?? PAGES["/"];

  return (
    <div className="md:flex min-h-screen bg-[var(--page)]">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex md:flex-col md:w-60 md:shrink-0 border-r"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="px-5 py-5">
          <span className="text-sm font-semibold text-[var(--ink)]">Telemetria</span>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">Frota Offline</p>
        </div>
        <nav className="flex-1 flex flex-col gap-1 px-3">
          {NAV_ORDER.map((href) => {
            const page = PAGES[href];
            const Icon = page.icon;
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ease-[var(--ease-out-premium)] hover:text-[var(--ink)]"
                style={navLinkStyle(active)}
              >
                <Icon size={16} strokeWidth={2} />
                {page.navLabel}
              </Link>
            );
          })}
        </nav>
        <div
          className="px-3 py-4 flex flex-col gap-2 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <RefreshButton />
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar (sidebar is hidden below md) */}
      <header className="md:hidden border-b" style={{ borderColor: "var(--border)" }}>
        <div className="px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-[var(--ink)]">{current.title}</h1>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5">{current.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <RefreshButton />
            <ThemeToggle />
          </div>
        </div>
        <nav className="px-4 pb-3 flex items-center gap-2 overflow-x-auto">
          {NAV_ORDER.map((href) => {
            const page = PAGES[href];
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium rounded-md px-3 py-1.5 whitespace-nowrap transition-all duration-200 ease-[var(--ease-out-premium)] hover:text-[var(--ink)]"
                style={navLinkStyle(active)}
              >
                {page.navLabel}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="flex-1 min-w-0">
        <header className="hidden md:block border-b" style={{ borderColor: "var(--border)" }}>
          <div className="px-6 py-5">
            <h1 className="text-lg font-semibold text-[var(--ink)]">{current.title}</h1>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5">{current.subtitle}</p>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
