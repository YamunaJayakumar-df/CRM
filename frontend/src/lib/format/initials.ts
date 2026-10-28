// Short initials for an avatar, e.g. "Acme Corp" -> "AC".
//
// Why: lists show a small round badge per company instead of a logo. Keeping
// the rule here means every avatar shows the same letters for the same name.

/**
 * Initials of a name, always uppercase.
 * - two or more words -> first letter of the first two words ("Acme Corp" -> "AC")
 * - one word -> its first two letters ("BrightTech" -> "BR"; "X" -> "X")
 * - empty, only spaces, or null -> "?"
 * Extra spaces anywhere are ignored.
 */
export function initialsOf(name: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter((word) => word !== "");
  if (words.length === 0) {
    return "?";
  }

  // Array.from splits by real characters, so emoji or accented letters
  // are never cut in half.
  if (words.length === 1) {
    return Array.from(words[0]).slice(0, 2).join("").toUpperCase();
  }
  const first = Array.from(words[0])[0];
  const second = Array.from(words[1])[0];
  return `${first}${second}`.toUpperCase();
}
