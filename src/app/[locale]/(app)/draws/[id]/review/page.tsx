import { Ban, CalendarDays, CircleCheck, Pencil, TriangleAlert, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isMailConfigured } from "@/lib/mailer";
import { DrawButton } from "@/features/draws/components/draw-button";
import { StepFooter } from "@/features/draws/components/step-footer";
import { formatEventDate } from "@/features/draws/emails/assignment-email";
import { groupColor } from "@/features/draws/lib/group-colors";
import { loadDraftDraw } from "@/features/draws/lib/load-draw";
import { drawAssignments } from "@/features/draws/lib/matching";
import { toMatchingInput } from "@/features/draws/lib/to-matching-input";

// Drawing sends all emails inside the server action
export const maxDuration = 60;

function Section({
  title,
  editHref,
  children,
}: {
  title: string;
  editHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <Link href={editHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <Pencil className="size-3.5" />
          <EditLabel />
        </Link>
      </div>
      {children}
    </section>
  );
}

async function EditLabel() {
  const t = await getTranslations("Common");
  return <>{t("edit")}</>;
}

export default async function ReviewPage({ params }: PageProps<"/[locale]/draws/[id]/review">) {
  const { id, locale } = await params;
  const draw = await loadDraftDraw(id, locale);
  const t = await getTranslations("Review");
  const td = await getTranslations("Details");

  const groupIndex = new Map(draw.groups.map((g, i) => [g.id, i]));
  const groupName = new Map(draw.groups.map((g) => [g.id, g.name]));
  const feasibility = drawAssignments(toMatchingInput(draw));

  let problem: string | null = null;
  if (!feasibility.ok) {
    if (feasibility.reason === "too_few_participants") problem = t("problemTooFew");
    else if (feasibility.reason === "no_options") {
      const names = draw.participants
        .filter((p) => feasibility.blockedParticipantIds.includes(p.id))
        .map((p) => p.name);
      problem = t("problemNoOptions", { names: names.join(", "), count: names.length });
    } else problem = t("problemTooRestrictive");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <Section title={t("details")} editHref={`/draws/${id}/details`}>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <dt className="sr-only">{td("eventDate")}</dt>
            <dd>{draw.eventDate ? formatEventDate(draw.eventDate, locale) : t("noDate")}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-muted-foreground" />
            <dt className="sr-only">{td("budget")}</dt>
            <dd>{draw.budget ?? t("noBudget")}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">{td("message")}</dt>
            <dd className="mt-1 whitespace-pre-line">{draw.message ?? t("noMessage")}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">{td("locale")}</dt>
            <dd className="mt-1">{td(`locales.${draw.locale}`)}</dd>
          </div>
        </dl>
      </Section>

      <Section title={t("participants", { count: draw.participants.length })} editHref={`/draws/${id}/participants`}>
        {draw.participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noParticipants")}</p>
        ) : (
          <ul className="divide-y text-sm">
            {draw.participants.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground">{p.email}</span>
                {p.groupId && (
                  <Badge variant="outline" className={cn("ml-auto border-transparent", groupColor(groupIndex.get(p.groupId)!))}>
                    {groupName.get(p.groupId)}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t("restrictions")} editHref={`/draws/${id}/groups`}>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Ban className="size-4 text-muted-foreground" />
            {t("ruleSelf")}
          </li>
          {draw.groups.length > 0 && (
            <li className="flex items-center gap-2">
              <Ban className="size-4 text-muted-foreground" />
              {t("ruleSameGroup")}
            </li>
          )}
          {draw.exclusions.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-2">
              <Ban className="size-4 text-muted-foreground" />
              <Badge variant="outline" className={cn("border-transparent", groupColor(groupIndex.get(e.groupAId)!))}>
                {groupName.get(e.groupAId)}
              </Badge>
              ↔
              <Badge variant="outline" className={cn("border-transparent", groupColor(groupIndex.get(e.groupBId)!))}>
                {groupName.get(e.groupBId)}
              </Badge>
              <span className="text-muted-foreground">{t("ruleBetweenGroups")}</span>
            </li>
          ))}
        </ul>
      </Section>

      <div
        className={cn(
          "flex items-start gap-2 rounded-xl border p-4 text-sm",
          problem ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-emerald-200 bg-emerald-50 text-emerald-800"
        )}
      >
        {problem ? <TriangleAlert className="mt-0.5 size-4 shrink-0" /> : <CircleCheck className="mt-0.5 size-4 shrink-0" />}
        <p>{problem ?? t("feasible")}</p>
      </div>

      {!isMailConfigured() && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{t("mailNotConfigured")}</p>
      )}

      <div className="flex justify-end pt-2">
        <DrawButton drawId={draw.id} participantCount={draw.participants.length} disabled={!!problem} />
      </div>

      <StepFooter backHref={`/draws/${id}/groups`} />
    </div>
  );
}
