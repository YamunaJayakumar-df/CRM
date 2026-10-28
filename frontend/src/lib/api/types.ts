// TypeScript shapes of the JSON our Express backend sends.
//
// Why: Server Components read this data and pass it to the UI. Typing it once
// here means a typo like `customer.compnyName` is caught by the compiler, and
// if the backend changes a field we update ONE file.
// Dates arrive as text in JSON:
//   - moments in time (createdAt, occurredAt, ...) are ISO strings,
//     e.g. "2026-10-26T04:30:00.000Z"
//   - a follow-up's dueDate is a plain calendar day, e.g. "2026-10-30"
// Keep these in sync with backend/prisma/schema.prisma and the route files.

/** Whether we currently work with a customer. */
export type CustomerStatus = "ACTIVE" | "INACTIVE";

/** The kinds of contact we log with a customer. */
export type InteractionType = "CALL" | "EMAIL" | "MEETING" | "NOTE";

/** Whether a follow-up still needs doing. */
export type FollowUpStatus = "OPEN" | "DONE";

/** How urgent a follow-up is. */
export type FollowUpPriority = "LOW" | "MEDIUM" | "HIGH";

/** A company we provide IT services to (GET /customers, GET /customers/:id). */
export type Customer = {
  id: number;
  companyName: string;
  contactName: string | null;
  website: string | null;
  industry: string | null;
  status: CustomerStatus;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/** The small piece of customer data sent along with interactions and follow-ups. */
export type CustomerSummary = {
  id: number;
  companyName: string;
  website: string | null;
  status: CustomerStatus;
};

/** Something that happened with a customer (GET /interactions). */
export type Interaction = {
  id: number;
  customerId: number;
  type: InteractionType;
  summary: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
  customer: CustomerSummary;
};

/** Something someone must do for a customer by a certain day (GET /follow-ups). */
export type FollowUp = {
  id: number;
  customerId: number;
  title: string;
  /** Plain calendar day "YYYY-MM-DD" (Asia/Kolkata), NOT a moment in time. */
  dueDate: string;
  status: FollowUpStatus;
  priority: FollowUpPriority;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: CustomerSummary;
};

/**
 * Numbers for the dashboard (GET /dashboard).
 * Every daily array is oldest day first, newest (or furthest ahead) last.
 */
export type DashboardSummary = {
  /** Today in Asia/Kolkata, "YYYY-MM-DD". */
  today: string;
  customers: {
    total: number;
    active: number;
    addedLast7Days: number;
    dailyNew: number[];
  };
  followUps: {
    open: number;
    overdue: number;
    dueToday: number;
    dueNext7Days: number;
    done: number;
    dueByDayNext14: number[];
    overdueByDayLast14: number[];
  };
  interactions: {
    last7Days: number;
    previous7Days: number;
    dailyCount: number[];
  };
};
