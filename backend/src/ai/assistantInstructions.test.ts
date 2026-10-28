// Tests for the CRM assistant's instructions (plain text, no AI, no network).
import { describe, expect, it } from "vitest";
import { buildAssistantInstructions } from "./assistantInstructions.js";

describe("buildAssistantInstructions", () => {
  const instructions = buildAssistantInstructions("2026-10-27");

  it("tells the AI today's date and weekday", () => {
    expect(instructions).toContain("Today is Tuesday, 2026-10-27");
  });

  it("names the four interaction types", () => {
    for (const type of ["CALL", "EMAIL", "MEETING", "NOTE"]) {
      expect(instructions).toContain(type);
    }
  });

  it("forbids inventing details", () => {
    expect(instructions).toContain("Never invent");
  });

  it("asks which customer instead of guessing one", () => {
    expect(instructions).toContain("Never guess the company");
    expect(instructions).toContain('"Unclear: which customer?"');
  });

  it("describes the three CRM record kinds", () => {
    expect(instructions).toContain("1. Customer:");
    expect(instructions).toContain("2. Interaction:");
    expect(instructions).toContain("3. Follow-up:");
  });

  it("uses only our follow-up priorities", () => {
    for (const priority of ["HIGH", "MEDIUM", "LOW"]) {
      expect(instructions).toContain(priority);
    }
  });

  // Finding existing customers is our code's job (Lesson 4), not the AI's.
  it("tells the AI it cannot see the CRM's data", () => {
    expect(instructions).toContain("You cannot see the CRM's data");
  });

  it("rejects a date that is not YYYY-MM-DD", () => {
    expect(() => buildAssistantInstructions("27/10/2026")).toThrow(/real date/);
  });

  it("rejects a day that does not exist", () => {
    expect(() => buildAssistantInstructions("2026-02-31")).toThrow(/real date/);
  });
});
