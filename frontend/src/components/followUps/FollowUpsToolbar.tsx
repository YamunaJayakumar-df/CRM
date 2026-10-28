// FollowUpsToolbar: the controls above the list: search box, the view
// chips (Due today / Overdue / Open / Done / All), and (when filtering by
// one customer) a removable customer chip on its own row.
// Everything here only reads the URL state, except the customer chip,
// which needs the company name and so loads inside its own <Suspense>.
// The controls wrap onto extra rows on narrow screens.
import { Suspense } from "react";
import CustomerFilterChip from "@/components/CustomerFilterChip";
import Skeleton from "@/components/Skeleton";
import { followUpsHref, type FollowUpsState } from "@/lib/followUps/followUpsView";
import FollowUpsSearchForm from "./FollowUpsSearchForm";
import FollowUpsViewLinks from "./FollowUpsViewLinks";

type FollowUpsToolbarProps = {
  state: FollowUpsState;
};

export default function FollowUpsToolbar({ state }: FollowUpsToolbarProps) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <FollowUpsSearchForm state={state} />
        <FollowUpsViewLinks state={state} />
      </div>
      {state.customerId !== null && (
        <div>
          <Suspense fallback={<Skeleton className="h-11 w-56" />}>
            <CustomerFilterChip
              customerId={state.customerId}
              removeHref={followUpsHref({ ...state, customerId: null })}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
