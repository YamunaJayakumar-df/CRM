// Turns "the customer the AI heard" into a ranked list of options.
//
// Our code never treats an option as proven: the same name can appear in
// several places (several customers, a website, a contact person), so we list
// EVERY possible match, best first, each with the reasons it matched, and
// always offer "create a new customer". What happens next (pre-select or ask)
// is decided separately, and the user always confirms the final review.
//
// This file is pure logic (no database), so it is easy to test.
//
// Known limits (on purpose, kept simple):
//   - word PIECES match ("sun" also matches "Sunday Foods"): we prefer showing
//     one option too many over missing the right one;
//   - typos are not found ("Sunrsie" does not match "Sunrise");
//   - names written in different scripts (Tamil vs English) do not match.

/** Words that say nothing about WHICH company it is ("Pvt Ltd", "and"). */
const FILLER_WORDS = new Set(["pvt", "ltd", "limited", "private", "the", "and", "co", "inc", "llp"]);

/** Shorter words are not searched: "it" is a piece of "hospital", "kitchen", ... */
const SEARCH_WORD_MIN_LENGTH = 3;

/** A customer row from the database, only the fields we compare. */
export type CustomerCandidate = {
  id: number;
  companyName: string;
  contactName: string | null;
  website: string | null;
};

/** The names the AI heard in the note. */
export type NameToMatch = {
  companyName: string;
  contactName: string | null;
};

/** How well an option matches, best first. */
export type MatchStrength = "exactName" | "allWords" | "someWords" | "contactOnly";

const STRENGTH_ORDER: MatchStrength[] = ["exactName", "allWords", "someWords", "contactOnly"];

export type CustomerOption = {
  id: number;
  companyName: string;
  contactName: string | null;
  strength: MatchStrength;
  /** Plain-English reasons, e.g. "company name has: sunrise, hospital". */
  reasons: string[];
};

export type CustomerChoices = {
  /** Every matching customer, best first. Can be empty. */
  options: CustomerOption[];
  /** Always offered: the user may decide it is a new customer. */
  createNew: NameToMatch;
  /** True when the database had more matches than we fetched. */
  moreMatches: boolean;
};

/**
 * The words of a name, cleaned: lowercase, punctuation removed, filler and
 * 1-letter words dropped. "Orchid Hotels & Resorts Pvt. Ltd" -> ["orchid", "hotels", "resorts"].
 * \p{L} letters, \p{M} marks and \p{N} digits, in any language. Marks matter:
 * Tamil and Hindi vowel signs (like ை or ि) are marks, not letters, and
 * without \p{M} a word like "சன்ரைஸ்" would be cut into pieces.
 */
export function nameWords(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter((word) => word.length > 1 && !FILLER_WORDS.has(word));
}

/**
 * The words we search with. Short words are left out, unless the name has
 * nothing else ("HP" is still searched as "hp").
 */
export function searchWords(name: string): string[] {
  const words = nameWords(name);
  const longWords = words.filter((word) => word.length >= SEARCH_WORD_MIN_LENGTH);
  return longWords.length > 0 ? longWords : words;
}

/** Compare one candidate with the wanted names. null if nothing matches at all. */
function compareCandidate(wanted: NameToMatch, candidate: CustomerCandidate) {
  const wantedWords = searchWords(wanted.companyName);
  const company = nameWords(candidate.companyName).join(" ");
  const website = (candidate.website ?? "").toLowerCase();

  // "includes" (word pieces, not whole words) on purpose: list every possible option.
  const inCompany = wantedWords.filter((word) => company.includes(word));
  const inWebsite = wantedWords.filter((word) => website.includes(word));
  const matchedWords = wantedWords.filter((word) => inCompany.includes(word) || inWebsite.includes(word));

  const contactWords = wanted.contactName ? searchWords(wanted.contactName) : [];
  const candidateContact = nameWords(candidate.contactName ?? "").join(" ");
  const contactMatches = contactWords.some((word) => candidateContact.includes(word));

  const reasons: string[] = [];
  if (inCompany.length > 0) {
    reasons.push(`company name has: ${inCompany.join(", ")}`);
  }
  if (inWebsite.length > 0) {
    reasons.push(`website has: ${inWebsite.join(", ")}`);
  }
  if (contactMatches) {
    reasons.push(`contact name matches: ${candidate.contactName}`);
  }
  if (reasons.length === 0) {
    return null;
  }

  const wantedName = nameWords(wanted.companyName).join(" ");
  let strength: MatchStrength;
  if (wantedName !== "" && company === wantedName) {
    strength = "exactName";
  } else if (wantedWords.length > 0 && matchedWords.length === wantedWords.length) {
    strength = "allWords";
  } else if (matchedWords.length > 0) {
    strength = "someWords";
  } else {
    strength = "contactOnly";
  }
  return { strength, reasons, matchedWordCount: matchedWords.length, contactMatches };
}

/**
 * Every candidate that matches, ranked best first:
 * strength, then contact name match, then more matching words, then A to Z.
 * A high rank is NOT proof that it is the right customer.
 */
export function rankCustomerOptions(
  wanted: NameToMatch,
  candidates: CustomerCandidate[],
  moreMatches = false,
): CustomerChoices {
  const compared = candidates.flatMap((candidate) => {
    const result = compareCandidate(wanted, candidate);
    return result === null ? [] : [{ candidate, ...result }];
  });

  compared.sort(
    (a, b) =>
      STRENGTH_ORDER.indexOf(a.strength) - STRENGTH_ORDER.indexOf(b.strength) ||
      Number(b.contactMatches) - Number(a.contactMatches) ||
      b.matchedWordCount - a.matchedWordCount ||
      a.candidate.companyName.localeCompare(b.candidate.companyName),
  );

  return {
    options: compared.map(({ candidate, strength, reasons }) => ({
      id: candidate.id,
      companyName: candidate.companyName,
      contactName: candidate.contactName,
      strength,
      reasons,
    })),
    createNew: { companyName: wanted.companyName, contactName: wanted.contactName },
    moreMatches,
  };
}
