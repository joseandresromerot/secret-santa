import { participantSchema } from "../schemas";

export type ParsedRowError =
  | "missingEmail"
  | "invalidEmail"
  | "missingName"
  | "nameTooLong"
  | "duplicateInFile"
  | "alreadyAdded";

export type ParsedRow = {
  line: number;
  raw: string;
  name: string;
  email: string;
  error: ParsedRowError | null;
};

const EMAIL_PATTERN = /[^\s<>"',;()[\]]+@[^\s<>"',;()[\]]+/;
const HEADER_WORDS = /^(name|nombre|names|nombres|participante|participant|email|e-mail|correo|mail)$/i;
const MAX_NAME_LENGTH = 60;

/** Decodes a file as UTF-8, falling back to Windows-1252 (Excel on Windows). */
export function decodeFileContent(buffer: ArrayBuffer): string {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    text = new TextDecoder("windows-1252").decode(buffer);
  }
  return text.replace(/^﻿/, "");
}

function cleanName(value: string) {
  return value
    .replace(/[<>]/g, " ")
    .replace(/^[\s,;\t|"'-]+|[\s,;\t|"'-]+$/g, "")
    .replace(/""/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function isHeaderLine(line: string) {
  const cells = line.split(/[,;\t|]/).map((c) => c.trim().replace(/^"|"$/g, ""));
  return cells.length > 0 && cells.every((c) => c === "" || HEADER_WORDS.test(c));
}

/**
 * Parses participants from CSV or plain text. Each line must contain an email;
 * everything else on the line is taken as the name. Supports comma, semicolon,
 * tab and "Name <email>" formats, with or without a header row.
 */
export function parseParticipants(
  text: string,
  existingNames: string[] = []
): ParsedRow[] {
  const existing = new Set(existingNames.map((n) => n.toLowerCase()));
  const seen = new Set<string>();
  const rows: ParsedRow[] = [];

  text.split(/\r\n|\r|\n/).forEach((rawLine, index) => {
    const raw = rawLine.trim();
    if (!raw) return;
    if (rows.length === 0 && isHeaderLine(raw)) return;

    // Fall back to any token with "@" so malformed emails are reported as invalid
    const match = raw.match(EMAIL_PATTERN) ?? raw.match(/[^\s,;\t|<>"']*@[^\s,;\t|<>"']*/);
    const email = match ? match[0].toLowerCase() : "";
    const name = cleanName(match ? raw.replace(match[0], " ") : raw);

    let error: ParsedRowError | null = null;
    if (!email) error = "missingEmail";
    else if (!participantSchema.shape.email.safeParse(email).success) error = "invalidEmail";
    else if (!name) error = "missingName";
    else if (name.length > MAX_NAME_LENGTH) error = "nameTooLong";
    else if (existing.has(name.toLowerCase())) error = "alreadyAdded";
    else if (seen.has(name.toLowerCase())) error = "duplicateInFile";

    if (!error) seen.add(name.toLowerCase());
    rows.push({ line: index + 1, raw, name, email, error });
  });

  return rows;
}
