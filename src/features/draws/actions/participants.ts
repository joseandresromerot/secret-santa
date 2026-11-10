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

/**
 * Imports several participants at once. Invalid rows and names that already
 * exist (in the draw or earlier in the batch) are skipped.
 */
export async function addParticipants(drawId: string, input: ParticipantInput[]) {
  return runAction(async () => {
    const userId = await currentUserId();
    await assertOwnedDraw(drawId, userId);
    if (!Array.isArray(input) || input.length === 0) throw new ActionError("invalidParticipant");

    const existing = await db
      .select({ name: participants.name })
      .from(participants)
      .where(eq(participants.drawId, drawId));
    if (existing.length + input.length > MAX_PARTICIPANTS) {
      throw new ActionError("tooManyParticipants");
    }

    const taken = new Set(existing.map((p) => p.name.toLowerCase()));
    const rows: { drawId: string; name: string; email: string }[] = [];
    for (const item of input) {
      const parsed = participantSchema.safeParse(item);
      if (!parsed.success) continue;
      const key = parsed.data.name.toLowerCase();
      if (taken.has(key)) continue;
      taken.add(key);
      rows.push({ drawId, ...parsed.data });
    }

    if (rows.length > 0) {
      await db.insert(participants).values(rows);
      await touchDraw(drawId);
    }
    return { added: rows.length, skipped: input.length - rows.length };
  });
}
