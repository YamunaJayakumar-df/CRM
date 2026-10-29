// Customer facts sheet: the CRM data the "Summarise customer" AI job reads.
//
// The AI never reads the database. OUR code picks the facts and writes them
// as short plain text; the AI only sees that text. Two parts:
//   loadCustomerFacts(id)          -> database reads (read only), or null
//   customerFactsText(facts, today) -> pure, easy to test
//
// What is left out on purpose:
// - email and phone: a summary does not need them, so they are never sent
//   to the AI service (send only what the job needs).
// Limits keep each request small (= cheap and fast): the latest 20
// interactions, 20 open follow-ups, 5 recently completed ones, and long
// texts cut to 500 characters.
import { prisma } from "../db.js";
import { dateToPlainDate, plainDateOfMoment, plainDateToDate } from "../shared/plainDate.js";

export const MAX_INTERACTIONS = 20;
export const MAX_OPEN_FOLLOW_UPS = 20;
export const MAX_DONE_FOLLOW_UPS = 5;
export const MAX_TEXT_LENGTH = 500;

export type FactsFollowUp = {
  title: string;
  dueDate: Date;
  priority: string;
  notes: string | null;
};

export type CustomerFacts = {
  customer: {
    companyName: string;
    contactName: string | null;
    website: string | null;
    industry: string | null;
    status: string;
    notes: string | null;
  };
  interactions: { type: string; summary: string; occurredAt: Date }[];
  /** How many interactions the customer has in total (may be more than shown). */
  interactionTotal: number;
  openFollowUps: FactsFollowUp[];
  doneFollowUps: FactsFollowUp[];
};

const FOLLOW_UP_FIELDS = { title: true, dueDate: true, priority: true, notes: true } as const;

/** Read one customer's facts (read only). Null when the customer does not exist. */
export async function loadCustomerFacts(customerId: number): Promise<CustomerFacts | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      companyName: true,
      contactName: true,
      website: true,
      industry: true,
      status: true,
      notes: true,
      interactions: {
        select: { type: true, summary: true, occurredAt: true },
        orderBy: { occurredAt: "desc" },
        take: MAX_INTERACTIONS,
      },
      _count: { select: { interactions: true } },
    },
  });
  if (customer === null) {
    return null;
  }

  const [openFollowUps, doneFollowUps] = await Promise.all([
    prisma.followUp.findMany({
      where: { customerId, status: "OPEN" },
      select: FOLLOW_UP_FIELDS,
      orderBy: { dueDate: "asc" },
      take: MAX_OPEN_FOLLOW_UPS,
    }),
    prisma.followUp.findMany({
      where: { customerId, status: "DONE" },
      select: FOLLOW_UP_FIELDS,
      orderBy: { dueDate: "desc" },
      take: MAX_DONE_FOLLOW_UPS,
    }),
  ]);

  const { interactions, _count, ...details } = customer;
  return { customer: details, interactions, interactionTotal: _count.interactions, openFollowUps, doneFollowUps };
}

/** Cut long text so one huge note cannot make the request expensive. */
export function shorten(text: string, max = MAX_TEXT_LENGTH): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

/** "not recorded" for empty values, so the AI never has to guess. */
function orNotRecorded(value: string | null): string {
  return value === null || value.trim() === "" ? "not recorded" : shorten(value);
}

/** Whole days from `from` to `to` (both "YYYY-MM-DD"). */
function daysBetween(from: string, to: string): number {
  return Math.round((plainDateToDate(to).getTime() - plainDateToDate(from).getTime()) / 86_400_000);
}

/** "due 2026-10-25 (OVERDUE by 4 days)" / "due 2026-10-29 (due TODAY)" / "due 2026-11-02". */
function dueText(dueDate: Date, today: string): string {
  const due = dateToPlainDate(dueDate);
  const late = daysBetween(due, today);
  if (late > 0) {
    return `due ${due} (OVERDUE by ${late} day${late === 1 ? "" : "s"})`;
  }
  return late === 0 ? `due ${due} (due TODAY)` : `due ${due}`;
}

function followUpLine(followUp: FactsFollowUp, when: string): string {
  const notes = followUp.notes ? ` Notes: ${shorten(followUp.notes)}` : "";
  return `- ${when}, ${followUp.priority} priority: ${shorten(followUp.title)}.${notes}`;
}

/** The facts as the plain text the AI reads. `today` is "YYYY-MM-DD" in India. */
export function customerFactsText(facts: CustomerFacts, today: string): string {
  const { customer } = facts;
  const lines = [
    `Today: ${today}`,
    "",
    "CUSTOMER",
    `Company: ${shorten(customer.companyName)}`,
    `Contact person: ${orNotRecorded(customer.contactName)}`,
    `Industry: ${orNotRecorded(customer.industry)}`,
    `Website: ${orNotRecorded(customer.website)}`,
    `Status: ${customer.status}`,
    `Customer notes: ${orNotRecorded(customer.notes)}`,
    "",
  ];

  const shown = facts.interactions.length;
  lines.push(
    shown < facts.interactionTotal
      ? `INTERACTIONS (newest first, latest ${shown} of ${facts.interactionTotal})`
      : "INTERACTIONS (newest first)",
  );
  if (shown === 0) {
    lines.push("- none recorded");
  }
  for (const interaction of facts.interactions) {
    lines.push(`- ${plainDateOfMoment(interaction.occurredAt)} ${interaction.type}: ${shorten(interaction.summary)}`);
  }

  lines.push("", "OPEN FOLLOW-UPS (soonest first)");
  if (facts.openFollowUps.length === 0) {
    lines.push("- none");
  }
  for (const followUp of facts.openFollowUps) {
    lines.push(followUpLine(followUp, dueText(followUp.dueDate, today)));
  }

  lines.push("", "RECENTLY COMPLETED FOLLOW-UPS");
  if (facts.doneFollowUps.length === 0) {
    lines.push("- none");
  }
  for (const followUp of facts.doneFollowUps) {
    lines.push(followUpLine(followUp, `was due ${dateToPlainDate(followUp.dueDate)}`));
  }

  return lines.join("\n");
}
