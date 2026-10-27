// Tests for sorting backend messages into field and form errors.
import { describe, expect, it } from "vitest";
import { splitFieldErrors } from "./fieldErrors";

const labels = {
  companyName: "Company name",
  email: "Email",
  phone: "Phone",
};

describe("splitFieldErrors", () => {
  it("puts each message under its field with a friendly label", () => {
    expect(
      splitFieldErrors(
        ["companyName is required", "email must be a valid email address"],
        labels,
      ),
    ).toEqual({
      fieldErrors: {
        companyName: "Company name is required",
        email: "Email must be a valid email address",
      },
      formErrors: [],
    });
  });

  it("keeps messages for unknown fields as form errors, unchanged", () => {
    expect(
      splitFieldErrors(["Unknown field: id", "Provide at least one field to update"], labels),
    ).toEqual({
      fieldErrors: {},
      formErrors: ["Unknown field: id", "Provide at least one field to update"],
    });
  });

  it("only matches the whole first word", () => {
    const result = splitFieldErrors(["emailAddress must be text", "phoneNumber is bad"], labels);
    expect(result.fieldErrors).toEqual({});
    expect(result.formErrors).toEqual(["emailAddress must be text", "phoneNumber is bad"]);
  });

  it("keeps the first message when a field has several", () => {
    const result = splitFieldErrors(
      ["phone must be at most 50 characters", "phone contains invalid characters"],
      labels,
    );
    expect(result.fieldErrors).toEqual({ phone: "Phone must be at most 50 characters" });
    expect(result.formErrors).toEqual([]);
  });

  it("returns nothing for an empty list", () => {
    expect(splitFieldErrors([], labels)).toEqual({ fieldErrors: {}, formErrors: [] });
  });
});
