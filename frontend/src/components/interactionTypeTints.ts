// The colour of each interaction type: blue for calls, violet for emails,
// teal for meetings, amber for notes.
//
// Why one shared list: the dashboard's activity icons and the Interactions
// page's pills and column headers must use the SAME colour per type, or
// users would learn two colour codes. The type is always also shown as an
// icon or a word, so meaning never depends on colour alone.
// Full class names are written out so Tailwind can find them in this file.
import type { InteractionType } from "@/lib/api/types";

export const INTERACTION_TYPE_TINTS: Record<InteractionType, string> = {
  CALL: "bg-avatar-blue text-avatar-blue-ink",
  EMAIL: "bg-avatar-violet text-avatar-violet-ink",
  MEETING: "bg-avatar-teal text-avatar-teal-ink",
  NOTE: "bg-medium-bg text-medium-ink",
};

/** Used if the backend ever sends a type this frontend does not know yet. */
export const FALLBACK_TYPE_TINT = "bg-hover text-icon";

/** The tint classes for a type (grey for an unknown type). */
export function interactionTypeTint(type: InteractionType): string {
  return INTERACTION_TYPE_TINTS[type] ?? FALLBACK_TYPE_TINT;
}
