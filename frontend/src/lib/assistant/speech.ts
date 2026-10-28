// The assistant's "ears": speech -> text, behind a small interface.
//
// Today the ears are the browser's built-in speech recognition (Chrome and
// Edge; Firefox has none). The audio is turned into text by the browser's
// own service (Google for Chrome, Microsoft for Edge), NOT by our CRM, and
// the CRM never stores audio. To use another service later (e.g. Sarvam),
// write another function that returns a SpeechToText; MicButton does not
// need to change.

/** What the mic button needs from any speech-to-text service. */
export type SpeechToText = {
  /**
   * Start listening. `onFinal` gets each finished piece of text, `onInterim`
   * the words heard so far (they may still change), `onError` a reason code,
   * and `onEnd` is called when listening stops for any reason.
   */
  start(handlers: {
    onFinal: (text: string) => void;
    onInterim: (text: string) => void;
    onError: (code: string) => void;
    onEnd: () => void;
  }): void;
  stop(): void;
};

// ---- The small part of the browser's Web Speech API that we use ----
// (TypeScript's built-in types do not include it, so we describe it here.)

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };

type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };

type BrowserRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

type RecognitionConstructor = new () => BrowserRecognition;

/** The parts of `window` we look at (a plain object in tests). */
export type SpeechWindow = {
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
};

/** Indian English: understands Indian names and accents better than "en-US". */
export const SPEECH_LANGUAGE = "en-IN";

/** The browser's recognition class, or null when the browser has none. */
function findRecognition(win: SpeechWindow): RecognitionConstructor | null {
  const found = win.SpeechRecognition ?? win.webkitSpeechRecognition;
  return typeof found === "function" ? (found as RecognitionConstructor) : null;
}

/** True when this browser can turn speech into text. */
export function isSpeechSupported(win: SpeechWindow): boolean {
  return findRecognition(win) !== null;
}

/** The browser's speech-to-text as a SpeechToText, or null when unsupported. */
export function createBrowserSpeechToText(win: SpeechWindow): SpeechToText | null {
  const Recognition = findRecognition(win);
  if (Recognition === null) {
    return null;
  }
  let recognition: BrowserRecognition | null = null;

  return {
    start({ onFinal, onInterim, onError, onEnd }) {
      recognition = new Recognition();
      recognition.lang = SPEECH_LANGUAGE;
      recognition.continuous = true; // keep listening through short pauses
      recognition.interimResults = true; // show words while the person speaks
      recognition.onresult = (event) => {
        let interim = "";
        // Only the results that are new since the last event.
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result === undefined) continue;
          if (result.isFinal) {
            onFinal(result[0].transcript.trim());
          } else {
            interim += result[0].transcript;
          }
        }
        onInterim(interim.trim());
      };
      recognition.onerror = (event) => onError(event.error);
      recognition.onend = () => {
        recognition = null;
        onEnd();
      };
      recognition.start();
    },
    stop() {
      recognition?.stop();
    },
  };
}

/**
 * Add spoken text to the end of the note, with one space between, never
 * longer than `maxLength` (the note box's limit).
 */
export function appendSpokenText(note: string, spoken: string, maxLength: number): string {
  const text = spoken.trim();
  if (text === "") {
    return note;
  }
  const joined = note.trim() === "" ? text : `${note.replace(/\s+$/, "")} ${text}`;
  return joined.slice(0, maxLength);
}

/** A friendly message for the browser's error codes. */
export function speechErrorMessage(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access was blocked. Allow the microphone for this site in the browser's address bar, then try again.";
    case "no-speech":
      return "No speech was heard. Please try again and speak a little closer to the microphone.";
    case "audio-capture":
      return "No microphone was found. Please check that one is connected.";
    case "network":
      return "The browser's speech service could not be reached. Check the internet connection, or type the note instead.";
    case "aborted":
      return "";
    default:
      return "Voice input stopped unexpectedly. Please try again, or type the note instead.";
  }
}
