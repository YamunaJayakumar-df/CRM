// The one-line title of an interaction in an activity list,
// e.g. "Call with Acme Corp" or "Email to Acme Corp".
//
// Why: each interaction type reads best with its own small word ("with",
// "to", "for"). Keeping the wording here gives the same titles everywhere.
import type { InteractionType } from "@/lib/api/types";

/**
 * Title for an interaction with a company.
 * CALL -> "Call with X", EMAIL -> "Email to X",
 * MEETING -> "Meeting with X", NOTE -> "Note added for X".
 * An unknown type (backend newer than frontend) -> "TYPE · X".
 */
export function activityTitle(type: InteractionType, companyName: string): string {
  switch (type) {
    case "CALL":
      return `Call with ${companyName}`;
    case "EMAIL":
      return `Email to ${companyName}`;
    case "MEETING":
      return `Meeting with ${companyName}`;
    case "NOTE":
      return `Note added for ${companyName}`;
    default:
      return `${type} · ${companyName}`;
  }
}
