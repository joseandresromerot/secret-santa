import { randomInt } from "node:crypto";

export type MatchingParticipant = {
  id: string;
  groupId: string | null;
};

export type GroupPair = readonly [string, string];

export type MatchingInput = {
  participants: MatchingParticipant[];
  /** Symmetric pairs of groups whose members cannot give to each other. */
  excludedGroupPairs: GroupPair[];
};

/** Returns a random integer in [0, max). */
export type RandomFn = (max: number) => number;

const cryptoRandom: RandomFn = (max) => randomInt(max);

export type Assignment = { giverId: string; receiverId: string };

export type MatchingResult =
  | { ok: true; assignments: Assignment[] }
  | {
      ok: false;
      reason: "too_few_participants" | "no_options" | "too_restrictive";
      /** Participants that have nobody they can give to. */
      blockedParticipantIds: string[];
    };

export { MIN_PARTICIPANTS } from "../constants";
import { MIN_PARTICIPANTS } from "../constants";

function pairKey(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * allowed[i][j] === true when participant i may give a gift to participant j.
 * Rules: nobody gives to themselves, members of the same group never give to
 * each other, and members of excluded group pairs never give to each other.
 */
export function buildAllowedMatrix({
  participants,
  excludedGroupPairs,
}: MatchingInput): boolean[][] {
  const excluded = new Set(excludedGroupPairs.map(([a, b]) => pairKey(a, b)));

  return participants.map((giver, i) =>
    participants.map((receiver, j) => {
      if (i === j) return false;
      const g1 = giver.groupId;
      const g2 = receiver.groupId;
      if (g1 && g2) {
        if (g1 === g2) return false;
        if (excluded.has(pairKey(g1, g2))) return false;
      }
      return true;
    })
  );
}

function shuffle<T>(items: T[], random: RandomFn): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Finds a perfect matching givers -> receivers using Kuhn's augmenting-path
 * algorithm on randomized orderings. Returns receiver index per giver, or
 * null when no valid assignment exists.
 */
function findPerfectMatching(
  allowed: boolean[][],
  random: RandomFn
): number[] | null {
  const n = allowed.length;
  const adjacency = allowed.map((row) =>
    shuffle(
      row.flatMap((ok, j) => (ok ? [j] : [])),
      random
    )
  );
  const giverOfReceiver = new Array<number>(n).fill(-1);

  const tryAssign = (giver: number, visited: boolean[]): boolean => {
    for (const receiver of adjacency[giver]) {
      if (visited[receiver]) continue;
      visited[receiver] = true;
      const current = giverOfReceiver[receiver];
      if (current === -1 || tryAssign(current, visited)) {
        giverOfReceiver[receiver] = giver;
        return true;
      }
    }
    return false;
  };

  for (const giver of shuffle([...Array(n).keys()], random)) {
    if (!tryAssign(giver, new Array<boolean>(n).fill(false))) return null;
  }

  const receiverOfGiver = new Array<number>(n).fill(-1);
  giverOfReceiver.forEach((giver, receiver) => {
    receiverOfGiver[giver] = receiver;
  });
  return receiverOfGiver;
}

/**
 * Randomizes a valid matching by repeatedly swapping the receivers of two
 * givers whenever the swap keeps both assignments valid. This is a symmetric
 * Markov chain, so it removes the ordering bias of the initial matching.
 */
function mixMatching(
  matching: number[],
  allowed: boolean[][],
  random: RandomFn
): number[] {
  const n = matching.length;
  const result = [...matching];
  const iterations = 200 * n;
  for (let k = 0; k < iterations; k++) {
    const a = random(n);
    const b = random(n);
    if (a === b) continue;
    if (allowed[a][result[b]] && allowed[b][result[a]]) {
      [result[a], result[b]] = [result[b], result[a]];
    }
  }
  return result;
}

export function drawAssignments(
  input: MatchingInput,
  random: RandomFn = cryptoRandom
): MatchingResult {
  const { participants } = input;

  if (participants.length < MIN_PARTICIPANTS) {
    return { ok: false, reason: "too_few_participants", blockedParticipantIds: [] };
  }

  const allowed = buildAllowedMatrix(input);

  const blockedParticipantIds = participants
    .filter((_, i) => !allowed[i].some(Boolean) || !allowed.some((row) => row[i]))
    .map((p) => p.id);

  if (blockedParticipantIds.length > 0) {
    return { ok: false, reason: "no_options", blockedParticipantIds };
  }

  const matching = findPerfectMatching(allowed, random);
  if (!matching) {
    return { ok: false, reason: "too_restrictive", blockedParticipantIds: [] };
  }

  const mixed = mixMatching(matching, allowed, random);

  return {
    ok: true,
    assignments: mixed.map((receiver, giver) => ({
      giverId: participants[giver].id,
      receiverId: participants[receiver].id,
    })),
  };
}
