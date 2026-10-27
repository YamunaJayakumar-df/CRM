// Turns the demo records in demoData.ts into data the database can store,
// with real dates counted from `today`.
//
// Why a separate file: nothing here touches the database, so the date maths
// and the demo data can be unit-tested (see buildDemoRecords.test.ts).
import { addDays, plainDateToDate } from "../shared/plainDate.js";
import type {
  DemoCustomer,
  DemoFollowUp,
  DemoInteraction,
} from "./demoData.js";

// India's offset from UTC (no daylight saving time), same as in plainDate.ts.
const KOLKATA_UTC_OFFSET = "+05:30";

export type DemoInteractionRecord = {
  type: DemoInteraction["type"];
  summary: string;
  occurredAt: Date;
};

export type DemoFollowUpRecord = {
  title: string;
  dueDate: Date; // midnight UTC, as Prisma expects for a @db.Date column
  status: DemoFollowUp["status"];
  priority: DemoFollowUp["priority"];
  notes: string | null;
};

export type DemoCustomerRecord = {
  companyName: string;
  contactName: string;
  website: string;
  industry: string;
  status: DemoCustomer["status"];
  email: string;
  phone: string;
  notes: string;
  createdAt: Date;
  interactions: DemoInteractionRecord[];
  followUps: DemoFollowUpRecord[];
};

/**
 * The moment of `time` ("HH:MM", India time) on the day `daysAgo` days before `today`.
 * Example: indiaMoment("2026-10-27", 1, "10:30") -> 2026-10-26T05:00:00.000Z
 * (10:30 in India is 05:00 UTC).
 */
export function indiaMoment(today: string, daysAgo: number, time: string): Date {
  const day = addDays(today, -daysAgo);
  return new Date(`${day}T${time}:00${KOLKATA_UTC_OFFSET}`);
}

/** Build every demo customer, with its interactions and follow-ups, for `today` ("YYYY-MM-DD"). */
export function buildDemoRecords(
  customers: DemoCustomer[],
  today: string,
): DemoCustomerRecord[] {
  return customers.map((customer) => ({
    companyName: customer.companyName,
    contactName: customer.contactName,
    website: customer.website,
    industry: customer.industry,
    status: customer.status,
    email: customer.email,
    phone: customer.phone,
    notes: customer.notes,
    // 09:00 in India on the day the customer was "added".
    createdAt: indiaMoment(today, customer.addedDaysAgo, "09:00"),
    interactions: customer.interactions.map((interaction) => ({
      type: interaction.type,
      summary: interaction.summary,
      occurredAt: indiaMoment(today, interaction.daysAgo, interaction.time),
    })),
    followUps: customer.followUps.map((followUp) => ({
      title: followUp.title,
      dueDate: plainDateToDate(addDays(today, followUp.dueInDays)),
      status: followUp.status,
      priority: followUp.priority,
      notes: followUp.notes,
    })),
  }));
}
