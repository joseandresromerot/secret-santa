import { GroupsManager } from "@/features/draws/components/groups-manager";
import { StepFooter } from "@/features/draws/components/step-footer";
import { loadDraftDraw } from "@/features/draws/lib/load-draw";

export default async function GroupsPage({ params }: PageProps<"/[locale]/draws/[id]/groups">) {
  const { id, locale } = await params;
  const draw = await loadDraftDraw(id, locale);

  return (
    <>
      <GroupsManager
        drawId={draw.id}
        groups={draw.groups.map(({ id, name }) => ({ id, name }))}
        participants={draw.participants.map(({ id, name, groupId }) => ({ id, name, groupId }))}
        exclusions={draw.exclusions.map(({ groupAId, groupBId }) => ({ groupAId, groupBId }))}
      />
      <StepFooter backHref={`/draws/${id}/participants`} nextHref={`/draws/${id}/review`} />
    </>
  );
}
