// Fetches the customers that MIGHT be the one the AI heard (read only).
//
// This is the rough first pass: the database quickly finds rows that contain
// any of the words. The careful judgement (exact or partial, reasons, order)
// is done afterwards by rankCustomerOptions in customerMatching.ts.
import { prisma } from "../db.js";
import type { Prisma } from "../generated/prisma/client.js";
import { escapeSearchText } from "../shared/escapeSearchText.js";
import { searchWords, type CustomerCandidate, type NameToMatch } from "./customerMatching.js";

/** Most candidates we look at for one name. More -> the user is asked to be more exact. */
export const MAX_CANDIDATES = 50;

export type CandidateResult = {
  candidates: CustomerCandidate[];
  /** True when more customers matched than MAX_CANDIDATES. */
  moreMatches: boolean;
};

/** Case-insensitive "contains", with % and _ matched literally (see escapeSearchText). */
function containsText(word: string) {
  return { contains: escapeSearchText(word), mode: "insensitive" } as const;
}

/**
 * The Prisma "where" for the names: a customer matches when ANY company word is
 * in its company name or website, OR any contact word is in its contact name.
 * null when there is nothing to search for (both names empty).
 */
export function buildCandidateWhere(wanted: NameToMatch): Prisma.CustomerWhereInput | null {
  const companyWords = searchWords(wanted.companyName);
  const contactWords = wanted.contactName ? searchWords(wanted.contactName) : [];

  const conditions: Prisma.CustomerWhereInput[] = [
    ...companyWords.flatMap((word) => [{ companyName: containsText(word) }, { website: containsText(word) }]),
    ...contactWords.map((word) => ({ contactName: containsText(word) })),
  ];
  return conditions.length > 0 ? { OR: conditions } : null;
}

/** Fetch possible customers for the names. Never writes. */
export async function findCustomerCandidates(wanted: NameToMatch): Promise<CandidateResult> {
  const where = buildCandidateWhere(wanted);
  if (where === null) {
    return { candidates: [], moreMatches: false };
  }

  // Ask for ONE more than the limit: if it comes back, we know there are more.
  const rows = await prisma.customer.findMany({
    where,
    select: { id: true, companyName: true, contactName: true, website: true },
    orderBy: { companyName: "asc" },
    take: MAX_CANDIDATES + 1,
  });
  return {
    candidates: rows.slice(0, MAX_CANDIDATES),
    moreMatches: rows.length > MAX_CANDIDATES,
  };
}
