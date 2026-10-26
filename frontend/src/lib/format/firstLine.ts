// The first non-empty line of a longer text, e.g. a note shown under a title.
//
// Why: lists show only a short preview of notes and summaries. Taking the
// first line (instead of cutting at N characters) keeps whole sentences;
// CSS `truncate` then shortens it with "..." if it is still too wide.

/**
 * First line of `text` that has something in it, trimmed.
 * null, empty, or only spaces/newlines -> "".
 * Example: "\n  Call back about pricing\nThen send quote" -> "Call back about pricing"
 */
export function firstLine(text: string | null): string {
  const lines = (text ?? "").split(/\r?\n/);
  const found = lines.find((line) => line.trim() !== "");
  return found === undefined ? "" : found.trim();
}
