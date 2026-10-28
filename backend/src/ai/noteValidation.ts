// Checks a note (what a user typed or said) BEFORE we send it to the AI.
//
// Why: the AI costs money per request and guesses when the input is junk.
// Stopping bad notes here is free, fast and gives the user a clear message.
//
// HOW TO ADD A RULE: add one object to NOTE_RULES below.
//   - `name`  a short label (shows up in tests and logs)
//   - `check` gets the trimmed note; return an error message if the note
//             breaks the rule, or null if it is fine.
// Every rule runs, so the user sees ALL problems at once.

/** Longest note we accept. Keeps requests cheap and stops pasted documents. */
export const MAX_NOTE_LENGTH = 2000;

/** Shortest note that can mean anything ("Called Ravi" is 11). */
export const MIN_NOTE_LENGTH = 5;

export type NoteRule = {
  name: string;
  check: (note: string) => string | null;
};

export type ValidationResult<Data> =
  | { ok: true; data: Data }
  | { ok: false; errors: string[] };

// \p{L} means "any letter in any language", so Tamil or Hindi words count too.
const ANY_LETTER = /\p{L}/u;

export const NOTE_RULES: NoteRule[] = [
  {
    name: "not too short",
    check: (note) =>
      note.length < MIN_NOTE_LENGTH
        ? `The note is too short. Write at least ${MIN_NOTE_LENGTH} characters.`
        : null,
  },
  {
    name: "not too long",
    check: (note) =>
      note.length > MAX_NOTE_LENGTH
        ? `The note is too long (${note.length} characters). The limit is ${MAX_NOTE_LENGTH}.`
        : null,
  },
  {
    name: "has words",
    check: (note) =>
      ANY_LETTER.test(note) ? null : "The note has no words in it, only numbers or symbols.",
  },
];

/**
 * Check a note against every rule. On success `data` is the trimmed note,
 * ready to send to the AI. `rules` can be swapped in tests.
 */
export function validateNote(
  value: unknown,
  rules: NoteRule[] = NOTE_RULES,
): ValidationResult<string> {
  if (typeof value !== "string") {
    return { ok: false, errors: ["The note must be text."] };
  }
  const note = value.trim();
  if (note === "") {
    return { ok: false, errors: ["The note is empty."] };
  }

  const errors: string[] = [];
  for (const rule of rules) {
    const error = rule.check(note);
    if (error !== null) {
      errors.push(error);
    }
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, data: note };
}
