import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { getOwnedDraw } from "./queries";

/** Loads the draw for a page, deduplicated per request. 404 if not owned. */
export const loadDraw = cache(async (drawId: string) => {
  const session = await auth();
  const draw = session?.user?.id ? await getOwnedDraw(drawId, session.user.id) : null;
  if (!draw) notFound();
  return draw;
});

/** For wizard steps: completed draws can't be edited anymore. */
export async function loadDraftDraw(drawId: string, locale: string) {
  const draw = await loadDraw(drawId);
  if (draw.status !== "draft") redirect({ href: `/draws/${drawId}/result`, locale });
  return draw;
}
