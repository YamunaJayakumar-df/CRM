// ResetAfterSubmit: makes a form start fresh after it was sent and the user
// moved on, so pressing browser Back does not show the old filled-in form.
//
// Why this is needed: with cacheComponents, Next.js does not throw a page
// away when you leave it; it HIDES it (React's <Activity>) and shows it
// again on Back. That keeps drafts, which is nice, but after a successful
// save the old text (or old error messages) would still be there.
//
// How (the pattern from Next's "Preserving UI state" guide):
// 1. onSubmitCapture notes "this form was sent" in a ref (a value React
//    keeps between renders without re-rendering).
// 2. When the page is hidden, React runs the useLayoutEffect cleanup. If the
//    form was sent, we bump `resetCount`.
// 3. `resetCount` is the `key` of the wrapper. A new key makes React build
//    everything inside again from scratch: empty inputs AND a fresh
//    useActionState (no old errors).
// A form that was never sent keeps its draft, as before.
"use client";

import { useLayoutEffect, useRef, useState } from "react";

type ResetAfterSubmitProps = {
  children: React.ReactNode;
};

export default function ResetAfterSubmit({ children }: ResetAfterSubmitProps) {
  const [resetCount, setResetCount] = useState(0);
  const wasSubmitted = useRef(false);

  useLayoutEffect(() => {
    return () => {
      if (wasSubmitted.current) {
        wasSubmitted.current = false;
        setResetCount((count) => count + 1);
      }
    };
  }, []);

  return (
    <div
      key={resetCount}
      onSubmitCapture={() => {
        wasSubmitted.current = true;
      }}
    >
      {children}
    </div>
  );
}
