"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const onboarded = useAppStore((s) => s.onboarded);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(onboarded ? "/dashboard" : "/onboarding");
  }, [hydrated, onboarded, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-lg font-black text-white">
          A
        </div>
        <div className="text-sm text-ink/50">ATLAS</div>
      </div>
    </div>
  );
}
