// Makes search text match literally in Prisma "contains" searches.
//
// Why: Prisma turns `contains: text` into a Postgres ILIKE '%text%' search,
// and in ILIKE "%" means "anything" and "_" means "any one character".
// Without escaping, searching "%" would match every customer.
// A backslash in front tells Postgres to treat the next character literally.

/** "100%" -> "100\%", "a_b" -> "a\_b", "a\b" -> "a\\b". */
export function escapeSearchText(text: string): string {
  return text.replace(/[\\%_]/g, (character) => `\\${character}`);
}
