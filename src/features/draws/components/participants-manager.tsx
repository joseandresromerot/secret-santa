"use client";

import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addParticipant, removeParticipant, updateParticipant } from "../actions/participants";
import { MIN_PARTICIPANTS } from "../constants";

type Participant = { id: string; name: string; email: string };

export function ParticipantsManager({
  drawId,
  participants,
}: {
  drawId: string;
  participants: Participant[];
}) {
  const t = useTranslations("Participants");
  const te = useTranslations("Errors");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await addParticipant(drawId, { name, email });
      if (!result.ok) return void toast.error(te(result.error));
      setName("");
      setEmail("");
      nameRef.current?.focus();
    });
  };

  const missing = Math.max(0, MIN_PARTICIPANTS - participants.length);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <form onSubmit={onAdd} className="grid gap-2 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_1fr_auto]">
        <Input
          ref={nameRef}
          required
          maxLength={60}
          placeholder={t("name")}
          aria-label={t("name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          required
          type="email"
          placeholder={t("email")}
          aria-label={t("email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
          {t("add")}
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{t("count", { count: participants.length })}</span>
        {missing > 0 && <span className="text-muted-foreground">{t("minHint", { count: missing })}</span>}
      </div>

      {participants.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {participants.map((p) => (
            <ParticipantRow key={p.id} participant={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ParticipantRow({ participant }: { participant: Participant }) {
  const t = useTranslations("Participants");
  const tc = useTranslations("Common");
  const te = useTranslations("Errors");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(participant.name);
  const [email, setEmail] = useState(participant.email);
  const [isPending, startTransition] = useTransition();

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateParticipant(participant.id, { name, email });
      if (!result.ok) return void toast.error(te(result.error));
      setEditing(false);
    });
  };

  const onRemove = () =>
    startTransition(async () => {
      const result = await removeParticipant(participant.id);
      if (!result.ok) toast.error(te(result.error));
    });

  if (editing) {
    return (
      <li>
        <form onSubmit={onSave} className="grid gap-2 p-3 sm:grid-cols-[1fr_1fr_auto]">
          <Input required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} aria-label={t("name")} autoFocus />
          <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label={t("email")} />
          <div className="flex gap-1">
            <Button type="submit" size="icon" disabled={isPending} aria-label={tc("save")}>
              {isPending ? <Loader2 className="animate-spin" /> : <Check />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={tc("cancel")}
              onClick={() => {
                setName(participant.name);
                setEmail(participant.email);
                setEditing(false);
              }}
            >
              <X />
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
        {participant.name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{participant.name}</div>
        <div className="truncate text-sm text-muted-foreground">{participant.email}</div>
      </div>
      <Button variant="ghost" size="icon-sm" aria-label={tc("edit")} onClick={() => setEditing(true)}>
        <Pencil />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label={tc("delete")} onClick={onRemove} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
      </Button>
    </li>
  );
}
