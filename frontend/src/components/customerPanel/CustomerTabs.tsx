// CustomerTabs: the tab row of the customer panel (Overview, Interactions,
// Follow-ups (n), Notes, Files).
//
// Each tab is a plain link that changes ?tab= in the URL and keeps the
// page and its filters (from `place`), so the server renders the chosen tab.
// The active tab is underlined in the accent colour AND marked with
// aria-current, so it is not shown by colour alone.
// "Files" is not built yet, so it is greyed out with a "Soon" tag.
// If the tabs are wider than the panel, only this row scrolls sideways.
import Link from "next/link";
import { customerPanelLink, type PanelPlace } from "@/lib/customerPanel/panelPlace";
import type { CustomerTab } from "@/lib/dashboard/customerPanelView";

type CustomerTabsProps = {
  customerId: number;
  active: CustomerTab;
  /** The page the panel is on, and the filters its links keep. */
  place: PanelPlace;
  /** How many open follow-ups were loaded (at most `countLimit`). */
  openFollowUpCount: number;
  /** When the count reaches this, it is shown as e.g. "20+". */
  countLimit: number;
};

const baseClasses =
  "inline-flex h-11 items-center gap-1.5 border-b-2 px-2.5 text-sm whitespace-nowrap transition-colors duration-150";
const activeClasses = "border-accent font-medium text-ink";
const inactiveClasses = "border-transparent text-muted hover:text-ink";

export default function CustomerTabs({
  customerId,
  active,
  place,
  openFollowUpCount,
  countLimit,
}: CustomerTabsProps) {
  const countText =
    openFollowUpCount >= countLimit ? `${countLimit}+` : String(openFollowUpCount);

  const tabs: { tab: CustomerTab; label: React.ReactNode }[] = [
    { tab: "overview", label: "Overview" },
    { tab: "interactions", label: "Interactions" },
    {
      tab: "follow-ups",
      // One wrapping <span>, so the row's gap is not put between the pieces
      // (that used to render as "Follow-ups (2 )").
      label: (
        <span>
          Follow-ups ({countText}
          <span className="sr-only"> open</span>)
        </span>
      ),
    },
    { tab: "notes", label: "Notes" },
  ];

  return (
    <nav aria-label="Customer sections" className="-mx-6 mt-6 overflow-x-auto border-b border-line px-6">
      <ul className="flex">
        {tabs.map(({ tab, label }) => {
          const isActive = tab === active;
          return (
            <li key={tab}>
              <Link
                href={customerPanelLink(place, customerId, tab)}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
              >
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <span
            aria-disabled="true"
            className={`${baseClasses} border-transparent text-muted`}
          >
            <span className="opacity-60">Files</span>
            <span className="rounded-full border border-line px-2 py-0.5 text-xs">Soon</span>
          </span>
        </li>
      </ul>
    </nav>
  );
}
