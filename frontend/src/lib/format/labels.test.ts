// Tests for enum display labels.
import { describe, expect, it } from "vitest";
import type { FollowUpStatus } from "@/lib/api/types";
import {
  customerStatusLabel,
  followUpPriorityLabel,
  followUpStatusLabel,
  interactionTypeLabel,
} from "./labels";

describe("labels", () => {
  it("labels customer statuses", () => {
    expect(customerStatusLabel("ACTIVE")).toBe("Active");
    expect(customerStatusLabel("INACTIVE")).toBe("Inactive");
  });

  it("labels interaction types", () => {
    expect(interactionTypeLabel("CALL")).toBe("Call");
    expect(interactionTypeLabel("EMAIL")).toBe("Email");
    expect(interactionTypeLabel("MEETING")).toBe("Meeting");
    expect(interactionTypeLabel("NOTE")).toBe("Note");
  });

  it("labels follow-up statuses and priorities", () => {
    expect(followUpStatusLabel("OPEN")).toBe("Open");
    expect(followUpStatusLabel("DONE")).toBe("Done");
    expect(followUpPriorityLabel("LOW")).toBe("Low");
    expect(followUpPriorityLabel("MEDIUM")).toBe("Medium");
    expect(followUpPriorityLabel("HIGH")).toBe("High");
  });

  it("shows the raw code for a value the frontend does not know yet", () => {
    // Simulates the backend adding a new status before the frontend is updated.
    const unknownStatus = "SNOOZED" as FollowUpStatus;
    expect(followUpStatusLabel(unknownStatus)).toBe("SNOOZED");
  });
});
