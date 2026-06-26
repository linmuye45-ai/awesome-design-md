"use client";

import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { Card } from "./ui/primitives";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  icon: Icon,
  meaning,
  deltaLabel,
  deltaPositive,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  meaning?: string;
  deltaLabel?: string;
  deltaPositive?: boolean;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
}) {
  const tones = {
    neutral: "text-ink",
    accent: "text-accent",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  };
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink/50">{label}</span>
        <Icon className="h-4 w-4 text-ink/30" />
      </div>
      <div className={cn("numeric text-2xl font-bold", tones[tone])}>{value}</div>
      {deltaLabel && (
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            deltaPositive ? "text-success" : "text-danger"
          )}
        >
          {deltaPositive ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {deltaLabel}
        </div>
      )}
      {meaning && <p className="text-[11px] leading-snug text-ink/45">{meaning}</p>}
    </Card>
  );
}
