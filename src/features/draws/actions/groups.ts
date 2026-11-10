"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { drawGroups, draws, groupExclusions, participants } from "@/db/schema";
import { MAX_GROUPS, groupNameSchema } from "../schemas";
import {
  ActionError,
  assertOwnedDraw,
  assertOwnedGroup,
  assertOwnedParticipant,
  currentUserId,
  runAction,
} from "../lib/guards";

async function touchDraw(drawId: string) {
  await db.update(draws).set({ updatedAt: new Date() }).where(eq(draws.id, drawId));
  revalidatePath("/[locale]/draws", "layout");
}

export async function createGroup(drawId: string, name: string) {
  return runAction(async () => {
    const userId = await currentUserId();
    await assertOwnedDraw(drawId, userId);
    const parsed = groupNameSchema.safeParse(name);
    if (!parsed.success) throw new ActionError("invalidGroup");

    const existing = await db
      .select({ name: drawGroups.name })
      .from(drawGroups)
      .where(eq(drawGroups.drawId, drawId));
    if (existing.length >= MAX_GROUPS) throw new ActionError("tooManyGroups");
    if (existing.some((g) => g.name.toLowerCase() === parsed.data.toLowerCase())) {
      throw new ActionError("duplicateGroup");
    }

    await db.insert(drawGroups).values({ drawId, name: parsed.data });
    await touchDraw(drawId);
  });
}

export async function deleteGroup(drawId: string, groupId: string) {
  return runAction(async () => {
    const userId = await currentUserId();
    await assertOwnedDraw(drawId, userId);
    await assertOwnedGroup(groupId, drawId);
    // Members fall back to "no group" (FK on delete set null); exclusions cascade.
    await db.delete(drawGroups).where(eq(drawGroups.id, groupId));
    await touchDraw(drawId);
  });
}

export async function setParticipantGroup(participantId: string, groupId: string | null) {
  return runAction(async () => {
    const userId = await currentUserId();
    const { draw } = await assertOwnedParticipant(participantId, userId);
    if (draw.status !== "draft") throw new ActionError("alreadyDrawn");
    if (groupId) await assertOwnedGroup(groupId, draw.id);

    await db.update(participants).set({ groupId }).where(eq(participants.id, participantId));
    await touchDraw(draw.id);
  });
}

export async function setGroupExclusion(
  drawId: string,
  groupId1: string,
  groupId2: string,
  excluded: boolean
) {
  return runAction(async () => {
    const userId = await currentUserId();
    await assertOwnedDraw(drawId, userId);
    if (groupId1 === groupId2) throw new ActionError("invalidGroup");
    await assertOwnedGroup(groupId1, drawId);
    await assertOwnedGroup(groupId2, drawId);

    const [groupAId, groupBId] = [groupId1, groupId2].sort();
    if (excluded) {
      await db
        .insert(groupExclusions)
        .values({ drawId, groupAId, groupBId })
        .onConflictDoNothing();
    } else {
      await db
        .delete(groupExclusions)
        .where(
          and(eq(groupExclusions.groupAId, groupAId), eq(groupExclusions.groupBId, groupBId))
        );
    }
    await touchDraw(drawId);
  });
}

