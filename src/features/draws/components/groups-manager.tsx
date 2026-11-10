"use client";

import { Ban, Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createGroup, deleteGroup, setGroupExclusion, setParticipantGroup } from "../actions/groups";
import { groupColor } from "../lib/group-colors";

type Group = { id: string; name: string };
type Participant = { id: string; name: string; groupId: string | null };
type Exclusion = { groupAId: string; groupBId: string };

type Props = {
  drawId: string;
  groups: Group[];
  participants: Participant[];
  exclusions: Exclusion[];
};

const nativeSelect =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 sm:w-48";

export function GroupsManager({ drawId, groups, participants, exclusions }: Props) {
  const t = useTranslations("Groups");
  const te = useTranslations("Errors");
  const [newGroup, setNewGroup] = useState("");
  const [isPending, startTransition] = useTransition();

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await createGroup(drawId, newGroup);
      if (!result.ok) return void toast.error(te(result.error));
      setNewGroup("");
    });
  };

  const groupIndex = new Map(groups.map((g, i) => [g.id, i]));

  return (
    <div className="space-y-10">
      {/* 1. Groups */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>

        <form onSubmit={onCreate} className="flex gap-2">
          <Input
            required
            maxLength={40}
            placeholder={t("newGroupPlaceholder")}
            aria-label={t("newGroupPlaceholder")}
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            className="max-w-xs"
          />
          <Button type="submit" variant="outline" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
            {t("add")}
          </Button>
        </form>

        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((group, i) => (
              <GroupCard
                key={group.id}
                drawId={drawId}
                group={group}
                colorIndex={i}
                members={participants.filter((p) => p.groupId === group.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 2. Members */}
      {groups.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{t("assignTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("assignDescription")}</p>
          </div>
          {participants.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
              {t("noParticipants")}
            </div>
          ) : (
            <ul className="divide-y rounded-xl border bg-card">
              {participants.map((p) => (
                <MemberRow key={p.id} participant={p} groups={groups} groupIndex={groupIndex} />
              ))}
            </ul>
          )}
        </section>
      )}

      {/* 3. Restrictions between groups */}
      {groups.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{t("restrictionsTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("restrictionsDescription")}</p>
          </div>
          {groups.length < 2 ? (
            <div className="rounded-xl border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
              {t("needTwoGroups")}
            </div>
          ) : (
            <ExclusionList drawId={drawId} groups={groups} exclusions={exclusions} />
          )}
        </section>
      )}
    </div>
  );
}

function GroupBadge({ name, colorIndex }: { name: string; colorIndex: number }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", groupColor(colorIndex))}>
      {name}
    </Badge>
  );
}

function GroupCard({
  drawId,
  group,
  colorIndex,
  members,
}: {
  drawId: string;
  group: Group;
  colorIndex: number;
  members: Participant[];
}) {
  const t = useTranslations("Groups");
  const tc = useTranslations("Common");
  const te = useTranslations("Errors");
  const [isPending, startTransition] = useTransition();

  const onDelete = () =>
    startTransition(async () => {
      const result = await deleteGroup(drawId, group.id);
      if (!result.ok) toast.error(te(result.error));
    });

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <GroupBadge name={group.name} colorIndex={colorIndex} />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          disabled={isPending}
          aria-label={`${tc("delete")} ${group.name}`}
        >
          {isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
        </Button>
      </div>
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noMembers")}</p>
      ) : (
        <p className="text-sm">{members.map((m) => m.name).join(", ")}</p>
      )}
      {members.length === 1 && <p className="mt-2 text-xs text-muted-foreground">{t("singleMemberHint")}</p>}
    </div>
  );
}

function MemberRow({
  participant,
  groups,
  groupIndex,
}: {
  participant: Participant;
  groups: Group[];
  groupIndex: Map<string, number>;
}) {
  const t = useTranslations("Groups");
  const te = useTranslations("Errors");
  const [isPending, startTransition] = useTransition();
  const [optimisticGroupId, setOptimisticGroupId] = useOptimistic(participant.groupId);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const groupId = e.target.value || null;
    startTransition(async () => {
      setOptimisticGroupId(groupId);
      const result = await setParticipantGroup(participant.id, groupId);
      if (!result.ok) toast.error(te(result.error));
    });
  };

  const index = optimisticGroupId ? groupIndex.get(optimisticGroupId) : undefined;

  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate font-medium">{participant.name}</span>
        {index !== undefined && <span className={cn("size-2 shrink-0 rounded-full", groupColor(index, "dot"))} />}
        {isPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
      </div>
      <select
        className={nativeSelect}
        value={optimisticGroupId ?? ""}
        onChange={onChange}
        aria-label={t("groupFor", { name: participant.name })}
      >
        <option value="">{t("noGroup")}</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
    </li>
  );
}

function ExclusionList({
  drawId,
  groups,
  exclusions,
}: {
  drawId: string;
  groups: Group[];
  exclusions: Exclusion[];
}) {
  const pairs: [Group, number, Group, number][] = [];
  groups.forEach((a, i) =>
    groups.slice(i + 1).forEach((b, j) => pairs.push([a, i, b, i + 1 + j]))
  );
  const excluded = new Set(exclusions.map((e) => [e.groupAId, e.groupBId].sort().join("|")));

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {pairs.map(([a, ai, b, bi]) => (
        <ExclusionRow
          key={`${a.id}|${b.id}`}
          drawId={drawId}
          a={a}
          aIndex={ai}
          b={b}
          bIndex={bi}
          checked={excluded.has([a.id, b.id].sort().join("|"))}
        />
      ))}
    </ul>
  );
}

function ExclusionRow({
  drawId,
  a,
  aIndex,
  b,
  bIndex,
  checked,
}: {
  drawId: string;
  a: Group;
  aIndex: number;
  b: Group;
  bIndex: number;
  checked: boolean;
}) {
  const t = useTranslations("Groups");
  const te = useTranslations("Errors");
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(checked);

  const onToggle = (value: boolean) =>
    startTransition(async () => {
      setOptimistic(value);
      const result = await setGroupExclusion(drawId, a.id, b.id, value);
      if (!result.ok) toast.error(te(result.error));
    });

  return (
    <li>
      <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
        <Checkbox checked={optimistic} onCheckedChange={onToggle} />
        <span className="flex flex-1 flex-wrap items-center gap-2 text-sm">
          <GroupBadge name={a.name} colorIndex={aIndex} />
          <Ban className="size-3.5 text-muted-foreground" />
          <GroupBadge name={b.name} colorIndex={bIndex} />
          <span className="text-muted-foreground">{t("pairLabel")}</span>
        </span>
        {isPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
      </label>
    </li>
  );
}
