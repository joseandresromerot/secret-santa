import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { assignments, draws, participants } from "@/db/schema";

export async function listDraws(ownerId: string) {
  return db
    .select({
      id: draws.id,
      name: draws.name,
      status: draws.status,
      eventDate: draws.eventDate,
      createdAt: draws.createdAt,
      completedAt: draws.completedAt,
      participantCount: sql<number>`(
        select count(*)::int from ${participants}
        where ${participants.drawId} = ${draws.id}
      )`,
    })
    .from(draws)
    .where(eq(draws.ownerId, ownerId))
    .orderBy(desc(draws.createdAt));
}

/** Loads a draw with everything needed for the wizard, scoped to its owner. */
export async function getOwnedDraw(drawId: string, ownerId: string) {
  if (!isUuid(drawId)) return null;
  const draw = await db.query.draws.findFirst({
    where: and(eq(draws.id, drawId), eq(draws.ownerId, ownerId)),
    with: {
      participants: { orderBy: [asc(participants.createdAt)] },
      groups: { orderBy: (g, { asc }) => [asc(g.createdAt)] },
      exclusions: true,
    },
  });
  return draw ?? null;
}

export type OwnedDraw = NonNullable<Awaited<ReturnType<typeof getOwnedDraw>>>;

/** Email delivery status per participant. Never exposes who gives to whom. */
export async function getDeliveryStatus(drawId: string) {
  return db
    .select({
      assignmentId: assignments.id,
      participantId: participants.id,
      name: participants.name,
      email: participants.email,
      status: assignments.emailStatus,
      attempts: assignments.emailAttempts,
      sentAt: assignments.emailSentAt,
    })
    .from(assignments)
    .innerJoin(participants, eq(participants.id, assignments.giverId))
    .where(eq(assignments.drawId, drawId))
    .orderBy(asc(participants.createdAt));
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
