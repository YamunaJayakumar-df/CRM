// CustomerPageTabs: the tab row of a customer's page (Overview,
// Interactions, Follow-ups (n), Notes).
//
// Each tab is a plain link that changes ?tab= in the URL, so the server
// shows the chosen tab, and refresh and the browser's Back button work.
// The active tab is underlined in the accent colour AND marked with
// aria-current, so it is not shown by colour alone.
// If the tabs are wider than the screen (phones), only this row scrolls sideways.
import Link from "next/link";
import { customerPageHref } from "@/lib/customers/customerHrefs";
import type { CustomerTab } from "@/lib/dashboard/customerPanelView";

type CustomerPageTabsProps = {
  customerId: number;
  active: CustomerTab;
  /** e.g. "3" or "20+": shown as "Follow-ups (3)". */
  openFollowUpCountText: string;
};

const baseClasses =
  "inline-flex h-11 items-center gap-1.5 border-b-2 px-3 text-sm whitespace-nowrap transition-colors duration-150";
const activeClasses = "border-accent font-medium text-ink";
const inactiveClasses = "border-transparent text-muted hover:text-ink";

export default function CustomerPageTabs({
  customerId,
  active,
  openFollowUpCountText,
}: CustomerPageTabsProps) {
  const tabs: { tab: CustomerTab; label: React.ReactNode }[] = [
    { tab: "overview", label: "Overview" },
    { tab: "interactions", label: "Interactions" },
    {
      tab: "follow-ups",
      // One wrapping <span>, so the row's gap is not put between the pieces.
      label: (
        <span>
          Follow-ups ({openFollowUpCountText}
          <span className="sr-only"> open</span>)
        </span>
      ),
    },
    { tab: "notes", label: "Notes" },
  ];

  return (
    <nav aria-label="Customer sections" className="mb-6 overflow-x-auto border-b border-line">
      <ul className="flex">
        {tabs.map(({ tab, label }) => {
          const isActive = tab === active;
          return (
            <li key={tab}>
              <Link
                href={customerPageHref(customerId, tab)}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
