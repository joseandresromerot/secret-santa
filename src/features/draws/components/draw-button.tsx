"use client";

import { Loader2, Shuffle, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { performDraw } from "../actions/perform";

export function DrawButton({
  drawId,
  participantCount,
  disabled,
}: {
  drawId: string;
  participantCount: number;
  disabled: boolean;
}) {
  const t = useTranslations("Review");
  const tc = useTranslations("Common");
  const te = useTranslations("Errors");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onConfirm = () =>
    startTransition(async () => {
      setError(null);
      const result = await performDraw(drawId);
      if (!result.ok) {
        setOpen(false);
        setError(te(result.error));
        return;
      }
      router.push(`/draws/${drawId}/result`);
    });

  return (
    <div className="space-y-3">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">{t("drawFailed")}</p>
            <p>{error}</p>
          </div>
        </div>
      )}
      <AlertDialog open={open || isPending} onOpenChange={(o) => !isPending && setOpen(o)}>
        <AlertDialogTrigger
          render={<Button size="lg" className="h-11 w-full text-base sm:w-auto sm:px-8" disabled={disabled} />}
        >
          <Shuffle />
          {t("drawButton")}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-primary/10 text-primary">
              <Shuffle />
            </AlertDialogMedia>
            <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDescription", { count: participantCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isPending ? t("drawing") : t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
