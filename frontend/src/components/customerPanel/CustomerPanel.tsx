// CustomerPanel: the customer card (details panel). It appears when the URL
// has ?customer=12 (see lib/dashboard/customerPanelView.ts).
//
// Used on several pages. Each page passes `readPlace`, which says which page
// this is and which of its filters to keep (see lib/customerPanel/panelPlace.ts),
// so Back, the tabs and Edit always return to the same page and filters.
//
// Placement: on extra-wide screens (xl) it is a 420px column on the RIGHT
// that stays in view while the page scrolls (sticky). On smaller screens it
// sits at the TOP of the page, full width, so it never covers anything.
// The page puts this component first; `xl:order-last` moves it to the right.
//
// Loading: this part only reads the URL (fast). The customer's data loads in
// CustomerPanelContent inside <Suspense>, with a skeleton until it arrives.
// The Suspense `key` is the customer id, so opening ANOTHER customer shows
// the skeleton again instead of the old customer's details.
// An invalid id ("abc", "0") never reaches the backend: we show
// "Customer not found" straight away.
import { Suspense } from "react";
import {
  closePanelLink,
  type PageSearchParams,
  type PanelPlaceReader,
} from "@/lib/customerPanel/panelPlace";
import {
  hasCustomerParam,
  readCustomerId,
  readCustomerTab,
} from "@/lib/dashboard/customerPanelView";
import CustomerNotFound from "./CustomerNotFound";
import CustomerPanelContent from "./CustomerPanelContent";
import CustomerPanelSkeleton from "./CustomerPanelSkeleton";
import RevealPanelOnSmallScreens from "./RevealPanelOnSmallScreens";

type CustomerPanelProps = {
  searchParams: Promise<PageSearchParams>;
  /** Reads this page's place (path + filters to keep) from its URL. */
  readPlace: PanelPlaceReader;
};

const frameClasses = [
  "min-w-0 rounded-xl border border-line bg-card p-5 shadow-soft",
  // Wide screens: a narrow (360px) right column that stays in view and scrolls on its own.
  "xl:sticky xl:top-6 xl:order-last xl:max-h-[calc(100vh-3rem)] xl:w-90 xl:shrink-0 xl:self-start xl:overflow-y-auto",
].join(" ");

export default async function CustomerPanel({ searchParams, readPlace }: CustomerPanelProps) {
  const params = await searchParams;
  if (!hasCustomerParam(params.customer)) {
    return null;
  }

  const customerId = readCustomerId(params.customer);
  const tab = readCustomerTab(params.tab);
  const place = readPlace(params);
  // "Back" closes the panel but stays on this page with its filters.
  const backHref = closePanelLink(place);

  return (
    <aside aria-label="Customer details" className={frameClasses}>
      {/* Keys must differ from the Suspense key below (React compares keys as text). */}
      <RevealPanelOnSmallScreens key={`reveal-${String(params.customer)}`} />
      {customerId === null ? (
        <CustomerNotFound backHref={backHref} />
      ) : (
        <Suspense key={customerId} fallback={<CustomerPanelSkeleton />}>
          <CustomerPanelContent
            customerId={customerId}
            tab={tab}
            place={place}
            backHref={backHref}
          />
        </Suspense>
      )}
    </aside>
  );
}
