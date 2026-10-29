// Error screen for pages inside the app shell (the sidebar and top bar stay).
//
// Next.js shows this file instead of the page when loading it fails, most
// often because the backend is offline or too slow. Users see a calm
// message and a "Try again" button, never a technical error or stack trace.
// In production Next.js also hides the real error message from the browser;
// the server logs keep the details (matched by error.digest).
//
// Why "use client": error screens must be Client Components, because the
// "Try again" button needs a click handler running in the browser.
// retry() asks the server for the page again and re-renders it; if the
// backend is back, the real page replaces this screen.
"use client";

import { CloudOff, RotateCw } from "lucide-react";
import Card from "@/components/Card";

type ErrorPageProps = {
  error: unknown;
  retry: () => void;
};

export default function ErrorPage({ retry }: ErrorPageProps) {
  return (
    <Card>
      <div className="flex flex-col items-center px-4 py-12 text-center" role="alert">
        <CloudOff className="text-icon" size={28} strokeWidth={1.5} aria-hidden="true" />
        <h1 className="mt-3 text-lg font-semibold text-ink">We couldn&apos;t load this page</h1>
        <p className="mt-1 max-w-md text-base text-muted">
          The CRM server may be offline or busy. Please try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-base font-medium text-on-primary transition-colors duration-150 hover:bg-primary-hover"
        >
          <RotateCw size={18} strokeWidth={1.75} aria-hidden="true" />
          Try again
        </button>
      </div>
    </Card>
  );
}
