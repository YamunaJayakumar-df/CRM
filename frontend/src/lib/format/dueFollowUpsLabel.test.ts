// Tests for dueFollowUpsLabel.
import { describe, expect, it } from "vitest";
import { dueFollowUpsLabel } from "./dueFollowUpsLabel";

describe("dueFollowUpsLabel", () => {
  it("uses the singular for one", () => {
    expect(dueFollowUpsLabel(1)).toBe("1 follow-up due today or overdue");
  });

  it("uses the plural otherwise", () => {
    expect(dueFollowUpsLabel(3)).toBe("3 follow-ups due today or overdue");
    expect(dueFollowUpsLabel(0)).toBe("0 follow-ups due today or overdue");
  });
});
