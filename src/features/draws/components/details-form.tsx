"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { createDraw, updateDrawDetails } from "../actions/draws";
import type { DrawDetailsInput } from "../schemas";

type Props = {
  drawId?: string;
  initial: DrawDetailsInput;
};

const nativeSelect =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function DetailsForm({ drawId, initial }: Props) {
  const t = useTranslations("Details");
  const te = useTranslations("Errors");
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const set = (key: keyof DrawDetailsInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (drawId) {
        const result = await updateDrawDetails(drawId, values);
        if (!result.ok) return void toast.error(te(result.error));
        router.push(`/draws/${drawId}/participants`);
      } else {
        const result = await createDraw(values);
        if (!result.ok) return void toast.error(te(result.error));
        router.push(`/draws/${result.data.id}/participants`);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-xl border bg-card p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          required
          maxLength={80}
          value={values.name}
          onChange={set("name")}
          placeholder={t("namePlaceholder")}
          autoFocus={!drawId}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="eventDate">
            {t("eventDate")} <span className="font-normal text-muted-foreground">{t("optional")}</span>
          </Label>
          <Input id="eventDate" type="date" value={values.eventDate ?? ""} onChange={set("eventDate")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget">
            {t("budget")} <span className="font-normal text-muted-foreground">{t("optional")}</span>
          </Label>
          <Input
            id="budget"
            maxLength={40}
            value={values.budget ?? ""}
            onChange={set("budget")}
            placeholder={t("budgetPlaceholder")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">
          {t("message")} <span className="font-normal text-muted-foreground">{t("optional")}</span>
        </Label>
        <Textarea
          id="message"
          rows={4}
          maxLength={1000}
          value={values.message ?? ""}
          onChange={set("message")}
          placeholder={t("messagePlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="locale">{t("locale")}</Label>
        <select id="locale" className={nativeSelect} value={values.locale} onChange={set("locale")}>
          {routing.locales.map((l) => (
            <option key={l} value={l}>
              {t(`locales.${l}`)}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">{t("localeHelp")}</p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {drawId ? t("saveAndContinue") : t("create")}
          {!isPending && <ArrowRight />}
        </Button>
      </div>
    </form>
  );
}
