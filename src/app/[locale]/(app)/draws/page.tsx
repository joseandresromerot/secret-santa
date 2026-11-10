import { CalendarDays, Plus, Users } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DeleteDrawButton } from "@/features/draws/components/delete-draw-button";
import { listDraws } from "@/features/draws/lib/queries";

export default async function DrawsPage() {
  const session = await auth();
  const draws = await listDraws(session!.user.id);
  const t = await getTranslations("Draws");
  const format = await getFormatter();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <Link href="/draws/new" className={buttonVariants({ size: "lg" })}>
          <Plus />
          {t("new")}
        </Link>
      </div>

      {draws.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <p className="font-medium">{t("emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("emptyText")}</p>
          <Link href="/draws/new" className={buttonVariants({ className: "mt-6" })}>
            <Plus />
            {t("new")}
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {draws.map((draw) => (
            <li
              key={draw.id}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <Link href={`/draws/${draw.id}`} className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium">{draw.name}</span>
                  <Badge variant={draw.status === "completed" ? "default" : "secondary"}>
                    {t(`status.${draw.status}`)}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" />
                    {t("participantCount", { count: draw.participantCount })}
                  </span>
                  {draw.eventDate && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      {format.dateTime(new Date(`${draw.eventDate}T00:00:00Z`), {
                        dateStyle: "medium",
                        timeZone: "UTC",
                      })}
                    </span>
                  )}
                </div>
              </Link>
              <DeleteDrawButton drawId={draw.id} drawName={draw.name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
