"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assignments, draws, participants } from "@/db/schema";
import { drawAssignments } from "../lib/matching";
import { toMatchingInput } from "../lib/to-matching-input";
import { getOwnedDraw, isUuid } from "../lib/queries";
import { deliverEmails } from "../lib/delivery";
import { participantSchema } from "../schemas";
import { ActionError, assertOwnedDraw, currentUserId, runAction } from "../lib/guards";

export async function performDraw(drawId: string) {
  return runAction(async () => {
    const userId = await currentUserId();
    const draw = await getOwnedDraw(drawId, userId);
    if (!draw) throw new ActionError("notFound");
    if (draw.status !== "draft") throw new ActionError("alreadyDrawn");

    const result = drawAssignments(toMatchingInput(draw));
    if (!result.ok) throw new ActionError(`draw_${result.reason}`);

    await db.transaction(async (tx) => {
      const updated = await tx
        .update(draws)
        .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(draws.id, drawId), eq(draws.status, "draft")))
        .returning({ id: draws.id });
      // Another request already completed this draw
      if (updated.length === 0) throw new ActionError("alreadyDrawn");

      await tx
        .insert(assignments)
        .values(result.assignments.map((a) => ({ drawId, ...a })));
    });

    const summary = await deliverEmails(drawId);
    revalidatePath("/[locale]/draws", "layout");
    return summary;
  });
}

/** Re-sends the email of one participant, optionally fixing their address first. */
export async function resendEmail(drawId: string, assignmentId: string, email?: string) {
  return runAction(async () => {
    const userId = await currentUserId();
    const draw = await assertOwnedDraw(drawId, userId, { draftOnly: false });
    if (draw.status !== "completed" || !isUuid(assignmentId)) {
      throw new ActionError("notFound");
    }

    const assignment = await db.query.assignments.findFirst({
      where: and(eq(assignments.id, assignmentId), eq(assignments.drawId, drawId)),
    });
    if (!assignment) throw new ActionError("notFound");

    if (email !== undefined) {
      const parsed = participantSchema.shape.email.safeParse(email);
      if (!parsed.success) throw new ActionError("invalidParticipant");
      await db
        .update(participants)
        .set({ email: parsed.data })
        .where(eq(participants.id, assignment.giverId));
    }

    const summary = await deliverEmails(drawId, [assignmentId]);
    revalidatePath("/[locale]/draws", "layout");
    return summary;
  });
}

export async function resendFailedEmails(drawId: string) {
  return runAction(async () => {
    const userId = await currentUserId();
    const draw = await assertOwnedDraw(drawId, userId, { draftOnly: false });
    if (draw.status !== "completed") throw new ActionError("notFound");

    const failed = await db
      .select({ id: assignments.id })
      .from(assignments)
      .where(and(eq(assignments.drawId, drawId), eq(assignments.emailStatus, "failed")));

    const summary = failed.length
      ? await deliverEmails(drawId, failed.map((a) => a.id))
      : { sent: 0, failed: 0 };
    revalidatePath("/[locale]/draws", "layout");
    return summary;
  });
}
