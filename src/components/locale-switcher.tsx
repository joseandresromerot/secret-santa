"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className={cn("inline-flex rounded-lg border bg-background p-0.5 text-xs", className)}
      role="group"
      aria-label={t("language")}
    >
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              // @ts-expect-error -- params of the current route are always valid for it
              router.replace({ pathname, params }, { locale: l });
            })
          }
          className={cn(
            "rounded-md px-2 py-1 font-medium uppercase transition-colors",
            l === locale ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
