// MicButton: press, speak, and the words go into the note box.
//
// - Press once to start, again to stop. While listening, the words heard so
//   far are shown in grey; finished words are handed to `onText`.
// - It only fills the note box: nothing is sent to our AI until the user
//   presses "Understand".
// - Browsers without speech recognition (e.g. Firefox) get a short note
//   instead of a button that cannot work.
// - Uses the "ears" in lib/assistant/speech.ts, so the speech service can
//   be swapped later without changing this button.
"use client";

import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createBrowserSpeechToText, isSpeechSupported, speechErrorMessage, type SpeechToText } from "@/lib/assistant/speech";

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

// "Does this browser support speech?" never changes while the page is open,
// so there is nothing to subscribe to. On the server the answer is "no";
// the browser then gives the real answer without a hydration mismatch.
const noSubscription = () => () => {};
const browserSupportsSpeech = () => isSpeechSupported(window as unknown as Parameters<typeof isSpeechSupported>[0]);
const serverSupportsSpeech = () => false;

type MicButtonProps = {
  /** Called with each finished piece of spoken text. */
  onText: (text: string) => void;
  disabled?: boolean;
};

export default function MicButton({ onText, disabled = false }: MicButtonProps) {
  const supported = useSyncExternalStore(noSubscription, browserSupportsSpeech, serverSupportsSpeech);
  const [listening, setListening] = useState(false);
  const [hearing, setHearing] = useState("");
  const [error, setError] = useState("");
  const ears = useRef<SpeechToText | null>(null);

  // Stop listening if the user leaves the page while the mic is on.
  useEffect(() => () => ears.current?.stop(), []);

  if (!supported) {
    return <p className="text-sm text-muted">Voice input works in Chrome or Edge. In this browser, please type the note.</p>;
  }

  function start() {
    setError("");
    ears.current ??= createBrowserSpeechToText(window as unknown as Parameters<typeof createBrowserSpeechToText>[0]);
    if (ears.current === null) {
      return;
    }
    setListening(true);
    ears.current.start({
      onFinal: (text) => onText(text),
      onInterim: (text) => setHearing(text),
      onError: (code) => setError(speechErrorMessage(code)),
      onEnd: () => {
        setListening(false);
        setHearing("");
      },
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => (listening ? ears.current?.stop() : start())}
        disabled={disabled && !listening}
        aria-pressed={listening}
        className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-base font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${
          listening ? "border-danger bg-high-bg text-high-ink" : "border-line text-ink hover:bg-hover"
        }`}
      >
        {listening ? <Square {...iconProps} /> : <Mic {...iconProps} />}
        {listening ? "Stop listening" : "Speak"}
      </button>
      {/* Screen readers hear the live words and any problem. */}
      <p className="mt-2 min-h-5 text-sm text-muted" aria-live="polite">
        {listening ? hearing || "Listening… speak now." : ""}
      </p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
