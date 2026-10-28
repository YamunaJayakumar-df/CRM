// Tests for the assistant's "ears" with a FAKE browser recognition class:
// no real browser, no microphone, no audio.
import { describe, expect, it, vi } from "vitest";
import {
  appendSpokenText,
  createBrowserSpeechToText,
  isSpeechSupported,
  SPEECH_LANGUAGE,
  speechErrorMessage,
} from "./speech";

/** A pretend browser SpeechRecognition that the test can "speak" into. */
class FakeRecognition {
  static last: FakeRecognition | null = null;
  lang = "";
  continuous = false;
  interimResults = false;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn(() => this.onend?.());
  constructor() {
    FakeRecognition.last = this;
  }
  /** Simulate the browser hearing words. */
  hear(resultIndex: number, results: { text: string; isFinal: boolean }[]) {
    this.onresult?.({
      resultIndex,
      results: results.map((result) => ({ isFinal: result.isFinal, 0: { transcript: result.text } })),
    });
  }
}

function handlers() {
  return { onFinal: vi.fn(), onInterim: vi.fn(), onError: vi.fn(), onEnd: vi.fn() };
}

describe("isSpeechSupported", () => {
  it("finds the standard and the webkit (Chrome/Edge) names", () => {
    expect(isSpeechSupported({ SpeechRecognition: FakeRecognition })).toBe(true);
    expect(isSpeechSupported({ webkitSpeechRecognition: FakeRecognition })).toBe(true);
  });

  it("is false in a browser without speech recognition (e.g. Firefox)", () => {
    expect(isSpeechSupported({})).toBe(false);
    expect(createBrowserSpeechToText({})).toBeNull();
  });
});

describe("createBrowserSpeechToText", () => {
  it("listens in Indian English, continuously, with live words", () => {
    createBrowserSpeechToText({ webkitSpeechRecognition: FakeRecognition })!.start(handlers());
    const recognition = FakeRecognition.last!;
    expect(recognition.lang).toBe(SPEECH_LANGUAGE);
    expect(SPEECH_LANGUAGE).toBe("en-IN");
    expect(recognition.continuous).toBe(true);
    expect(recognition.interimResults).toBe(true);
    expect(recognition.start).toHaveBeenCalled();
  });

  it("passes on final text and the words still being heard", () => {
    const on = handlers();
    createBrowserSpeechToText({ SpeechRecognition: FakeRecognition })!.start(on);
    FakeRecognition.last!.hear(0, [
      { text: " Met Vikram at Orchid Hotels ", isFinal: true },
      { text: "send him a", isFinal: false },
    ]);
    expect(on.onFinal).toHaveBeenCalledWith("Met Vikram at Orchid Hotels");
    expect(on.onInterim).toHaveBeenLastCalledWith("send him a");
  });

  it("only reads the results that are new since the last event", () => {
    const on = handlers();
    createBrowserSpeechToText({ SpeechRecognition: FakeRecognition })!.start(on);
    FakeRecognition.last!.hear(1, [
      { text: "already handled", isFinal: true },
      { text: "send him a quote", isFinal: true },
    ]);
    expect(on.onFinal).toHaveBeenCalledTimes(1);
    expect(on.onFinal).toHaveBeenCalledWith("send him a quote");
  });

  it("passes on errors and the end of listening", () => {
    const on = handlers();
    const ears = createBrowserSpeechToText({ SpeechRecognition: FakeRecognition })!;
    ears.start(on);
    FakeRecognition.last!.onerror?.({ error: "not-allowed" });
    expect(on.onError).toHaveBeenCalledWith("not-allowed");
    ears.stop();
    expect(on.onEnd).toHaveBeenCalled();
  });
});

describe("appendSpokenText", () => {
  it("fills an empty note", () => {
    expect(appendSpokenText("", "  Met Vikram ", 2000)).toBe("Met Vikram");
  });

  it("adds to typed text with one space", () => {
    expect(appendSpokenText("Met Vikram.  ", "Send a quote", 2000)).toBe("Met Vikram. Send a quote");
  });

  it("ignores empty speech", () => {
    expect(appendSpokenText("Met Vikram.", "   ", 2000)).toBe("Met Vikram.");
  });

  it("never goes over the note limit", () => {
    expect(appendSpokenText("abc", "defgh", 6)).toBe("abc de");
  });
});

describe("speechErrorMessage", () => {
  it("explains a blocked microphone", () => {
    expect(speechErrorMessage("not-allowed")).toMatch(/Microphone access was blocked/);
  });

  it("says nothing when the user stopped it", () => {
    expect(speechErrorMessage("aborted")).toBe("");
  });

  it("has a calm fallback for unknown codes", () => {
    expect(speechErrorMessage("something-new")).toMatch(/type the note instead/);
  });
});
