// Checks for invisible "control characters" in text sent by a client.
//
// Why: JSON allows characters like "\u0000" (NUL) inside strings, but Postgres
// text columns refuse NUL, so saving it would crash with a 500 error.
// Other control characters are never useful in CRM text either.
// Every feature's validation reuses this helper.

// All control characters, including line breaks and tabs.
const ANY_CONTROL_CHARACTER = /[\u0000-\u001F\u007F]/;

// Control characters EXCEPT tab (\t), line feed (\n) and carriage return (\r),
// for multi-line fields like notes.
const CONTROL_CHARACTER_EXCEPT_LINE_BREAKS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

/** True if single-line text (e.g. a name or email) contains any control character. */
export function hasControlCharacters(text: string): boolean {
  return ANY_CONTROL_CHARACTER.test(text);
}

/** True if multi-line text (e.g. notes) contains a control character other than tab/newline. */
export function hasControlCharactersInMultilineText(text: string): boolean {
  return CONTROL_CHARACTER_EXCEPT_LINE_BREAKS.test(text);
}

/**
 * Turns Windows ("\r\n") and old Mac ("\r") line breaks into "\n".
 * Why: browsers send line breaks from multi-line boxes as "\r\n", so without
 * this the first line of a summary (used as its title) ends in a hidden "\r".
 * Used for multi-line fields only (notes, summaries).
 */
export function normalizeLineBreaks(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}
