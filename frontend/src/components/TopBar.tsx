// TopBar: the bar above every page with search, notifications and the
// main "+ New" action. It lives in the root layout so every page gets it.
import { Bell, Search } from "lucide-react";
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
        {/*
          Notifications: no dot or count yet. A later step will show how
          many follow-ups are due today or overdue.
        */}
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-icon transition-colors duration-150 hover:bg-hover"
        >
          <Bell size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>

        {/*
          "+ New" goes to the Customers page for now. A later step will turn
          it into a small menu (new customer, interaction or follow-up).
        */}
        <PrimaryButtonLink href="/customers">New</PrimaryButtonLink>
      </div>
    </header>
  );
}
