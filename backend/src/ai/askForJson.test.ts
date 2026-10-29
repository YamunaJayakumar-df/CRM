// Tests for askForJson with a FAKE AI client: no network, no cost.
// (understandNote.test.ts also covers it through the note job.)
import { describe, expect, it, vi } from "vitest";
import type { AzureOpenAI } from "openai";
import type { ResponseFormatJSONSchema } from "openai/resources/shared";
import { askForJson } from "./askForJson.js";

type Greeting = { text: string };

const GREETING_FORMAT: ResponseFormatJSONSchema = {
  type: "json_schema",
  json_schema: { name: "greeting", strict: true, schema: { type: "object" } },
};

function isGreeting(value: unknown): value is Greeting {
  return typeof value === "object" && value !== null && typeof (value as Record<string, unknown>).text === "string";
}

function fakeClient(content: string | null, refusal: string | null = null) {
  const create = vi.fn().mockResolvedValue({
    choices: [{ message: { content, refusal } }],
    usage: { prompt_tokens: 50, completion_tokens: 5 },
  });
  return { client: { chat: { completions: { create } } } as unknown as AzureOpenAI, create };
}

const request = {
  deployment: "model-a",
  instructions: "Say hello.",
  userText: "Hi there",
  format: GREETING_FORMAT,
  hasShape: isGreeting,
};

describe("askForJson", () => {
  it("sends the instructions, the user text and the form", async () => {
    const { client, create } = fakeClient('{"text":"Hello"}');
    await askForJson(client, request);
    expect(create.mock.calls[0]?.[0]).toEqual({
      model: "model-a",
      messages: [
        { role: "system", content: "Say hello." },
        { role: "user", content: "Hi there" },
      ],
      response_format: GREETING_FORMAT,
    });
  });

  it("returns the parsed answer and the tokens used", async () => {
    const { client } = fakeClient('{"text":"Hello"}');
    expect(await askForJson(client, request)).toEqual({
      ok: true,
      answer: { text: "Hello" },
      tokens: { input: 50, output: 5 },
    });
  });

  it("uses the job's own shape check", async () => {
    const { client } = fakeClient('{"words":"Hello"}');
    const outcome = await askForJson(client, request);
    expect(outcome.ok === false && outcome.problem).toBe("wrongShape");
  });

  it("reports a refusal and an answer that is not JSON", async () => {
    const refused = await askForJson(fakeClient(null, "No.").client, request);
    expect(refused).toEqual({ ok: false, problem: "refused", detail: "No." });
    const notJson = await askForJson(fakeClient("Hello!").client, request);
    expect(notJson.ok === false && notJson.problem).toBe("notJson");
  });
});
