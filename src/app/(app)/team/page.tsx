"use client";

import Link from "next/link";
import { Users, MapPin, CheckCircle2, Circle, ShieldQuestion, CalendarRange } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { PageHeader, Card, Badge, Button } from "@/components/ui/primitives";
import { NumericText } from "@/components/NumericText";
import { can } from "@/lib/permissions";
import * as employeesRepo from "@/lib/repositories/employees";

export default function TeamPage() {
  const { t, formatCurrency } = useI18n();
  const role = useAppStore((s) => s.role);
  const employees = useAppStore((s) => s.employees);
  const toggleGeofenceConsent = useAppStore((s) => s.toggleGeofenceConsent);

  const clockedIn = employeesRepo.clockedInCount(employees);
  const viewPrivate = can(role, "team.viewPrivate");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("team.title")} subtitle={t("team.subtitle")} />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card>
          <div className="flex items-center gap-2 text-ink/50">
            <Users className="h-4 w-4" />
            <p className="text-xs">{t("team.clockStatus")}</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-ink">
            <NumericText>
              {clockedIn}/{employees.length}
            </NumericText>
          </p>
        </Card>
        <Card className="flex items-center justify-center">
          <Link href="/schedule" className="w-full">
            <Button variant="ghost" className="w-full">
              <CalendarRange className="h-4 w-4" />
              {t("team.scheduleCta")}
            </Button>
          </Link>
        </Card>
      </div>

      <Card className="mb-4 flex items-start gap-3 border border-ink/10 bg-ink/[0.03] shadow-none">
        <ShieldQuestion className="mt-0.5 h-5 w-5 shrink-0 text-ink/50" />
        <div>
          <p className="text-sm leading-snug text-ink/60">{t("team.privacyNotice")}</p>
          {!viewPrivate && <p className="mt-1 text-xs text-ink/40">{t("team.privateRedacted")}</p>}
        </div>
      </Card>

      <div className="grid gap-3">
        {employees.map((e) => (
          <Card key={e.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-ink">{t(e.nameKey)}</h3>
                <p className="text-xs text-ink/50">{t(`roles.${e.role}`)}</p>
                {viewPrivate && e.phone && (
                  <p className="mt-0.5 text-xs text-ink/40">
                    <NumericText>{e.phone}</NumericText>
                  </p>
                )}
              </div>
              <Badge tone={e.status === "active" ? "success" : "neutral"}>
                {t(`team.status.${e.status}`)}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              <span className="inline-flex items-center gap-1.5">
                {e.clockedInToday ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <Circle className="h-4 w-4 text-ink/30" />
                )}
                <span className={e.clockedInToday ? "text-success" : "text-ink/50"}>
                  {e.clockedInToday ? t("team.clockedIn") : t("team.notClockedIn")}
                </span>
              </span>
              {viewPrivate && e.hourlyRate !== undefined && (
                <span className="text-ink/50">
                  <NumericText>{formatCurrency(e.hourlyRate)}</NumericText>/h
                </span>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl bg-ink/[0.03] px-3 py-2.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/70">
                <MapPin className="h-3.5 w-3.5" />
                {t("team.geofence")}
              </span>
              <div className="flex items-center gap-2">
                <Badge tone={e.consentForGeofencing ? "success" : "warning"}>
                  {e.consentForGeofencing ? t("team.consentGiven") : t("team.consentMissing")}
                </Badge>
                <button
                  onClick={() => toggleGeofenceConsent(e.id)}
                  role="switch"
                  aria-checked={e.consentForGeofencing}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    e.consentForGeofencing ? "bg-success" : "bg-ink/20"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      e.consentForGeofencing ? "start-[22px]" : "start-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-ink/40">{t("team.consentOwnerNote")}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
