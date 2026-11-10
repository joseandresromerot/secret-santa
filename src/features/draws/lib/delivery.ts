import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { assignments, draws } from "@/db/schema";
import { buildAssignmentEmail } from "../emails/assignment-email";

export type DeliverySummary = { sent: number; failed: number };

/** Sends (or re-sends) assignment emails for a completed draw. */
export async function deliverEmails(
  drawId: string,
  onlyAssignmentIds?: string[]
): Promise<DeliverySummary> {
  const draw = await db.query.draws.findFirst({
    where: eq(draws.id, drawId),
    with: {
      owner: true,
      assignments: {
        where: onlyAssignmentIds ? inArray(assignments.id, onlyAssignmentIds) : undefined,
        with: { giver: true, receiver: true },
      },
    },
  });
  if (!draw) return { sent: 0, failed: 0 };

  const t = await getTranslations({ locale: draw.locale, namespace: "Email" });
  const organizerName = draw.owner.name ?? draw.owner.email;

  const results = await Promise.allSettled(
    draw.assignments.map(async (assignment) => {
      try {
        const email = await buildAssignmentEmail({
          locale: draw.locale,
          drawName: draw.name,
          organizerName,
          giverName: assignment.giver.name,
          receiverName: assignment.receiver.name,
          eventDate: draw.eventDate,
          budget: draw.budget,
          message: draw.message,
        });
        await sendMail(
          { to: assignment.giver.email, replyTo: draw.owner.email, ...email },
          t("fromName")
        );
        await db
          .update(assignments)
          .set({
            emailStatus: "sent",
            emailError: null,
            emailSentAt: new Date(),
            emailAttempts: sql`${assignments.emailAttempts} + 1`,
          })
          .where(eq(assignments.id, assignment.id));
      } catch (err) {
        await db
          .update(assignments)
          .set({
            emailStatus: "failed",
            emailError: err instanceof Error ? err.message.slice(0, 500) : String(err),
            emailAttempts: sql`${assignments.emailAttempts} + 1`,
          })
          .where(eq(assignments.id, assignment.id));
        throw err;
      }
    })
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  return { sent: results.length - failed, failed };
}
