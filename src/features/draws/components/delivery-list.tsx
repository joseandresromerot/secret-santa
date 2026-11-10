"use client";

import { CircleCheck, CircleX, Clock, Loader2, RotateCw, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resendEmail, resendFailedEmails } from "../actions/perform";

type Delivery = {
  assignmentId: string;
  name: string;
  email: string;
  status: "pending" | "sent" | "failed";
};

export function DeliveryList({ drawId, deliveries }: { drawId: string; deliveries: Delivery[] }) {
  const t = useTranslations("Result");
  const te = useTranslations("Errors");
  const [isPending, startTransition] = useTransition();
  const failedCount = deliveries.filter((d) => d.status !== "sent").length;

  const onResendFailed = () =>
    startTransition(async () => {
      const result = await resendFailedEmails(drawId);
      if (!result.ok) return void toast.error(te(result.error));
      const { sent, failed } = result.data;
      if (failed) toast.error(t("resendSummaryFailed", { sent, failed }));
      else toast.success(t("resendSummaryOk", { count: sent }));
    });

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{t("deliveryTitle")}</h2>
        {failedCount > 0 && (
          <Button variant="outline" onClick={onResendFailed} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <RotateCw />}
            {t("resendFailed", { count: failedCount })}
          </Button>
        )}
      </div>
      <ul className="divide-y rounded-xl border bg-card">
        {deliveries.map((d) => (
          <DeliveryRow key={d.assignmentId} drawId={drawId} delivery={d} />
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{t("privacyNote")}</p>
    </section>
  );
}

function StatusBadge({ status }: { status: Delivery["status"] }) {
  const t = useTranslations("Result");
  if (status === "sent")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
        <CircleCheck className="size-3.5" />
        {t("statusSent")}
      </span>
    );
  if (status === "failed")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
        <CircleX className="size-3.5" />
        {t("statusFailed")}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
      <Clock className="size-3.5" />
      {t("statusPending")}
    </span>
  );
}

function DeliveryRow({ drawId, delivery }: { drawId: string; delivery: Delivery }) {
  const t = useTranslations("Result");
  const tc = useTranslations("Common");
  const te = useTranslations("Errors");
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(delivery.email);
  const [isPending, startTransition] = useTransition();

  const onResend = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await resendEmail(
        drawId,
        delivery.assignmentId,
        email.trim().toLowerCase() !== delivery.email ? email : undefined
      );
      if (!result.ok) return void toast.error(te(result.error));
      if (result.data.failed) toast.error(t("resendOneFailed", { name: delivery.name }));
      else {
        toast.success(t("resendOneOk", { name: delivery.name }));
        setOpen(false);
      }
    });
  };

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{delivery.name}</div>
        <div className="truncate text-sm text-muted-foreground">{delivery.email}</div>
      </div>
      <StatusBadge status={delivery.status} />
      <Dialog open={open} onOpenChange={(o) => !isPending && setOpen(o)}>
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={t("resend")} />}>
          <Send />
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={onResend} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>{t("resendTitle", { name: delivery.name })}</DialogTitle>
              <DialogDescription>{t("resendDescription")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor={`email-${delivery.assignmentId}`}>{t("email")}</Label>
              <Input
                id={`email-${delivery.assignmentId}`}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" disabled={isPending} />}>
                {tc("cancel")}
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : <Send />}
                {t("resend")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </li>
  );
}
