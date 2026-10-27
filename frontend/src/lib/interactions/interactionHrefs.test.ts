// Tests for the Log / Edit interaction links.
import { describe, expect, it } from "vitest";
import { interactionEditHref, newInteractionHref } from "./interactionHrefs";

describe("newInteractionHref", () => {
  it("is the plain page with no options", () => {
    expect(newInteractionHref()).toBe("/interactions/new");
  });

  it("adds the customer, type and an encoded returnTo", () => {
    expect(
      newInteractionHref({ customerId: 12, type: "MEETING", returnTo: "/?fu=open&customer=12" }),
    ).toBe("/interactions/new?customerId=12&type=MEETING&returnTo=%2F%3Ffu%3Dopen%26customer%3D12");
  });

  it("can carry only a returnTo", () => {
    expect(newInteractionHref({ returnTo: "/" })).toBe("/interactions/new?returnTo=%2F");
  });
});

describe("interactionEditHref", () => {
  it("links to the edit page", () => {
    expect(interactionEditHref(5)).toBe("/interactions/5/edit");
  });

  it("adds an encoded returnTo", () => {
    expect(interactionEditHref(5, "/interactions?view=table")).toBe(
      "/interactions/5/edit?returnTo=%2Finteractions%3Fview%3Dtable",
    );
  });
});
