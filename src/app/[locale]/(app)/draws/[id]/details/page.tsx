import type { Locale } from "@/i18n/routing";
import { DetailsForm } from "@/features/draws/components/details-form";
import { loadDraftDraw } from "@/features/draws/lib/load-draw";

export default async function DetailsPage({ params }: PageProps<"/[locale]/draws/[id]/details">) {
  const { id, locale } = await params;
  const draw = await loadDraftDraw(id, locale);

  return (
    <DetailsForm
      drawId={draw.id}
      initial={{
        name: draw.name,
        eventDate: draw.eventDate ?? "",
        budget: draw.budget ?? "",
        message: draw.message ?? "",
        locale: draw.locale as Locale,
      }}
    />
  );
}
