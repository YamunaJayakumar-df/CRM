// Tests for the follow-up form's data helpers.
import { describe, expect, it } from "vitest";
import type { FollowUp } from "@/lib/api/types";
import {
  createFollowUpBody,
  dueDateError,
  EMPTY_FOLLOW_UP_FORM_VALUES,
  localFollowUpErrors,
  FOLLOW_UP_ERROR_FIELDS,
  FOLLOW_UP_FIELD_LABELS,
  followUpToFormValues,
  initialFollowUpFormState,
  readFollowUpFormValues,
  readFollowUpStatus,
  updateFollowUpBody,
} from "./followUpForm";

const savedFollowUp: FollowUp = {
  id: 7,
  customerId: 12,
  title: "Send renewal quote",
  dueDate: "2026-10-30",
  status: "OPEN",
  priority: "HIGH",
  notes: null,
  createdAt: "2026-10-26T10:30:00.000Z",
  updatedAt: "2026-10-26T10:30:00.000Z",
  customer: { id: 12, companyName: "Acme Corp", website: null, status: "ACTIVE" },
};

describe("FOLLOW_UP_ERROR_FIELDS / labels", () => {
  it("lists the backend field names in form order", () => {
    expect(FOLLOW_UP_ERROR_FIELDS).toEqual([
      "customerId",
      "title",
      "dueDate",
      "priority",
      "status",
      "notes",
    ]);
  });

  it("has a friendly label for the due date", () => {
    expect(FOLLOW_UP_FIELD_LABELS.dueDate).toBe("Due date");
  });
});

describe("initialFollowUpFormState", () => {
  it("starts with the values and no errors", () => {
    expect(initialFollowUpFormState(EMPTY_FOLLOW_UP_FORM_VALUES)).toEqual({
      values: EMPTY_FOLLOW_UP_FORM_VALUES,
      fieldErrors: {},
      formErrors: [],
    });
  });

  it("new forms start Open with Medium priority", () => {
    expect(EMPTY_FOLLOW_UP_FORM_VALUES.status).toBe("OPEN");
    expect(EMPTY_FOLLOW_UP_FORM_VALUES.priority).toBe("MEDIUM");
  });
});

describe("readFollowUpStatus", () => {
  it("accepts OPEN and DONE exactly", () => {
    expect(readFollowUpStatus("OPEN")).toBe("OPEN");
    expect(readFollowUpStatus("DONE")).toBe("DONE");
  });

  it("gives null for anything else", () => {
    expect(readFollowUpStatus("done")).toBeNull();
    expect(readFollowUpStatus("CLOSED")).toBeNull();
    expect(readFollowUpStatus(null)).toBeNull();
  });
});

describe("followUpToFormValues", () => {
  it("fills the form, turning no notes into empty text", () => {
    expect(followUpToFormValues(savedFollowUp)).toEqual({
      customerId: "12",
      title: "Send renewal quote",
      dueDate: "2026-10-30",
      priority: "HIGH",
      status: "OPEN",
      notes: "",
    });
  });
});

describe("readFollowUpFormValues", () => {
  it("reads and trims the known fields, keeping inner line breaks", () => {
    const formData = new FormData();
    formData.set("customerId", " 12 ");
    formData.set("title", "  Call back  ");
    formData.set("dueDate", "2026-10-30");
    formData.set("priority", "LOW");
    formData.set("status", "DONE");
    formData.set("notes", " Line one\nLine two ");

    expect(readFollowUpFormValues(formData)).toEqual({
      customerId: "12",
      title: "Call back",
      dueDate: "2026-10-30",
      priority: "LOW",
      status: "DONE",
      notes: "Line one\nLine two",
    });
  });

  it("ignores unknown fields and turns missing ones or files into empty text", () => {
    const formData = new FormData();
    formData.set("id", "99");
    formData.set("title", new File(["x"], "x.txt"));

    const values = readFollowUpFormValues(formData);
    expect(values).not.toHaveProperty("id");
    expect(values.title).toBe("");
    expect(values.dueDate).toBe("");
    expect(values.notes).toBe("");
  });
});

describe("dueDateError", () => {
  it("accepts a real date", () => {
    expect(dueDateError("2026-10-30")).toBeNull();
    expect(dueDateError("2000-01-01")).toBeNull();
    expect(dueDateError("2100-12-31")).toBeNull();
  });

  it("asks for a date when empty", () => {
    expect(dueDateError("")).toBe("Due date is required");
  });

  it("rejects text that is not a real day", () => {
    expect(dueDateError("2026-02-31")).toBe("Enter a real date, like 2026-10-30");
    expect(dueDateError("30/10/2026")).toBe("Enter a real date, like 2026-10-30");
  });

  it("rejects years the backend does not allow", () => {
    expect(dueDateError("1999-12-31")).toBe("Choose a date between 2000 and 2100");
    expect(dueDateError("2101-01-01")).toBe("Choose a date between 2000 and 2100");
  });
});

describe("createFollowUpBody", () => {
  it("sends the customer as a number, without a status", () => {
    expect(
      createFollowUpBody({
        customerId: "12",
        title: "Call back",
        dueDate: "2026-10-30",
        priority: "HIGH",
        status: "DONE",
        notes: "",
      }),
    ).toEqual({
      customerId: 12,
      title: "Call back",
      dueDate: "2026-10-30",
      priority: "HIGH",
      notes: "",
    });
  });

  it("leaves out an invalid customer and an unchosen priority", () => {
    const body = createFollowUpBody({
      ...EMPTY_FOLLOW_UP_FORM_VALUES,
      customerId: "abc",
      priority: "",
    });
    expect(body.customerId).toBeUndefined();
    expect(body.priority).toBeUndefined();
  });
});

describe("updateFollowUpBody", () => {
  it("never sends a customer, and sends empty notes so they are cleared", () => {
    const body = updateFollowUpBody({
      customerId: "12",
      title: "Call back",
      dueDate: "2026-10-30",
      priority: "LOW",
      status: "DONE",
      notes: "",
    });
    expect(body).toEqual({
      title: "Call back",
      dueDate: "2026-10-30",
      priority: "LOW",
      status: "DONE",
      notes: "",
    });
    expect(body).not.toHaveProperty("customerId");
  });

  it("leaves out an unchosen priority and status", () => {
    const body = updateFollowUpBody({ ...EMPTY_FOLLOW_UP_FORM_VALUES, priority: "", status: "" });
    expect(body.priority).toBeUndefined();
    expect(body.status).toBeUndefined();
  });
});

describe("localFollowUpErrors", () => {
  // Protects that every obvious problem is shown at once, not one per save.
  it("reports customer, title and due date together on create", () => {
    const values = { ...EMPTY_FOLLOW_UP_FORM_VALUES, customerId: "", title: "", dueDate: "" };

    expect(localFollowUpErrors(values, true)).toEqual({
      customerId: "Customer is required",
      title: "Title is required",
      dueDate: "Due date is required",
    });
  });

  // Protects that the customer is not checked on edit (it cannot change there).
  it("does not check the customer on edit", () => {
    const values = { ...EMPTY_FOLLOW_UP_FORM_VALUES, customerId: "", title: "Call", dueDate: "2026-10-30" };

    expect(localFollowUpErrors(values, false)).toEqual({});
  });

  // Protects that a fully filled form passes.
  it("returns no errors for a valid form", () => {
    const values = { ...EMPTY_FOLLOW_UP_FORM_VALUES, customerId: "4", title: "Call", dueDate: "2026-10-30" };

    expect(localFollowUpErrors(values, true)).toEqual({});
  });
});