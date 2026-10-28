// Tests for followUpDueState.
import { describe, expect, it } from "vitest";
import { followUpDueState } from "./followUpDue";

const today = "2026-10-26";

describe("followUpDueState", () => {
  it("marks open follow-ups due before today as overdue", () => {
    expect(followUpDueState("OPEN", "2026-10-25", today)).toBe("overdue");
  });

  it("marks open follow-ups due today", () => {
    expect(followUpDueState("OPEN", today, today)).toBe("today");
  });

  it("treats future open follow-ups as later", () => {
    expect(followUpDueState("OPEN", "2026-10-27", today)).toBe("later");
  });

  it("never marks done follow-ups as urgent", () => {
    expect(followUpDueState("DONE", "2026-10-01", today)).toBe("later");
    expect(followUpDueState("DONE", today, today)).toBe("later");
  });

  it("throws for invalid dates", () => {
    expect(() => followUpDueState("OPEN", "oops", today)).toThrow();
  });
});
