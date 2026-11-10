"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export const STEPS = ["details", "participants", "groups", "review"] as const;

export function Stepper({ drawId }: { drawId: string }) {
  const t = useTranslations("Steps");
  const pathname = usePathname();
  const current = STEPS.findIndex((s) => pathname.endsWith(`/${s}`));

  return (
    <nav aria-label={t("label")} className="mb-8">
      <ol className="grid grid-cols-4 gap-2">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={step}>
              <Link
                href={`/draws/${drawId}/${step}`}
                aria-current={active ? "step" : undefined}
                className="group flex flex-col gap-2"
              >
                <span
                  className={cn(
                    "h-1.5 rounded-full transition-colors",
                    done || active ? "bg-primary" : "bg-border group-hover:bg-primary/30"
                  )}
                />
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-medium sm:text-sm",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "hidden size-5 shrink-0 items-center justify-center rounded-full text-[11px] sm:flex",
                      done && "bg-primary text-primary-foreground",
                      active && "border-2 border-primary text-primary",
                      !done && !active && "border text-muted-foreground"
                    )}
                  >
                    {done ? <Check className="size-3" /> : i + 1}
                  </span>
                  <span className="truncate">{t(step)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
