import { PartyPopper, TriangleAlert } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { DeliveryList } from "@/features/draws/components/delivery-list";
import { loadDraw } from "@/features/draws/lib/load-draw";
import { getDeliveryStatus } from "@/features/draws/lib/queries";

// Resending emails runs inside server actions on this page
export const maxDuration = 60;

export default async function ResultPage({ params }: PageProps<"/[locale]/draws/[id]/result">) {
  const { id, locale } = await params;
  const draw = await loadDraw(id);
  if (draw.status !== "completed") return redirect({ href: `/draws/${id}/review`, locale });

  const t = await getTranslations("Result");
  const format = await getFormatter();
  const deliveries = await getDeliveryStatus(draw.id);
  const failed = deliveries.filter((d) => d.status !== "sent").length;
  const allSent = failed === 0;

  return (
    <div className="space-y-8">
      <div
        className={
          allSent
            ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center sm:p-8"
            : "rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center sm:p-8"
        }
      >
        <div
          className={
            allSent
              ? "mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
              : "mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive"
          }
        >
          {allSent ? <PartyPopper className="size-7" /> : <TriangleAlert className="size-7" />}
        </div>
        <h2 className="text-xl font-semibold">{allSent ? t("successTitle") : t("errorTitle")}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-pretty text-muted-foreground">
          {allSent
            ? t("successDescription", { count: deliveries.length })
            : t("errorDescription", { failed, total: deliveries.length })}
        </p>
        {draw.completedAt && (
          <p className="mt-3 text-xs text-muted-foreground">
            {t("drawnAt", {
              date: format.dateTime(draw.completedAt, { dateStyle: "medium", timeStyle: "short" }),
            })}
          </p>
        )}
      </div>

      <DeliveryList
        drawId={draw.id}
        deliveries={deliveries.map(({ assignmentId, name, email, status }) => ({
          assignmentId,
          name,
          email,
          status,
        }))}
      />
    </div>
  );
}
