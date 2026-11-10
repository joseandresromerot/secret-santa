import type { MatchingInput } from "./matching";

type DrawLike = {
  participants: { id: string; groupId: string | null }[];
  exclusions: { groupAId: string; groupBId: string }[];
};

export function toMatchingInput(draw: DrawLike): MatchingInput {
  return {
    participants: draw.participants.map(({ id, groupId }) => ({ id, groupId })),
    excludedGroupPairs: draw.exclusions.map((e) => [e.groupAId, e.groupBId] as const),
  };
}
