"use client";

import { CircleCheck, CircleX, Download, FileUp, Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { addParticipants } from "../actions/participants";
import { MAX_PARTICIPANTS } from "../constants";
import { decodeFileContent, parseParticipants } from "../lib/parse-participants";

const MAX_FILE_BYTES = 512 * 1024;

export function ImportParticipantsDialog({
  drawId,
  existingNames,
}: {
  drawId: string;
  existingNames: string[];
}) {
  const t = useTranslations("Import");
  const tc = useTranslations("Common");
  const te = useTranslations("Errors");
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => parseParticipants(text, existingNames), [text, existingNames]);
  const validRows = rows.filter((r) => !r.error);
  const invalidCount = rows.length - validRows.length;
  const available = MAX_PARTICIPANTS - existingNames.length;
  const overLimit = validRows.length > available;

  const reset = () => {
    setText("");
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      toast.error(t("fileTooLarge"));
      e.target.value = "";
      return;
    }
    setText(decodeFileContent(await file.arrayBuffer()));
    setFileName(file.name);
  };

  const downloadTemplate = () => {
    const csv = `${t.raw("templateHeader")}\n${t.raw("templateRows")}\n`;
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = t("templateFileName");
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = () =>
    startTransition(async () => {
      const result = await addParticipants(
        drawId,
        validRows.map(({ name, email }) => ({ name, email }))
      );
      if (!result.ok) return void toast.error(te(result.error));
      const { added, skipped } = result.data;
      toast.success(t("imported", { count: added }));
      if (skipped) toast.warning(t("skipped", { count: skipped }));
      reset();
      setOpen(false);
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (isPending) return;
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <Upload />
        {t("trigger")}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted/60 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
          {t.raw("exampleLine1")}
          <br />
          {t.raw("exampleLine2")}
          <br />
          {t.raw("exampleLine3")}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            className="sr-only"
            id="participants-file"
            onChange={onFile}
          />
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <FileUp />
            {t("chooseFile")}
          </Button>
          {fileName && <span className="truncate text-sm text-muted-foreground">{fileName}</span>}
          <Button variant="link" className="ml-auto px-0" onClick={downloadTemplate}>
            <Download />
            {t("downloadTemplate")}
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="participants-text">{t("pasteLabel")}</Label>
          <Textarea
            id="participants-text"
            rows={5}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setFileName(null);
            }}
            placeholder={t("pastePlaceholder")}
            className="font-mono text-xs"
          />
        </div>

        {rows.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                <CircleCheck className="size-4" />
                {t("readyCount", { count: validRows.length })}
              </span>
              {invalidCount > 0 && (
                <span className="inline-flex items-center gap-1 font-medium text-destructive">
                  <CircleX className="size-4" />
                  {t("errorCount", { count: invalidCount })}
                </span>
              )}
            </div>
            {overLimit && (
              <p className="text-sm text-destructive">{t("overLimit", { count: available })}</p>
            )}
            <div className="max-h-64 overflow-y-auto rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">{t("colName")}</th>
                    <th className="px-3 py-2 font-medium">{t("colEmail")}</th>
                    <th className="px-3 py-2 font-medium">{t("colStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((row) => (
                    <tr key={row.line} className={cn(row.error && "bg-destructive/5")}>
                      <td className="px-3 py-1.5 text-xs text-muted-foreground">{row.line}</td>
                      <td className="max-w-40 truncate px-3 py-1.5">{row.name || "—"}</td>
                      <td className="max-w-48 truncate px-3 py-1.5">{row.email || "—"}</td>
                      <td className="px-3 py-1.5 text-xs">
                        {row.error ? (
                          <span className="text-destructive">{t(`errors.${row.error}`)}</span>
                        ) : (
                          <span className="text-emerald-700">{t("ok")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {invalidCount > 0 && <p className="text-xs text-muted-foreground">{t("errorsHint")}</p>}
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={isPending} />}>
            {tc("cancel")}
          </DialogClose>
          <Button onClick={onImport} disabled={isPending || validRows.length === 0 || overLimit}>
            {isPending && <Loader2 className="animate-spin" />}
            {t("submit", { count: validRows.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
