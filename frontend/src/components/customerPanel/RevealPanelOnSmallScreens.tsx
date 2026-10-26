// RevealPanelOnSmallScreens: scrolls the customer panel into view when it
// opens on screens narrower than xl.
//
// Why: customer links keep the page where it is (scroll={false}) so the
// follow-up table does not jump. On wide screens the panel is a sticky
// column, always visible. On smaller screens it opens at the TOP of the
// page, which may be out of view, so we scroll up to it.
//
// Why "use client": scrolling and checking the screen width need the
// browser (window), which only Client Components can use. It renders
// nothing visible: just an empty marker inside the panel.
// The parent gives it a `key` per customer, so it runs once for each
// customer opened, not when switching tabs.
"use client";

import { useEffect, useRef } from "react";

// Tailwind's `xl` breakpoint (80rem = 1280px).
const WIDE_SCREEN_QUERY = "(min-width: 80rem)";

export default function RevealPanelOnSmallScreens() {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia(WIDE_SCREEN_QUERY).matches) {
      return;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const panel = markerRef.current?.closest("aside");
    panel?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
  }, []);

  return <span ref={markerRef} hidden />;
}
