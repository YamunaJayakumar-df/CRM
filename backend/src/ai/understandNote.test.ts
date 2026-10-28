// Tests for understandNote with a FAKE AI client: no network, no cost.
// The fake returns recorded real answers (fixtures/recordedAnswers.ts).
import { describe, expect, it, vi } from "vitest";
import type { AzureOpenAI } from "openai";
import { NO_CUSTOMER_ANSWER, RAVI_AND_MAYA_ANSWER, RAVI_AND_MAYA_NOTE, RECORDED_ON } from "./fixtures/recordedAnswers.js";
import { NOTE_UNDERSTANDING_FORMAT } from "./understandingSchema.js";
import { understandNote } from "./understandNote.js";

/** A fake client whose create() returns one message, like Azure would. */
function fakeClient(message: { content: string | null; refusal?: string | null }, usage = { prompt_tokens: 906, completion_tokens: 128 }) {
  const create = vi.fn().mockResolvedValue({ choices: [{ message: { refusal: null, ...message } }], usage });
  const client = { chat: { completions: { create } } } as unknown as AzureOpenAI;
  return { client, create };
}

describe("understandNote", () => {
  it("sends our instructions, the note and the form to the given deployment", async () => {
    const { client, create } = fakeClient({ content: RAVI_AND_MAYA_ANSWER });
    await understandNote(client, "reasoning-model", RAVI_AND_MAYA_NOTE, RECORDED_ON);

    const request = create.mock.calls[0]?.[0];
    expect(request.model).toBe("reasoning-model");
    expect(request.response_format).toBe(NOTE_UNDERSTANDING_FORMAT);
    expect(request.messages[0].role).toBe("system");
    expect(request.messages[0].content).toContain("Today is Wednesday, 2026-10-28");
    expect(request.messages[1]).toEqual({ role: "user", content: RAVI_AND_MAYA_NOTE });
  });

  it("returns the parsed answer and the tokens used", async () => {
    const { client } = fakeClient({ content: RAVI_AND_MAYA_ANSWER });
    const outcome = await understandNote(client, "m", RAVI_AND_MAYA_NOTE, RECORDED_ON);
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.understanding.customers.map((customer) => customer.companyName)).toEqual([
        "Sunrise Hospital",
        "Greenfield School",
      ]);
      expect(outcome.tokens).toEqual({ input: 906, output: 128 });
    }
  });

  it("returns an answer with no customers and the AI's questions", async () => {
    const { client } = fakeClient({ content: NO_CUSTOMER_ANSWER });
    const outcome = await understandNote(client, "m", "send proposal to them next week", RECORDED_ON);
    expect(outcome.ok && outcome.understanding.unclear).toEqual(["Which customer?", "Details of the proposal?"]);
  });

  it("reports a refusal", async () => {
    const { client } = fakeClient({ content: null, refusal: "I can't help with that." });
    expect(await understandNote(client, "m", "a note", RECORDED_ON)).toEqual({
      ok: false,
      problem: "refused",
      detail: "I can't help with that.",
    });
  });

  it("reports an answer that is not JSON", async () => {
    const { client } = fakeClient({ content: "Sure! Here is what I found:" });
    const outcome = await understandNote(client, "m", "a note", RECORDED_ON);
    expect(outcome.ok === false && outcome.problem).toBe("notJson");
  });

  it("reports JSON that does not match the form", async () => {
    const { client } = fakeClient({ content: JSON.stringify({ customers: "Sunrise" }) });
    const outcome = await understandNote(client, "m", "a note", RECORDED_ON);
    expect(outcome.ok === false && outcome.problem).toBe("wrongShape");
  });

  it("lets network or key errors reach the caller", async () => {
    const create = vi.fn().mockRejectedValue(new Error("connection failed"));
    const client = { chat: { completions: { create } } } as unknown as AzureOpenAI;
    await expect(understandNote(client, "m", "a note", RECORDED_ON)).rejects.toThrow("connection failed");
  });
});
