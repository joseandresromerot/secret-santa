import { describe, expect, it } from "vitest";
import {
  buildAllowedMatrix,
  drawAssignments,
  type MatchingInput,
  type MatchingParticipant,
} from "./matching";

function people(spec: Record<string, string | null>): MatchingParticipant[] {
  return Object.entries(spec).map(([id, groupId]) => ({ id, groupId }));
}

function assertValid(input: MatchingInput) {
  const result = drawAssignments(input);
  expect(result.ok).toBe(true);
  if (!result.ok) return;

  const allowed = buildAllowedMatrix(input);
  const index = new Map(input.participants.map((p, i) => [p.id, i]));

  expect(result.assignments).toHaveLength(input.participants.length);
  expect(new Set(result.assignments.map((a) => a.giverId)).size).toBe(
    input.participants.length
  );
  expect(new Set(result.assignments.map((a) => a.receiverId)).size).toBe(
    input.participants.length
  );
  for (const { giverId, receiverId } of result.assignments) {
    expect(giverId).not.toBe(receiverId);
    expect(allowed[index.get(giverId)!][index.get(receiverId)!]).toBe(true);
  }
  return result.assignments;
}

describe("drawAssignments", () => {
  it("rejects draws with fewer than 3 participants", () => {
    const result = drawAssignments({
      participants: people({ a: null, b: null }),
      excludedGroupPairs: [],
    });
    expect(result).toMatchObject({ ok: false, reason: "too_few_participants" });
  });

  it("never assigns someone to themselves", () => {
    for (let run = 0; run < 200; run++) {
      assertValid({
        participants: people({ a: null, b: null, c: null, d: null, e: null }),
        excludedGroupPairs: [],
      });
    }
  });

  it("keeps members of the same group apart", () => {
    const input: MatchingInput = {
      participants: people({
        a1: "A", a2: "A", a3: "A",
        b1: "B", b2: "B", b3: "B",
      }),
      excludedGroupPairs: [],
    };
    for (let run = 0; run < 200; run++) {
      const assignments = assertValid(input)!;
      for (const { giverId, receiverId } of assignments) {
        expect(giverId[0]).not.toBe(receiverId[0]);
      }
    }
  });

  it("respects restrictions between groups in both directions", () => {
    const input: MatchingInput = {
      participants: people({
        a1: "A", a2: "A",
        b1: "B", b2: "B",
        c1: "C", c2: "C",
        d1: "D", d2: "D",
      }),
      excludedGroupPairs: [["A", "B"]],
    };
    for (let run = 0; run < 200; run++) {
      const assignments = assertValid(input)!;
      for (const { giverId, receiverId } of assignments) {
        const pair = [giverId[0], receiverId[0]].sort().join("");
        expect(pair).not.toBe("AB");
      }
    }
  });

  it("detects a participant with no possible receiver", () => {
    // A and B excluded, everyone is in A or B => nobody has options
    const result = drawAssignments({
      participants: people({ a1: "A", a2: "A", b1: "B" }),
      excludedGroupPairs: [["A", "B"]],
    });
    expect(result).toMatchObject({ ok: false, reason: "no_options" });
    if (!result.ok) {
      expect(result.blockedParticipantIds.sort()).toEqual(["a1", "a2", "b1"]);
    }
  });

  it("detects restrictions that make the draw impossible", () => {
    // 3 members of A must give to the only person outside A
    const result = drawAssignments({
      participants: people({ a1: "A", a2: "A", a3: "A", x: null }),
      excludedGroupPairs: [],
    });
    expect(result).toMatchObject({ ok: false, reason: "too_restrictive" });
  });

  it("allows participants without a group to give to anyone else", () => {
    assertValid({
      participants: people({ a1: "A", a2: "A", x: null, y: null }),
      excludedGroupPairs: [],
    });
  });

  it("produces every possible outcome over many runs", () => {
    // 4 people with no restrictions have 9 derangements
    const input: MatchingInput = {
      participants: people({ a: null, b: null, c: null, d: null }),
      excludedGroupPairs: [],
    };
    const outcomes = new Map<string, number>();
    const runs = 9000;
    for (let run = 0; run < runs; run++) {
      const result = drawAssignments(input);
      if (!result.ok) throw new Error("unexpected failure");
      const key = result.assignments
        .map((a) => `${a.giverId}${a.receiverId}`)
        .sort()
        .join(",");
      outcomes.set(key, (outcomes.get(key) ?? 0) + 1);
    }
    expect(outcomes.size).toBe(9);
    // roughly uniform: each outcome expected ~1000 times
    for (const count of outcomes.values()) {
      expect(count).toBeGreaterThan(700);
      expect(count).toBeLessThan(1300);
    }
  });
});
