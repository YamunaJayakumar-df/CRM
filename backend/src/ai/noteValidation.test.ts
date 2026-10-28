// Tests for the checks a note must pass before it is sent to the AI.
import { describe, expect, it } from "vitest";
import { MAX_NOTE_LENGTH, validateNote, type NoteRule } from "./noteValidation.js";

describe("validateNote", () => {
  it("accepts a normal note and trims spaces", () => {
    expect(validateNote("  Called Ravi at Sunrise Hospital  ")).toEqual({
      ok: true,
      data: "Called Ravi at Sunrise Hospital",
    });
  });

  it("accepts words in other languages", () => {
    expect(validateNote("ரவியை அழைத்தேன்").ok).toBe(true);
  });

  it("rejects text that is not a string", () => {
    expect(validateNote(42)).toEqual({ ok: false, errors: ["The note must be text."] });
    expect(validateNote(undefined)).toEqual({ ok: false, errors: ["The note must be text."] });
  });

  it("rejects an empty or blank note", () => {
    expect(validateNote("   ")).toEqual({ ok: false, errors: ["The note is empty."] });
  });

  it("rejects a note that is too short", () => {
    expect(validateNote("hi")).toEqual({
      ok: false,
      errors: ["The note is too short. Write at least 5 characters."],
    });
  });

  it("rejects a note that is too long", () => {
    const result = validateNote("a".repeat(MAX_NOTE_LENGTH + 1));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors[0]).toMatch(/too long/);
  });

  it("accepts a note of exactly the maximum length", () => {
    expect(validateNote("a".repeat(MAX_NOTE_LENGTH)).ok).toBe(true);
  });

  it("rejects a note with only numbers or symbols", () => {
    expect(validateNote("12345 ???")).toEqual({
      ok: false,
      errors: ["The note has no words in it, only numbers or symbols."],
    });
  });

  it("lists every broken rule at once", () => {
    // "???" is both too short and has no words.
    const result = validateNote("???");
    expect(!result.ok && result.errors).toHaveLength(2);
  });

  it("runs extra rules passed in", () => {
    const noShouting: NoteRule = {
      name: "no shouting",
      check: (note) => (note === note.toUpperCase() ? "Please do not write in capitals only." : null),
    };
    expect(validateNote("CALLED RAVI", [noShouting])).toEqual({
      ok: false,
      errors: ["Please do not write in capitals only."],
    });
  });
});
