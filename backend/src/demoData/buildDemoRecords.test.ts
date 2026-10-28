// Tests for the demo data and buildDemoRecords.
//
// Why: the seed script writes straight to the database, skipping the HTTP
// routes and their validation. These tests run every demo record through the
// SAME validators the forms use, so demo data can never break the app's rules.
import { describe, expect, it } from "vitest";
import { validateCreateCustomer } from "../customers/customerValidation.js";
import { validateCreateFollowUp } from "../followUps/followUpValidation.js";
import { validateCreateInteraction } from "../interactions/interactionValidation.js";
import { dateToPlainDate } from "../shared/plainDate.js";
import { buildDemoRecords, indiaMoment } from "./buildDemoRecords.js";
import { DEMO_CUSTOMERS, DEMO_EMAIL_ENDING } from "./demoData.js";

const TODAY = "2026-10-27";
const records = buildDemoRecords(DEMO_CUSTOMERS, TODAY);
const allFollowUps = records.flatMap((record) => record.followUps);
const openDueDays = allFollowUps
  .filter((followUp) => followUp.status === "OPEN")
  .map((followUp) => dateToPlainDate(followUp.dueDate));

describe("indiaMoment", () => {
  it("gives the India time on the right day, stored as UTC", () => {
    // 10:30 in India is 05:00 UTC.
    expect(indiaMoment(TODAY, 1, "10:30").toISOString()).toBe(
      "2026-10-26T05:00:00.000Z",
    );
  });

  it("daysAgo 0 means today", () => {
    expect(indiaMoment(TODAY, 0, "09:00").toISOString()).toBe(
      "2026-10-27T03:30:00.000Z",
    );
  });

  it("goes back across a month end", () => {
    expect(indiaMoment("2026-11-01", 1, "12:00").toISOString()).toBe(
      "2026-10-31T06:30:00.000Z",
    );
  });
});

describe("buildDemoRecords", () => {
  // Protects the cleanup: demo customers are found by their email ending.
  it("gives every demo customer an email ending in .example", () => {
    for (const record of records) {
      expect(record.email.endsWith(DEMO_EMAIL_ENDING)).toBe(true);
    }
  });

  it("uses a different company name for every demo customer", () => {
    const names = records.map((record) => record.companyName);
    expect(new Set(names).size).toBe(names.length);
  });

  it("turns dueInDays into a plain due date counted from today", () => {
    // Sunrise's first follow-up is due today, Northstar's in 12 days.
    expect(dateToPlainDate(records[0].followUps[0].dueDate)).toBe(TODAY);
    const northstar = records.find((r) => r.companyName.startsWith("Northstar"));
    expect(dateToPlainDate(northstar!.followUps[0].dueDate)).toBe("2026-11-08");
  });

  // The demo should show every part of the dashboard and Follow-ups page.
  it("has overdue, due-today, upcoming and done follow-ups", () => {
    expect(openDueDays.some((day) => day < TODAY)).toBe(true);
    expect(openDueDays.some((day) => day === TODAY)).toBe(true);
    expect(openDueDays.some((day) => day > TODAY)).toBe(true);
    expect(allFollowUps.some((followUp) => followUp.status === "DONE")).toBe(true);
  });

  // The dashboard charts only cover the last 14 days (today and 13 days before).
  it("puts every customer and interaction inside the last 14 days", () => {
    const firstChartMoment = indiaMoment(TODAY, 13, "00:00");
    const endOfToday = indiaMoment(TODAY, -1, "00:00");
    for (const record of records) {
      expect(record.createdAt >= firstChartMoment).toBe(true);
      expect(record.createdAt < endOfToday).toBe(true);
      for (const interaction of record.interactions) {
        expect(interaction.occurredAt >= firstChartMoment).toBe(true);
        expect(interaction.occurredAt < endOfToday).toBe(true);
      }
    }
  });
});

describe("demo data passes the same checks as the forms", () => {
  // customerId 1 is a stand-in: the real id is only known after saving.
  const FAKE_CUSTOMER_ID = 1;

  it.each(records)("customer $companyName is valid", (record) => {
    const result = validateCreateCustomer({
      companyName: record.companyName,
      contactName: record.contactName,
      website: record.website,
      industry: record.industry,
      status: record.status,
      email: record.email,
      phone: record.phone,
      notes: record.notes,
    });
    expect(result).toMatchObject({ ok: true });
  });

  it("every interaction is valid", () => {
    for (const record of records) {
      for (const interaction of record.interactions) {
        const result = validateCreateInteraction({
          customerId: FAKE_CUSTOMER_ID,
          type: interaction.type,
          summary: interaction.summary,
          occurredAt: interaction.occurredAt.toISOString(),
        });
        expect(result).toMatchObject({ ok: true });
      }
    }
  });

  it("every follow-up is valid", () => {
    for (const followUp of allFollowUps) {
      const result = validateCreateFollowUp({
        customerId: FAKE_CUSTOMER_ID,
        title: followUp.title,
        dueDate: dateToPlainDate(followUp.dueDate),
        status: followUp.status,
        priority: followUp.priority,
        notes: followUp.notes,
      });
      expect(result).toMatchObject({ ok: true });
    }
  });
});
