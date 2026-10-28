// Tests for POST /ai/understand through the real Express app (supertest).
//
// Nothing real is called, so the tests are free and fast:
//   - the AI is fake: understandNote returns recorded real answers;
//   - the database is fake: only customer.findMany exists (the route must not write);
//   - the Azure settings are fake.
// The clock is frozen at the day the answers were recorded, so their dates
// never "become the past" in later test runs.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../db.js";
import { readAzureConfig } from "./azureConfig.js";
import { NO_CUSTOMER_ANSWER, RAVI_AND_MAYA_ANSWER, RAVI_AND_MAYA_NOTE } from "./fixtures/recordedAnswers.js";
import type { NoteUnderstanding } from "./understandingSchema.js";
import { saveConfirmedReview } from "./saveReview.js";
import { understandNote } from "./understandNote.js";

vi.mock("../db.js", () => ({
  prisma: { customer: { findMany: vi.fn() } },
}));
vi.mock("./understandNote.js", () => ({ understandNote: vi.fn() }));
vi.mock("./azureConfig.js", () => ({ readAzureConfig: vi.fn() }));
vi.mock("./saveReview.js", () => ({ saveConfirmedReview: vi.fn() }));

const findMany = vi.mocked(prisma.customer.findMany);
const fakeUnderstand = vi.mocked(understandNote);
const fakeConfig = vi.mocked(readAzureConfig);
const fakeSave = vi.mocked(saveConfirmedReview);

// What crypto.randomUUID() makes, e.g. "a3f9c2e1-5b7d-4c8e-9f1a-2b3c4d5e6f70".
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const FAKE_CONFIG = {
  endpoint: "https://example.openai.azure.com/",
  apiKey: "test-key-not-real",
  apiVersion: "2024-10-21",
  reasoningDeployment: "reasoning-model",
  routingDeployment: "routing-model",
};

// Customer rows as findCustomerCandidates selects them.
const SUNRISE = { id: 34, companyName: "Sunrise Multispeciality Hospital", contactName: "Priya Raman", website: "sunrisehospital.example" };
const GREENFIELD_PUBLIC = { id: 35, companyName: "Greenfield Public School", contactName: "Arjun Mehta", website: "greenfieldschool.example" };
const GREENFIELD_INTERNATIONAL = { id: 40, companyName: "Greenfield International School", contactName: null, website: null };
const ORCHID = { id: 39, companyName: "Orchid Hotels & Resorts", contactName: "Vikram Singh", website: "orchidhotels.example" };

/** Make the fake AI answer with this (already parsed) understanding. */
function aiAnswers(understanding: NoteUnderstanding) {
  fakeUnderstand.mockResolvedValue({ ok: true, understanding, tokens: { input: 906, output: 128 } });
}

function postNote(note: unknown) {
  return request(createApp()).post("/ai/understand").send({ note });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-28T10:00:00+05:30"));
  findMany.mockReset();
  fakeUnderstand.mockReset();
  fakeConfig.mockReset();
  fakeSave.mockReset();
  fakeConfig.mockReturnValue(FAKE_CONFIG);
  // The route logs problems and token counts; keep the test output clean.
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("POST /ai/understand: bad notes never reach the AI", () => {
  it.each([
    ["missing", undefined, "The note must be text."],
    ["not text", 42, "The note must be text."],
    ["blank", "   ", "The note is empty."],
    ["too short", "hi", "The note is too short. Write at least 5 characters."],
  ])("rejects a %s note with 400", async (_label, note, message) => {
    const res = await postNote(note);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid request", details: [message] });
    expect(fakeUnderstand).not.toHaveBeenCalled();
  });

  it("rejects a body that is not an object", async () => {
    const res = await request(createApp()).post("/ai/understand").send(["a list"]);
    expect(res.status).toBe(400);
    expect(fakeUnderstand).not.toHaveBeenCalled();
  });
});

describe("POST /ai/understand: AI problems", () => {
  it("answers 503 when the AI settings are missing, without calling the AI", async () => {
    fakeConfig.mockImplementation(() => {
      throw new Error("AZURE_OPENAI_API_KEY is missing");
    });
    const res = await postNote(RAVI_AND_MAYA_NOTE);
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: "The AI assistant is not set up." });
    expect(fakeUnderstand).not.toHaveBeenCalled();
  });

  it("answers 502 when Azure cannot be reached, without showing the real reason", async () => {
    fakeUnderstand.mockRejectedValue(new Error("secret internal detail"));
    const res = await postNote(RAVI_AND_MAYA_NOTE);
    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: "The AI is not available right now. Please try again." });
    expect(JSON.stringify(res.body)).not.toContain("secret internal detail");
  });

  it("answers 502 when the AI's answer is unusable", async () => {
    fakeUnderstand.mockResolvedValue({ ok: false, problem: "notJson", detail: "The answer was not valid JSON." });
    const res = await postNote(RAVI_AND_MAYA_NOTE);
    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: "The AI could not read this note. Please write it differently." });
  });
});

