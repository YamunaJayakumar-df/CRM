// Tests for the New / Edit follow-up links.
import { describe, expect, it } from "vitest";
import { followUpEditHref, newFollowUpHref } from "./followUpHrefs";

describe("newFollowUpHref", () => {
  it("is the plain page with no options", () => {
    expect(newFollowUpHref()).toBe("/follow-ups/new");
  });

  it("adds the customer and an encoded returnTo", () => {
    expect(newFollowUpHref({ customerId: 12, returnTo: "/?fu=open&customer=12" })).toBe(
      "/follow-ups/new?customerId=12&returnTo=%2F%3Ffu%3Dopen%26customer%3D12",
    );
  });

  it("can carry only a returnTo", () => {
    expect(newFollowUpHref({ returnTo: "/" })).toBe("/follow-ups/new?returnTo=%2F");
  });
});

describe("followUpEditHref", () => {
  it("links to the edit page", () => {
    expect(followUpEditHref(5)).toBe("/follow-ups/5/edit");
  });

  it("adds an encoded returnTo", () => {
    expect(followUpEditHref(5, "/follow-ups?view=done")).toBe(
      "/follow-ups/5/edit?returnTo=%2Ffollow-ups%3Fview%3Ddone",
    );
  });
});
