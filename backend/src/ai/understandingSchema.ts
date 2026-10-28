// The "form" the AI must fill in for every note (structured output).
//
// We send this JSON Schema with the request, and Azure FORCES the answer to
// match it: every field present, nothing extra, and only allowed values
// (e.g. type can only be CALL, EMAIL, MEETING or NOTE).
//
// Azure's strict mode has rules (checked in understandingSchema.test.ts):
//   - every object lists ALL its fields in `required`,
//   - every object has `additionalProperties: false`,
//   - an optional value is written as "string or null", not left out.
//
// The `description` texts are read by the AI too, so they act as small
// instructions for each field.
import type { ResponseFormatJSONSchema } from "openai/resources/shared";
import { FOLLOW_UP_PRIORITIES, type FollowUpPriorityName } from "../followUps/followUpValidation.js";
import { INTERACTION_TYPES, type InteractionTypeName } from "../interactions/interactionValidation.js";

// ---- The TypeScript shape of the AI's answer (must match the schema below) ----

export type UnderstoodInteraction = {
  type: InteractionTypeName;
  summary: string;
  typeWasGuessed: boolean;
};

export type UnderstoodFollowUp = {
  title: string;
  dueDate: string | null;
  priority: FollowUpPriorityName;
};

export type UnderstoodCustomer = {
  companyName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  interaction: UnderstoodInteraction | null;
  followUps: UnderstoodFollowUp[];
};

export type NoteUnderstanding = {
  customers: UnderstoodCustomer[];
  unclear: string[];
};

// ---- The JSON Schema sent to Azure ----

const NULLABLE_TEXT = { type: ["string", "null"] };

const INTERACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["type", "summary", "typeWasGuessed"],
  properties: {
    type: { type: "string", enum: [...INTERACTION_TYPES] },
    summary: { type: "string", description: "One short sentence about what was discussed." },
    typeWasGuessed: {
      type: "boolean",
      description: "true if the note does not clearly say how the contact happened (e.g. 'talked to').",
    },
  },
};

const FOLLOW_UP_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "dueDate", "priority"],
  properties: {
    title: { type: "string", description: "Starts with a verb, e.g. 'Send quote for 20 laptops'." },
    dueDate: { ...NULLABLE_TEXT, description: "YYYY-MM-DD, or null if the note gives no date." },
    priority: { type: "string", enum: [...FOLLOW_UP_PRIORITIES] },
  },
};

const CUSTOMER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["companyName", "contactName", "phone", "email", "interaction", "followUps"],
  properties: {
    companyName: { type: "string", description: "The company name exactly as written in the note." },
    contactName: { ...NULLABLE_TEXT, description: "The person at the company, or null." },
    phone: { ...NULLABLE_TEXT, description: "Only if the note gives it, else null." },
    email: { ...NULLABLE_TEXT, description: "Only if the note gives it, else null." },
    interaction: {
      description: "Contact that ALREADY happened, or null if the note only plans work.",
      anyOf: [INTERACTION_SCHEMA, { type: "null" }],
    },
    followUps: { type: "array", items: FOLLOW_UP_SCHEMA },
  },
};

export const NOTE_UNDERSTANDING_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["customers", "unclear"],
  properties: {
    customers: {
      type: "array",
      description: "One entry per customer named in the note. Empty if no customer is named.",
      items: CUSTOMER_SCHEMA,
    },
    unclear: {
      type: "array",
      description: "Short questions for the user about missing or unclear things. Empty if none.",
      items: { type: "string" },
    },
  },
};

/** Pass this as `response_format` in chat.completions.create. */
export const NOTE_UNDERSTANDING_FORMAT: ResponseFormatJSONSchema = {
  type: "json_schema",
  json_schema: {
    name: "note_understanding",
    strict: true,
    schema: NOTE_UNDERSTANDING_SCHEMA,
  },
};