describe("POST /ai/understand: the review plan", () => {
  it("plans each customer of the recorded real answer separately", async () => {
    aiAnswers(JSON.parse(RAVI_AND_MAYA_ANSWER));
    findMany
      .mockResolvedValueOnce([SUNRISE] as never) // search for "Sunrise Hospital"
      .mockResolvedValueOnce([GREENFIELD_INTERNATIONAL, GREENFIELD_PUBLIC] as never); // "Greenfield School"

    const res = await postNote(RAVI_AND_MAYA_NOTE);

    expect(res.status).toBe(200);
    expect(fakeUnderstand).toHaveBeenCalledWith(expect.anything(), "reasoning-model", RAVI_AND_MAYA_NOTE, "2026-10-28");
    const [sunrise, greenfield] = res.body.customers;
    // Sunrise: only a partial match (allWords), so the user chooses.
    expect(sunrise.decision.kind).toBe("choose");
    expect(sunrise.decision.choices.options[0].id).toBe(34);
    expect(sunrise.understood.followUps).toEqual([{ title: "Call Ravi", dueDate: "2026-10-30", priority: "MEDIUM" }]);
    expect(sunrise.understood.interaction.typeWasGuessed).toBe(true);
    // Greenfield: two schools, both offered; its follow-up stays with it.
    expect(greenfield.decision.kind).toBe("choose");
    expect(greenfield.decision.choices.options).toHaveLength(2);
    expect(greenfield.understood.followUps[0].title).toBe("Send quote to Maya");
    expect(res.body.questions).toEqual([]);
  });

  it("pre-selects an exact unique match and asks about a past date", async () => {
    aiAnswers({
      customers: [
        {
          companyName: "Orchid Hotels and Resorts",
          contactName: "Vikram",
          phone: null,
          email: null,
          interaction: { type: "MEETING", summary: "Met Vikram.", typeWasGuessed: false },
          followUps: [{ title: "Send quote", dueDate: "2026-10-20", priority: "HIGH" }],
        },
      ],
      unclear: [],
    });
    findMany.mockResolvedValueOnce([ORCHID] as never);

    const res = await postNote("Met Vikram at Orchid Hotels and Resorts, send quote");

    expect(res.status).toBe(200);
    expect(res.body.customers[0].decision.kind).toBe("preselected");
    expect(res.body.customers[0].decision.selected.id).toBe(39);
    expect(res.body.questions).toEqual([
      'Follow-up "Send quote" for Orchid Hotels and Resorts: the due date 2026-10-20 is in the past. Please pick a date.',
    ]);
  });

  it("offers to create a customer that is not in the CRM", async () => {
    aiAnswers({
      customers: [{ companyName: "Nova Tech", contactName: "Kiran", phone: null, email: null, interaction: null, followUps: [] }],
      unclear: [],
    });
    findMany.mockResolvedValueOnce([] as never);

    const res = await postNote("Kiran from Nova Tech wants a demo");

    expect(res.body.customers[0].decision).toEqual({
      kind: "createNew",
      choices: { options: [], createNew: { companyName: "Nova Tech", contactName: "Kiran" }, moreMatches: false },
    });
  });

  it("returns only the AI's questions when no customer is named, without searching", async () => {
    aiAnswers(JSON.parse(NO_CUSTOMER_ANSWER));
    const res = await postNote("send proposal to them next week");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      reviewId: expect.stringMatching(UUID_PATTERN),
      customers: [],
      questions: ["Which customer?", "Details of the proposal?"],
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  it("asks one combined list of questions, without repeats", async () => {
    aiAnswers({
      customers: [
        {
          companyName: "",
          contactName: "Ravi",
          phone: null,
          email: null,
          interaction: null,
          followUps: [{ title: "Call Ravi", dueDate: null, priority: "MEDIUM" }],
        },
      ],
      unclear: ["Which company is Ravi from?"],
    });
    findMany.mockResolvedValueOnce([] as never);

    const res = await postNote("call Ravi sometime");

    expect(res.body.customers[0].decision.kind).toBe("needInfo");
    expect(res.body.questions).toEqual([
      "Which company is Ravi from?",
      'Follow-up "Call Ravi" for the unnamed customer: when is it due?',
    ]);
  });
});

describe("POST /ai/understand: the ticket number", () => {
  it("gives every review a new reviewId", async () => {
    aiAnswers(JSON.parse(NO_CUSTOMER_ANSWER));
    const first = await postNote("send proposal to them next week");
    const second = await postNote("send proposal to them next week");
    expect(first.body.reviewId).toMatch(UUID_PATTERN);
    expect(second.body.reviewId).not.toBe(first.body.reviewId);
  });
});

describe("POST /ai/save", () => {
  const REVIEW_ID = "a3f9c2e1-5b7d-4c8e-9f1a-2b3c4d5e6f70";
  const CONFIRMED = {
    reviewId: REVIEW_ID,
    customers: [
      {
        customer: { existingId: 39 },
        interaction: { type: "MEETING", summary: "Met Vikram." },
        followUps: [{ title: "Send quote", dueDate: "2026-11-02", priority: "HIGH" }],
      },
    ],
  };
  const RESULT = { items: [{ customerId: 39, customerCreated: false, interactionId: 500, followUpIds: [501] }] };

  function postSave(body: unknown) {
    return request(createApp()).post("/ai/save").send(body as object);
  }

  it("saves a confirmed review and answers 201 with what was created", async () => {
    fakeSave.mockResolvedValue({ kind: "saved", result: RESULT });
    const res = await postSave(CONFIRMED);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ alreadySaved: false, ...RESULT });
    // The save gets CLEAN data (a real Date), never the raw browser body.
    expect(fakeSave).toHaveBeenCalledWith({
      reviewId: REVIEW_ID,
      items: [
        {
          customer: { kind: "existing", id: 39 },
          interaction: { type: "MEETING", summary: "Met Vikram." },
          followUps: [{ title: "Send quote", dueDate: new Date("2026-11-02T00:00:00.000Z"), priority: "HIGH" }],
        },
      ],
    });
  });

  // Spec scenario 10, seen from the browser: the second click gets 200, not a second save.
  it("answers 200 'already saved' for a review that was saved before", async () => {
    fakeSave.mockResolvedValue({ kind: "alreadySaved", result: RESULT });
    const res = await postSave(CONFIRMED);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ alreadySaved: true, ...RESULT });
  });

  // Spec scenario 9: nothing is saved while a customer is unresolved.
  it("refuses an unresolved customer without trying to save", async () => {
    const res = await postSave({ ...CONFIRMED, customers: [{ ...CONFIRMED.customers[0], customer: null }] });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid request", details: ["Customer 1: choose a customer or create a new one"] });
    expect(fakeSave).not.toHaveBeenCalled();
  });

  // Spec scenario 8: a chosen customer that does not exist.
  it("answers 400 when a chosen customer does not exist", async () => {
    fakeSave.mockResolvedValue({ kind: "unknownCustomers", ids: [999] });
    const res = await postSave({ ...CONFIRMED, customers: [{ ...CONFIRMED.customers[0], customer: { existingId: 999 } }] });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid request", details: ["Customer #999 does not exist"] });
  });

  it("never calls the AI", async () => {
    fakeSave.mockResolvedValue({ kind: "saved", result: RESULT });
    await postSave(CONFIRMED);
    expect(fakeUnderstand).not.toHaveBeenCalled();
  });
});
