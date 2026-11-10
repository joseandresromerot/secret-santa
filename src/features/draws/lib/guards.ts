import "server-only";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { draws, participants, drawGroups } from "@/db/schema";
import { isUuid } from "./queries";

export class ActionError extends Error {
  constructor(public key: string) {
    super(key);
  }
}

export async function currentUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new ActionError("unauthorized");
  return session.user.id;
}

/** Ensures the draw belongs to the user. Optionally requires it to still be a draft. */
export async function assertOwnedDraw(
  drawId: string,
  userId: string,
  { draftOnly = true } = {}
) {
  if (!isUuid(drawId)) throw new ActionError("notFound");
  const draw = await db.query.draws.findFirst({
    where: and(eq(draws.id, drawId), eq(draws.ownerId, userId)),
  });
  if (!draw) throw new ActionError("notFound");
  if (draftOnly && draw.status !== "draft") throw new ActionError("alreadyDrawn");
  return draw;
}

export async function assertOwnedParticipant(participantId: string, userId: string) {
  if (!isUuid(participantId)) throw new ActionError("notFound");
  const [row] = await db
    .select({ participant: participants, draw: draws })
    .from(participants)
    .innerJoin(draws, eq(draws.id, participants.drawId))
    .where(and(eq(participants.id, participantId), eq(draws.ownerId, userId)));
  if (!row) throw new ActionError("notFound");
  return row;
}

export async function assertOwnedGroup(groupId: string, drawId: string) {
  if (!isUuid(groupId)) throw new ActionError("notFound");
  const group = await db.query.drawGroups.findFirst({
    where: and(eq(drawGroups.id, groupId), eq(drawGroups.drawId, drawId)),
  });
  if (!group) throw new ActionError("notFound");
  return group;
}

/** Wraps an action body so known errors become `{ ok: false, error }`. */
export async function runAction<T>(
  fn: () => Promise<T>
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    if (err instanceof ActionError) return { ok: false, error: err.key };
    console.error(err);
    return { ok: false, error: "unexpected" };
  }
}
