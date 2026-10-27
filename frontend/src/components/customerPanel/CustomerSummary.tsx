// CustomerSummary: the customer card's first view (no ?tab in the URL):
// name and status, contact details, links to the sections, and quick actions.
// It is deliberately short, so it fits on the screen without scrolling;
// the longer details live in the sections (see CustomerSectionView).
import CustomerStatusBadge from "@/components/CustomerStatusBadge";
import LetterAvatar from "@/components/LetterAvatar";
import type { Customer } from "@/lib/api/types";
import type { PanelPlace } from "@/lib/customerPanel/panelPlace";
import CloseCardLink from "./CloseCardLink";
import CustomerContactLines from "./CustomerContactLines";
import CustomerQuickActions from "./CustomerQuickActions";
import CustomerSectionLinks, { type SectionLink } from "./CustomerSectionLinks";

type CustomerSummaryProps = {
  customer: Customer;
  place: PanelPlace;
  sections: SectionLink[];
  /** This page without the card (the ✕ button). */
  closeHref: string;
  /** This page with this view open, for the forms to come back to. */
  returnTo: string;
};

export default function CustomerSummary({
  customer,
  place,
  sections,
  closeHref,
  returnTo,
}: CustomerSummaryProps) {
  const industry = (customer.industry ?? "").trim();

  return (
    <div>
      <div className="flex items-start gap-3">
        <LetterAvatar name={customer.companyName} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-medium break-words text-ink">{customer.companyName}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <CustomerStatusBadge status={customer.status} />
            {industry !== "" && <span className="text-sm text-muted">{industry}</span>}
          </div>
        </div>
        <CloseCardLink href={closeHref} />
      </div>

      <div className="mt-5">
        <CustomerContactLines customer={customer} />
      </div>
      <CustomerSectionLinks customerId={customer.id} place={place} sections={sections} />
      <div className="mt-5">
        <CustomerQuickActions customerId={customer.id} returnTo={returnTo} />
      </div>
    </div>
  );
}
