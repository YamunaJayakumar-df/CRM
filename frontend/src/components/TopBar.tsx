// TopBar: the bar above every page with search, notifications, the
// "Tell the AI" shortcut and the main "+ New" action. It lives in the root
// layout so every page gets it.
import { Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { NEW_CUSTOMER_HREF } from "@/lib/customers/customerHrefs";
import NotificationBell from "./NotificationBell";
import PrimaryButtonLink from "./PrimaryButtonLink";

export default function TopBar() {
  return (
    <header className="flex items-center gap-3 px-4 pt-6 md:px-8">
      {/*
        Search: for now a plain form. Pressing Enter just reloads the page
        with ?q=... in the URL and nothing filters yet. A later step will
        connect it to real customer, company and note search.
      */}
      <form role="search" className="relative min-w-0 max-w-xl flex-1">
        <label htmlFor="global-search" className="sr-only">
          Search
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"
          size={18}
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <input
          id="global-search"
          name="q"
          type="search"
          placeholder="Search customers, companies, or notes..."
          className="h-11 w-full rounded-xl border border-line bg-card pr-4 pl-10 text-base text-ink placeholder:text-muted"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        {/* Links to Follow-ups; a red dot shows when some are due today or overdue. */}
        <NotificationBell />

        {/*
          "Tell the AI": opens the AI Assistant. Soft violet so it stands out
          without competing with "+ New". On phones only the icon shows
          (aria-label keeps the name for screen readers).
        */}
        <Link
          href="/assistant"
          aria-label="Tell the AI what happened"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-primary/30 bg-primary-soft px-3 text-base font-medium text-open-ink transition-colors duration-150 hover:bg-selected sm:px-4"
        >
          <Sparkles size={18} strokeWidth={1.75} aria-hidden="true" />
          <span className="hidden sm:inline">Tell the AI</span>
        </Link>

        {/*
          "+ New" opens the Add customer form. A later step will turn it
          into a small menu (new customer, interaction or follow-up).
        */}
        <PrimaryButtonLink href={NEW_CUSTOMER_HREF}>New</PrimaryButtonLink>
      </div>
    </header>
  );
}
