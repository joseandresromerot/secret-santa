import { ParticipantsManager } from "@/features/draws/components/participants-manager";
import { StepFooter } from "@/features/draws/components/step-footer";
import { loadDraftDraw } from "@/features/draws/lib/load-draw";

export default async function ParticipantsPage({
  params,
}: PageProps<"/[locale]/draws/[id]/participants">) {
  const { id, locale } = await params;
  const draw = await loadDraftDraw(id, locale);

  return (
    <>
      <ParticipantsManager
        drawId={draw.id}
        participants={draw.participants.map(({ id, name, email }) => ({ id, name, email }))}
      />
      <StepFooter backHref={`/draws/${id}/details`} nextHref={`/draws/${id}/groups`} />
    </>
  );
}
