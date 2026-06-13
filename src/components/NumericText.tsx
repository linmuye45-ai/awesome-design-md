import React from "react";
import { cn } from "@/lib/cn";

/**
 * Renders numeric / monetary content that must always read left-to-right and
 * use tabular figures, even inside an RTL (Arabic) layout. Money, dates and
 * counts stay LTR while the surrounding prose mirrors correctly.
 */
export function NumericText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span dir="ltr" className={cn("inline-block tabular-nums", className)}>
      {children}
    </span>
  );
}
