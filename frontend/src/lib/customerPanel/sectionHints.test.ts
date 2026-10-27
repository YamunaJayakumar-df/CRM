// Tests for the hints under the customer card's section links.
import { describe, expect, it } from "vitest";
import { followUpsHint, interactionsHint, notesHint } from "./sectionHints";

describe("interactionsHint", () => {
  it("shows the India day of the latest interaction", () => {
    // 20:00 UTC on Oct 25 is already Oct 26 in India.
    expect(interactionsHint("2026-10-25T20:00:00.000Z")).toBe("Last contact Oct 26, 2026");
  });

  it("says when there are none", () => {
    expect(interactionsHint(null)).toBe("None yet");
  });
});

describe("followUpsHint", () => {
  it("counts the open follow-ups", () => {
    expect(followUpsHint(3, 20)).toBe("3 open");
  });

  it("shows 20+ when the loaded list is full", () => {
    expect(followUpsHint(20, 20)).toBe("20+ open");
  });

  it("says when none are open", () => {
    expect(followUpsHint(0, 20)).toBe("None open");
  });
});

describe("notesHint", () => {
  it("shows the first line of the notes", () => {
    expect(notesHint("\nManaged IT support.\nNeeds 24x7 helpdesk.")).toBe("Managed IT support.");
  });

  it("says when there are no notes", () => {
    expect(notesHint(null)).toBe("No notes yet");
    expect(notesHint("  \n ")).toBe("No notes yet");
  });
});
