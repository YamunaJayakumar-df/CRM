// Tests for the customer form's data helpers.
import { describe, expect, it } from "vitest";
import type { Customer } from "@/lib/api/types";
import {
  createCustomerBody,
  customerToFormValues,
  EMPTY_CUSTOMER_FORM_VALUES,
  initialCustomerFormState,
  readCustomerFormValues,
  updateCustomerBody,
} from "./customerForm";

const savedCustomer: Customer = {
  id: 7,
  companyName: "Acme Corp",
  contactName: null,
  website: "acme.com",
  industry: null,
  status: "INACTIVE",
  email: "ops@acme.com",
  phone: null,
  notes: "Line one\nLine two",
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-02T10:00:00.000Z",
};

describe("customerToFormValues", () => {
  it("copies the saved values and turns null into empty text", () => {
    expect(customerToFormValues(savedCustomer)).toEqual({
      companyName: "Acme Corp",
      contactName: "",
      email: "ops@acme.com",
      phone: "",
      website: "acme.com",
      industry: "",
      status: "INACTIVE",
      notes: "Line one\nLine two",
    });
  });
});

describe("readCustomerFormValues", () => {
  it("reads and trims the known fields", () => {
    const formData = new FormData();
    formData.set("companyName", "  Acme Corp ");
    formData.set("email", " ops@acme.com");
    formData.set("status", "INACTIVE");
    formData.set("notes", "  Line one\nLine two  ");

    expect(readCustomerFormValues(formData)).toEqual({
      ...EMPTY_CUSTOMER_FORM_VALUES,
      companyName: "Acme Corp",
      email: "ops@acme.com",
      status: "INACTIVE",
      notes: "Line one\nLine two",
    });
  });

  it("ignores unknown fields and treats missing fields as empty", () => {
    const formData = new FormData();
    formData.set("companyName", "Acme");
    formData.set("id", "999");
    formData.set("createdAt", "yesterday");

    const values = readCustomerFormValues(formData);
    expect(Object.keys(values).sort()).toEqual(
      ["companyName", "contactName", "email", "industry", "notes", "phone", "status", "website"],
    );
    expect(values.contactName).toBe("");
    expect(values.status).toBe("");
  });

  it("treats an uploaded file as empty text", () => {
    const formData = new FormData();
    formData.set("companyName", new Blob(["x"]), "logo.png");
    expect(readCustomerFormValues(formData).companyName).toBe("");
  });
});

describe("createCustomerBody", () => {
  it("sends every text field (empty ones as \"\") and no status", () => {
    const body = createCustomerBody({ ...EMPTY_CUSTOMER_FORM_VALUES, companyName: "Acme" });
    expect(body).toEqual({
      companyName: "Acme",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      industry: "",
      notes: "",
    });
    expect("status" in body).toBe(false);
  });
});

describe("updateCustomerBody", () => {
  it("sends every field including status, so emptied fields are cleared", () => {
    expect(
      updateCustomerBody({ ...customerToFormValues(savedCustomer), email: "" }),
    ).toEqual({
      companyName: "Acme Corp",
      contactName: "",
      email: "",
      phone: "",
      website: "acme.com",
      industry: "",
      notes: "Line one\nLine two",
      status: "INACTIVE",
    });
  });
});

describe("initialCustomerFormState", () => {
  it("starts with the given values and no errors", () => {
    expect(initialCustomerFormState(EMPTY_CUSTOMER_FORM_VALUES)).toEqual({
      values: EMPTY_CUSTOMER_FORM_VALUES,
      fieldErrors: {},
      formErrors: [],
    });
  });
});
