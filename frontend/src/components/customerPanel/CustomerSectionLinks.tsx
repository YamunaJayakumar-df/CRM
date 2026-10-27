// CustomerSectionLinks: the clickable rows on the customer card that open a
// section INSIDE the card (Interactions, Follow-ups, Notes). Each row shows
// a short hint (e.g. "3 open") and an arrow.
//
// Each row is a plain link that adds ?tab=... to this page's URL, so the
// server shows that section, and the browser's Back button returns here.
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { customerPanelLink, type PanelPlace } from "@/lib/customerPanel/panelPlace";
import type { CustomerTab } from "@/lib/dashboard/customerPanelView";

export type SectionLink = {
  tab: Exclude<CustomerTab, "overview">;
  label: string;
  hint: string;
};

type CustomerSectionLinksProps = {
  customerId: number;
  place: PanelPlace;
  sections: SectionLink[];
};

export default function CustomerSectionLinks({ customerId, place, sections }: CustomerSectionLinksProps) {
  return (
    <nav aria-label="Customer sections" className="mt-5">
      <ul className="-mx-2 flex flex-col">
        {sections.map((section) => (
          <li key={section.tab} className="border-t border-line first:border-t-0">
            <Link
              href={customerPanelLink(place, customerId, section.tab)}
              scroll={false}
              className="flex min-h-11 items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-hover"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">{section.label}</span>
                <span className="block truncate text-xs text-muted">{section.hint}</span>
              </span>
              <ChevronRight className="shrink-0 text-icon" size={18} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
