// Tests for the interaction form's data helpers.
import { describe, expect, it } from "vitest";
import type { Interaction } from "@/lib/api/types";
import {
  createInteractionBody,
  EMPTY_INTERACTION_FORM_VALUES,
  initialInteractionFormState,
  INTERACTION_ERROR_FIELDS,
  interactionToFormValues,
  kolkataInputsToIso,
  readInteractionFormValues,
  readInteractionType,
  updateInteractionBody,
} from "./interactionForm";

const savedInteraction: Interaction = {
  id: 5,
  customerId: 12,
  type: "MEETING",
  summary: "Quarterly review\nDiscussed renewal",
  // 10:30 UTC = 16:00 in India.
  occurredAt: "2026-10-26T10:30:00.000Z",
  createdAt: "2026-10-26T10:30:00.000Z",
  updatedAt: "2026-10-26T10:30:00.000Z",
  customer: { id: 12, companyName: "Acme Corp", website: null, status: "ACTIVE" },
};

describe("INTERACTION_ERROR_FIELDS", () => {
  it("lists the backend field names in form order", () => {
    expect(INTERACTION_ERROR_FIELDS).toEqual(["customerId", "type", "summary", "occurredAt"]);
  });
});

describe("readInteractionType", () => {
  it("accepts the four types exactly", () => {
    expect(readInteractionType("CALL")).toBe("CALL");
    expect(readInteractionType("NOTE")).toBe("NOTE");
  });

  it("gives null for anything else", () => {
    expect(readInteractionType("call")).toBeNull();
    expect(readInteractionType("FAX")).toBeNull();
    expect(readInteractionType(undefined)).toBeNull();
  });
});

describe("interactionToFormValues", () => {
  it("fills the form with India's date and time", () => {
    expect(interactionToFormValues(savedInteraction)).toEqual({
      customerId: "12",
      type: "MEETING",
      summary: "Quarterly review\nDiscussed renewal",
      date: "2026-10-26",
      time: "16:00",
    });
  });
});

describe("readInteractionFormValues", () => {
  it("reads and trims the known fields, keeping inner line breaks", () => {
    const formData = new FormData();
    formData.set("customerId", " 12 ");
    formData.set("type", "CALL");
    formData.set("summary", "  Called Raj\nAll good  ");
    formData.set("date", "2026-10-26");
    formData.set("time", "16:00");

    expect(readInteractionFormValues(formData)).toEqual({
      customerId: "12",
      type: "CALL",
      summary: "Called Raj\nAll good",
      date: "2026-10-26",
      time: "16:00",
    });
  });

  it("ignores unknown fields and treats missing or file fields as empty", () => {
    const formData = new FormData();
    formData.set("id", "999");
    formData.set("occurredAt", "yesterday");
    formData.set("summary", new Blob(["x"]), "notes.txt");

    expect(readInteractionFormValues(formData)).toEqual(EMPTY_INTERACTION_FORM_VALUES);
  });
});

describe("kolkataInputsToIso", () => {
  it("adds India's +05:30 offset", () => {
    expect(kolkataInputsToIso("2026-10-26", "16:00")).toEqual({
      ok: true,
      occurredAt: "2026-10-26T16:00:00+05:30",
    });
  });

  it("gives no value when both are empty", () => {
    expect(kolkataInputsToIso("", "")).toEqual({ ok: true, occurredAt: undefined });
  });

  it("asks for both when only one is filled", () => {
    const message = "Fill in both the date and the time, or leave both empty";
    expect(kolkataInputsToIso("2026-10-26", "")).toEqual({ ok: false, error: message });
    expect(kolkataInputsToIso("", "16:00")).toEqual({ ok: false, error: message });
  });

  it("rejects dates and times that are not real", () => {
    expect(kolkataInputsToIso("2026-02-31", "16:00").ok).toBe(false);
    expect(kolkataInputsToIso("26/10/2026", "16:00").ok).toBe(false);
    expect(kolkataInputsToIso("2026-10-26", "24:00").ok).toBe(false);
    expect(kolkataInputsToIso("2026-10-26", "4pm").ok).toBe(false);
  });
});

describe("createInteractionBody", () => {
  it("sends the customer as a number, the type, summary and time", () => {
    const values = { ...EMPTY_INTERACTION_FORM_VALUES, customerId: "12", type: "NOTE", summary: "Hi" };
    expect(createInteractionBody(values, "2026-10-26T16:00:00+05:30")).toEqual({
      customerId: 12,
      type: "NOTE",
      summary: "Hi",
      occurredAt: "2026-10-26T16:00:00+05:30",
    });
  });

  it("leaves out an empty or invalid customer, an empty type and no time", () => {
    const body = createInteractionBody(
      { ...EMPTY_INTERACTION_FORM_VALUES, customerId: "abc", summary: "Hi" },
      undefined,
    );
    expect(JSON.parse(JSON.stringify(body))).toEqual({ summary: "Hi" });
  });
});

describe("updateInteractionBody", () => {
  it("never sends a customerId", () => {
    const body = updateInteractionBody(interactionToFormValues(savedInteraction), undefined);
    expect("customerId" in body).toBe(false);
    expect(JSON.parse(JSON.stringify(body))).toEqual({
      type: "MEETING",
      summary: "Quarterly review\nDiscussed renewal",
    });
  });

  it("sends a new date and time when given", () => {
    const body = updateInteractionBody(
      interactionToFormValues(savedInteraction),
      "2026-10-27T09:15:00+05:30",
    );
    expect(body.occurredAt).toBe("2026-10-27T09:15:00+05:30");
  });
});

describe("initialInteractionFormState", () => {
  it("starts with the given values and no errors", () => {
    expect(initialInteractionFormState(EMPTY_INTERACTION_FORM_VALUES)).toEqual({
      values: EMPTY_INTERACTION_FORM_VALUES,
      fieldErrors: {},
      formErrors: [],
    });
  });
});
