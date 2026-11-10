import { describe, expect, it } from "vitest";
import { decodeFileContent, parseParticipants } from "./parse-participants";

const valid = (text: string, existing?: string[]) =>
  parseParticipants(text, existing).map(({ name, email, error }) => ({ name, email, error }));

describe("parseParticipants", () => {
  it("parses comma separated CSV with a header", () => {
    expect(valid("nombre,correo\nAna,ana@example.com\nBeto,beto@example.com")).toEqual([
      { name: "Ana", email: "ana@example.com", error: null },
      { name: "Beto", email: "beto@example.com", error: null },
    ]);
  });

  it("parses semicolon and tab separated files and any column order", () => {
    expect(valid("Email;Name\r\nana@example.com;Ana María\r\nbeto@example.com\tBeto")).toEqual([
      { name: "Ana María", email: "ana@example.com", error: null },
      { name: "Beto", email: "beto@example.com", error: null },
    ]);
  });

  it("parses plain text formats", () => {
    expect(
      valid('Ana Pérez <Ana@Example.com>\n\n  Beto beto@example.com  \n"Díaz, Carla",carla@example.com')
    ).toEqual([
      { name: "Ana Pérez", email: "ana@example.com", error: null },
      { name: "Beto", email: "beto@example.com", error: null },
      { name: "Díaz, Carla", email: "carla@example.com", error: null },
    ]);
  });

  it("flags invalid rows", () => {
    const rows = valid(
      [
        "Ana,ana@example.com",
        "Sin correo",
        "ana@example.com",
        "Malo,malo@",
        "ANA,ana2@example.com",
        "Beto,beto@example.com",
        `${"x".repeat(61)},x@example.com`,
      ].join("\n"),
      ["Beto"]
    );
    expect(rows.map((r) => r.error)).toEqual([
      null,
      "missingEmail",
      "missingName",
      "invalidEmail",
      "duplicateInFile",
      "alreadyAdded",
      "nameTooLong",
    ]);
  });

  it("does not treat a data row as a header", () => {
    expect(valid("Ana,ana@example.com")).toHaveLength(1);
  });
});

describe("decodeFileContent", () => {
  it("decodes UTF-8 and strips the BOM", () => {
    const bytes = new TextEncoder().encode("﻿José,jose@example.com");
    expect(decodeFileContent(bytes.buffer as ArrayBuffer)).toBe("José,jose@example.com");
  });

  it("falls back to Windows-1252 for Excel exports", () => {
    // "José" in Windows-1252: é = 0xE9 (invalid as UTF-8)
    const bytes = new Uint8Array([0x4a, 0x6f, 0x73, 0xe9]);
    expect(decodeFileContent(bytes.buffer)).toBe("José");
  });
});
