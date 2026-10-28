// Tests for ranking customer options (pure logic, no database).
// Candidates are shaped like our demo data (src/demoData/demoData.ts).
import { describe, expect, it } from "vitest";
import {
  nameWords,
  rankCustomerOptions,
  searchWords,
  type CustomerCandidate,
} from "./customerMatching.js";

const SUNRISE: CustomerCandidate = {
  id: 1,
  companyName: "Sunrise Multispeciality Hospital",
  contactName: "Priya Raman",
  website: "sunrisehospital.example",
};
const GREENFIELD_PUBLIC: CustomerCandidate = {
  id: 2,
  companyName: "Greenfield Public School",
  contactName: "Arjun Mehta",
  website: "greenfieldschool.example",
};
const GREENFIELD_INTERNATIONAL: CustomerCandidate = {
  id: 3,
  companyName: "Greenfield International School",
  contactName: "Meera Iyer",
  website: null,
};
const BLUEWAVE_TEXTILES: CustomerCandidate = {
  id: 4,
  companyName: "Bluewave Textiles",
  contactName: "Sneha Kulkarni",
  website: "bluewavetextiles.example",
};
const ORCHID: CustomerCandidate = {
  id: 5,
  companyName: "Orchid Hotels & Resorts",
  contactName: "Vikram Singh",
  website: "orchidhotels.example",
};
const LOTUS_BANK: CustomerCandidate = {
  id: 6,
  companyName: "Lotus Cooperative Bank",
  contactName: "Arjun Rao",
  website: null,
};

const ALL = [SUNRISE, GREENFIELD_PUBLIC, GREENFIELD_INTERNATIONAL, BLUEWAVE_TEXTILES, ORCHID, LOTUS_BANK];

/** Just the ids, in ranked order, to keep expectations short. */
function rankedIds(companyName: string, contactName: string | null = null): number[] {
  return rankCustomerOptions({ companyName, contactName }, ALL).options.map((option) => option.id);
}

describe("nameWords", () => {
  it("lowercases, drops punctuation and filler words", () => {
    expect(nameWords("Orchid Hotels & Resorts Pvt. Ltd")).toEqual(["orchid", "hotels", "resorts"]);
  });

  it("keeps letters of other languages", () => {
    expect(nameWords("சன்ரைஸ் Hospital")).toEqual(["சன்ரைஸ்", "hospital"]);
  });
});

describe("searchWords", () => {
  it("leaves out words shorter than 3 letters", () => {
    expect(searchWords("Nova IT Solutions")).toEqual(["nova", "solutions"]);
  });

  it("keeps short words when there is nothing else", () => {
    expect(searchWords("HP")).toEqual(["hp"]);
  });
});

describe("rankCustomerOptions", () => {
  it("marks the same name (after cleaning) as exactName", () => {
    const choices = rankCustomerOptions({ companyName: "Orchid Hotels and Resorts Pvt Ltd", contactName: null }, ALL);
    expect(choices.options).toHaveLength(1);
    expect(choices.options[0]).toMatchObject({ id: ORCHID.id, strength: "exactName" });
  });

  it("finds a longer name that contains every word as allWords", () => {
    const choices = rankCustomerOptions({ companyName: "Sunrise Hospital", contactName: null }, ALL);
    expect(choices.options[0]).toMatchObject({
      id: SUNRISE.id,
      strength: "allWords",
      reasons: ["company name has: sunrise, hospital", "website has: sunrise, hospital"],
    });
  });

  it("lists BOTH similar names, never just one", () => {
    expect(rankedIds("Greenfield School")).toEqual([GREENFIELD_INTERNATIONAL.id, GREENFIELD_PUBLIC.id]);
  });

  it("ranks the option whose contact also matches first", () => {
    expect(rankedIds("Greenfield School", "Arjun")).toEqual([
      GREENFIELD_PUBLIC.id, // all words + contact
      GREENFIELD_INTERNATIONAL.id, // all words
      LOTUS_BANK.id, // contact only
    ]);
  });

  it("lists a different company that shares one word as someWords", () => {
    const choices = rankCustomerOptions({ companyName: "Bluewave Logistics", contactName: null }, ALL);
    expect(choices.options).toEqual([
      {
        id: BLUEWAVE_TEXTILES.id,
        companyName: "Bluewave Textiles",
        contactName: "Sneha Kulkarni",
        strength: "someWords",
        reasons: ["company name has: bluewave", "website has: bluewave"],
      },
    ]);
  });

  it("lists every customer with the same contact name (equal matches A to Z)", () => {
    const choices = rankCustomerOptions({ companyName: "Nova Tech", contactName: "Arjun" }, ALL);
    expect(choices.options.map((option) => [option.id, option.strength])).toEqual([
      [GREENFIELD_PUBLIC.id, "contactOnly"],
      [LOTUS_BANK.id, "contactOnly"],
    ]);
  });

  it("returns no options when nothing matches, but still offers createNew", () => {
    const choices = rankCustomerOptions({ companyName: "Nova Tech", contactName: "Kiran" }, ALL);
    expect(choices).toEqual({
      options: [],
      createNew: { companyName: "Nova Tech", contactName: "Kiran" },
      moreMatches: false,
    });
  });

  it("always offers createNew, even for an exact match", () => {
    const choices = rankCustomerOptions({ companyName: "Bluewave Textiles", contactName: null }, ALL);
    expect(choices.options[0]?.strength).toBe("exactName");
    expect(choices.createNew).toEqual({ companyName: "Bluewave Textiles", contactName: null });
  });

  it("passes moreMatches through so the screen can say the list is incomplete", () => {
    expect(rankCustomerOptions({ companyName: "Sunrise", contactName: null }, [SUNRISE], true).moreMatches).toBe(true);
  });

  it("works without a contact name", () => {
    expect(rankedIds("Lotus Bank", null)).toEqual([LOTUS_BANK.id]);
  });

  it("matches only by contact when the company name is empty", () => {
    const choices = rankCustomerOptions({ companyName: "", contactName: "Priya" }, ALL);
    expect(choices.options).toEqual([expect.objectContaining({ id: SUNRISE.id, strength: "contactOnly" })]);
  });

  it("ignores upper and lower case", () => {
    expect(rankedIds("BLUEWAVE TEXTILES")).toEqual([BLUEWAVE_TEXTILES.id]);
  });

  // ---- Known limits, written down as tests so they are not a surprise ----

  it("LIMIT: a word piece also matches ('sun' matches Sunrise)", () => {
    expect(rankedIds("Sun Pharma")).toEqual([SUNRISE.id]);
  });

  it("LIMIT: a typo is not found", () => {
    expect(rankedIds("Sunrsie Hospital")).toEqual([SUNRISE.id]); // only via "hospital"
    const choices = rankCustomerOptions({ companyName: "Sunrsie Hospital", contactName: null }, ALL);
    expect(choices.options[0]?.strength).toBe("someWords");
  });
});
