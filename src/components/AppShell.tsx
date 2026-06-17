"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { NAV_ITEMS } from "./nav-config";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { canAccessRoute } from "@/lib/permissions";
import { DEMO_ANCHOR } from "@/lib/clock";
import { cn } from "@/lib/cn";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t, formatDate } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const onboarded = useAppStore((s) => s.onboarded);
  const hydrated = useAppStore((s) => s.hydrated);
  const business = useAppStore((s) => s.business);
  const role = useAppStore((s) => s.role);

  // Gate the app behind onboarding.
  useEffect(() => {
    if (hydrated && !onboarded) router.replace("/onboarding");
  }, [hydrated, onboarded, router]);

  // Permission-aware navigation: only show routes this role can access.
  const visibleItems = NAV_ITEMS.filter((i) => canAccessRoute(role, i.href));
  const primaryItems = visibleItems.filter((i) => i.primary);
  const demoMode = business?.mode !== "production";

  return (
    <div className="min-h-screen bg-cream">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-ink/10 bg-white lg:flex">
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-sm font-black text-white">
            A
          </div>
          <div>
            <div className="text-lg font-black leading-none text-ink">{t("app.name")}</div>
            <div className="mt-0.5 text-[11px] text-ink/50">{business?.name}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {visibleItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-accent/10 text-accent" : "text-ink/70 hover:bg-ink/5 hover:text-ink"
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span>{t(`nav.${item.key}`)}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-ink/10 p-3 text-[11px] leading-relaxed text-ink/40">
          {t("compliance.disclaimer")}
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:ps-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink/10 bg-cream/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm font-black text-white">
              A
            </div>
            <span className="font-black text-ink">{t("app.name")}</span>
          </div>
          <div className="hidden text-sm text-ink/50 lg:block">{t("app.tagline")}</div>
          <LanguageSwitcher />
        </header>

        {/* Demo data anchor banner */}
        {demoMode && (
          <div className="border-b border-warning/20 bg-warning/10 px-4 py-2 text-center text-xs font-medium text-ink/70 lg:px-8">
            {t("demo.banner", { date: formatDate(DEMO_ANCHOR) })}
          </div>
        )}

        {/* Page content */}
        <main className="px-4 pb-28 pt-5 lg:px-8 lg:pb-12">{children}</main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-ink/10 bg-white/95 backdrop-blur lg:hidden">
        {primaryItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition",
                active ? "text-accent" : "text-ink/50"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{t(`nav.${item.key}`)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
