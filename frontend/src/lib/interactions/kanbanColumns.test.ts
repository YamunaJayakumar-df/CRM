// Tests for the Kanban column list and the "Showing latest N" check.
import { describe, expect, it } from "vitest";
import { isListCapped, KANBAN_COLUMNS } from "./kanbanColumns";

describe("KANBAN_COLUMNS", () => {
  // Protects the column order on the board: Calls, Emails, Meetings, Notes.
  it("has one column per type, in order", () => {
    expect(KANBAN_COLUMNS.map((column) => column.type)).toEqual([
      "CALL",
      "EMAIL",
      "MEETING",
      "NOTE",
    ]);
  });
});

describe("isListCapped", () => {
  it("is true only when the list came back full", () => {
    expect(isListCapped(50, 50)).toBe(true);
    expect(isListCapped(49, 50)).toBe(false);
    expect(isListCapped(0, 50)).toBe(false);
  });
});
