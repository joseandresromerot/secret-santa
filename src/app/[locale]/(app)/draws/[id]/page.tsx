import { redirect } from "@/i18n/navigation";
import { loadDraw } from "@/features/draws/lib/load-draw";

export default async function DrawIndexPage({ params }: PageProps<"/[locale]/draws/[id]">) {
  const { id, locale } = await params;
  const draw = await loadDraw(id);
  const step = draw.status === "completed" ? "result" : draw.participants.length ? "participants" : "details";
  redirect({ href: `/draws/${id}/${step}`, locale });
}
