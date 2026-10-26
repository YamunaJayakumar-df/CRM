// InteractionsToolbar: the controls above the list: search box, date
// range, Table/Kanban toggle, and (when filtering by one customer) a
// removable customer chip on its own row.
// Everything here only reads the URL state, except the chip, which needs
// the company name from the backend and so loads inside its own <Suspense>.
// The controls wrap onto extra rows on narrow screens.
import { Suspense } from "react";
import Skeleton from "@/components/Skeleton";
import type { InteractionsState } from "@/lib/interactions/interactionsView";
import CustomerFilterChip from "./CustomerFilterChip";
import DateRangeLinks from "./DateRangeLinks";
import InteractionSearchForm from "./InteractionSearchForm";
import ViewToggle from "./ViewToggle";

type InteractionsToolbarProps = {
  state: InteractionsState;
};

export default function InteractionsToolbar({ state }: InteractionsToolbarProps) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <InteractionSearchForm state={state} />
        <DateRangeLinks state={state} />
        <div className="ml-auto">
          <ViewToggle state={state} />
        </div>
      </div>
      {state.customerId !== null && (
        <div>
          <Suspense fallback={<Skeleton className="h-11 w-56" />}>
            <CustomerFilterChip state={state} customerId={state.customerId} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
