// Human-friendly words for the backend's enum values, e.g. "OPEN" -> "Open".
//
// Why: the backend sends codes in capitals; the UI shows normal words. Each
// table below is the ONE place to change a label. Because the tables are typed
// with Record<...>, adding a new value to a type in api/types.ts makes the
// compiler point here until it gets a label.
// If the backend ever sends a value the frontend doesn't know yet, the
// functions show the raw code instead of an empty space.
import type {
  CustomerStatus,
  FollowUpPriority,
  FollowUpStatus,
  InteractionType,
} from "@/lib/api/types";

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  CALL: "Call",
  EMAIL: "Email",
  MEETING: "Meeting",
  NOTE: "Note",
};

export const FOLLOW_UP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  OPEN: "Open",
  DONE: "Done",
};

export const FOLLOW_UP_PRIORITY_LABELS: Record<FollowUpPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

/** "ACTIVE" -> "Active" */
export function customerStatusLabel(status: CustomerStatus): string {
  return CUSTOMER_STATUS_LABELS[status] ?? status;
}

/** "CALL" -> "Call" */
export function interactionTypeLabel(type: InteractionType): string {
  return INTERACTION_TYPE_LABELS[type] ?? type;
}

/** "OPEN" -> "Open" */
export function followUpStatusLabel(status: FollowUpStatus): string {
  return FOLLOW_UP_STATUS_LABELS[status] ?? status;
}

/** "HIGH" -> "High" */
export function followUpPriorityLabel(priority: FollowUpPriority): string {
  return FOLLOW_UP_PRIORITY_LABELS[priority] ?? priority;
}
