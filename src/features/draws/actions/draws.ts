"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { draws } from "@/db/schema";
import { drawDetailsSchema, type DrawDetailsInput } from "../schemas";
import { ActionError, assertOwnedDraw, currentUserId, runAction } from "../lib/guards";

export async function createDraw(input: DrawDetailsInput) {
  return runAction(async () => {
    const userId = await currentUserId();
    const parsed = drawDetailsSchema.safeParse(input);
    if (!parsed.success) throw new ActionError("invalidDetails");

    const [draw] = await db
      .insert(draws)
      .values({ ...parsed.data, ownerId: userId })
      .returning({ id: draws.id });
    revalidatePath("/[locale]/draws", "page");
    return { id: draw.id };
  });
}

export async function updateDrawDetails(drawId: string, input: DrawDetailsInput) {
  return runAction(async () => {
    const userId = await currentUserId();
    await assertOwnedDraw(drawId, userId);
    const parsed = drawDetailsSchema.safeParse(input);
    if (!parsed.success) throw new ActionError("invalidDetails");

    await db
      .update(draws)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(draws.id, drawId));
    revalidatePath("/[locale]/draws", "layout");
  });
}

export async function deleteDraw(drawId: string) {
  return runAction(async () => {
    const userId = await currentUserId();
    await assertOwnedDraw(drawId, userId, { draftOnly: false });
    await db.delete(draws).where(and(eq(draws.id, drawId), eq(draws.ownerId, userId)));
    revalidatePath("/[locale]/draws", "page");
  });
}
