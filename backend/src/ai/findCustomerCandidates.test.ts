// Tests for fetching customer candidates.
// The database is NOT used: vi.mock replaces db.ts with a fake `prisma`
// (same pattern as customerRoutes.test.ts).
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../db.js";
import { buildCandidateWhere, findCustomerCandidates, MAX_CANDIDATES } from "./findCustomerCandidates.js";

vi.mock("../db.js", () => ({
  prisma: { customer: { findMany: vi.fn() } },
}));

const findMany = vi.mocked(prisma.customer.findMany);

/** A fake customer row with the selected fields only. */
function row(id: number) {
  return { id, companyName: `Company ${id}`, contactName: null, website: null };
}

beforeEach(() => {
  findMany.mockReset();
});

describe("buildCandidateWhere", () => {
  it("searches each company word in name and website, and the contact name", () => {
    expect(buildCandidateWhere({ companyName: "Sunrise Hospital", contactName: "Ravi" })).toEqual({
      OR: [
        { companyName: { contains: "sunrise", mode: "insensitive" } },
        { website: { contains: "sunrise", mode: "insensitive" } },
        { companyName: { contains: "hospital", mode: "insensitive" } },
        { website: { contains: "hospital", mode: "insensitive" } },
        { contactName: { contains: "ravi", mode: "insensitive" } },
      ],
    });
  });

  it("leaves out filler words like Pvt Ltd", () => {
    const where = buildCandidateWhere({ companyName: "Nova Pvt Ltd", contactName: null });
    expect(where?.OR).toHaveLength(2); // only "nova", in name and website
  });

  // % and _ are wildcards in the database search. nameWords already splits
  // on them, so they never reach the query (escapeSearchText is a second guard).
  it("never sends the wildcards % or _ to the database", () => {
    const where = buildCandidateWhere({ companyName: "100%_cloud", contactName: null });
    expect(where?.OR).toEqual([
      { companyName: { contains: "100", mode: "insensitive" } },
      { website: { contains: "100", mode: "insensitive" } },
      { companyName: { contains: "cloud", mode: "insensitive" } },
      { website: { contains: "cloud", mode: "insensitive" } },
    ]);
  });

  it("returns null when there is nothing to search", () => {
    expect(buildCandidateWhere({ companyName: "", contactName: null })).toBeNull();
    expect(buildCandidateWhere({ companyName: "Pvt Ltd", contactName: "  " })).toBeNull();
  });
});

describe("findCustomerCandidates", () => {
  it("only reads the fields needed for matching, at most one more than the limit", async () => {
    findMany.mockResolvedValue([row(1)] as never);
    await findCustomerCandidates({ companyName: "Sunrise", contactName: null });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { id: true, companyName: true, contactName: true, website: true },
        take: MAX_CANDIDATES + 1,
      }),
    );
  });

  it("returns the rows and moreMatches false when under the limit", async () => {
    findMany.mockResolvedValue([row(1), row(2)] as never);
    expect(await findCustomerCandidates({ companyName: "Sunrise", contactName: null })).toEqual({
      candidates: [row(1), row(2)],
      moreMatches: false,
    });
  });

  it("cuts to the limit and sets moreMatches when the database has more", async () => {
    const rows = Array.from({ length: MAX_CANDIDATES + 1 }, (_, index) => row(index + 1));
    findMany.mockResolvedValue(rows as never);
    const result = await findCustomerCandidates({ companyName: "Company", contactName: null });
    expect(result.candidates).toHaveLength(MAX_CANDIDATES);
    expect(result.moreMatches).toBe(true);
  });

  it("does not ask the database when there is nothing to search", async () => {
    expect(await findCustomerCandidates({ companyName: "", contactName: null })).toEqual({
      candidates: [],
      moreMatches: false,
    });
    expect(findMany).not.toHaveBeenCalled();
  });
});
