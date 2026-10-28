// Tests for activityTitle.
import { describe, expect, it } from "vitest";
import type { InteractionType } from "@/lib/api/types";
import { activityTitle } from "./activityTitle";

describe("activityTitle", () => {
  it("uses the right small word for each type", () => {
    expect(activityTitle("CALL", "Acme Corp")).toBe("Call with Acme Corp");
    expect(activityTitle("EMAIL", "Acme Corp")).toBe("Email to Acme Corp");
    expect(activityTitle("MEETING", "Acme Corp")).toBe("Meeting with Acme Corp");
    expect(activityTitle("NOTE", "Acme Corp")).toBe("Note added for Acme Corp");
  });

  it("still shows something for a type the frontend does not know yet", () => {
    const unknown = "SMS" as InteractionType;
    expect(activityTitle(unknown, "Acme Corp")).toBe("SMS · Acme Corp");
  });
});
