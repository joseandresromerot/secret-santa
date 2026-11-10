"use server";

import { and, count, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { draws, participants } from "@/db/schema";
import { MAX_PARTICIPANTS, participantSchema, type ParticipantInput } from "../schemas";
import {
  ActionError,
  assertOwnedDraw,
  assertOwnedParticipant,
  currentUserId,
  runAction,
} from "../lib/guards";

async function assertUniqueName(drawId: string, name: string, exceptId?: string) {
  const [existing] = await db
    .select({ id: participants.id })
    .from(participants)
    .where(
      and(
        eq(participants.drawId, drawId),
        sql`lower(${participants.name}) = lower(${name})`,
        exceptId ? ne(participants.id, exceptId) : undefined
      )
    )
    .limit(1);
  if (existing) throw new ActionError("duplicateName");
}

async function touchDraw(drawId: string) {
  await db.update(draws).set({ updatedAt: new Date() }).where(eq(draws.id, drawId));
  revalidatePath("/[locale]/draws", "layout");
}

export async function addParticipant(drawId: string, input: ParticipantInput) {
  return runAction(async () => {
    const userId = await currentUserId();
    await assertOwnedDraw(drawId, userId);
    const parsed = participantSchema.safeParse(input);
    if (!parsed.success) throw new ActionError("invalidParticipant");

    const [{ total }] = await db
      .select({ total: count() })
      .from(participants)
      .where(eq(participants.drawId, drawId));
    if (total >= MAX_PARTICIPANTS) throw new ActionError("tooManyParticipants");

    await assertUniqueName(drawId, parsed.data.name);
    await db.insert(participants).values({ drawId, ...parsed.data });
    await touchDraw(drawId);
  });
}

export async function updateParticipant(participantId: string, input: ParticipantInput) {
  return runAction(async () => {
    const userId = await currentUserId();
    const { draw } = await assertOwnedParticipant(participantId, userId);
    if (draw.status !== "draft") throw new ActionError("alreadyDrawn");
    const parsed = participantSchema.safeParse(input);
    if (!parsed.success) throw new ActionError("invalidParticipant");

    await assertUniqueName(draw.id, parsed.data.name, participantId);
    await db.update(participants).set(parsed.data).where(eq(participants.id, participantId));
    await touchDraw(draw.id);
  });
}

export async function removeParticipant(participantId: string) {
  return runAction(async () => {
    const userId = await currentUserId();
    const { draw } = await assertOwnedParticipant(participantId, userId);
    if (draw.status !== "draft") throw new ActionError("alreadyDrawn");

    await db.delete(participants).where(eq(participants.id, participantId));
    await touchDraw(draw.id);
  });
}
