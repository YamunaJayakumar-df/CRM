// FollowUpsViewLinks: "Due today | Overdue | Open | Done | All".
// Plain links (no JavaScript needed) that change ?view= and keep the search
// and customer filter. The active one is marked with aria-current (see
// SegmentedLinks). On very narrow phones the row scrolls sideways on its
// own, so the page itself never does.
import SegmentedLinks from "@/components/SegmentedLinks";
import {
  FOLLOW_UPS_VIEW_LABELS,
  FOLLOW_UPS_VIEWS,
  followUpsHref,
  type FollowUpsState,
} from "@/lib/followUps/followUpsView";

type FollowUpsViewLinksProps = {
  state: FollowUpsState;
};

export default function FollowUpsViewLinks({ state }: FollowUpsViewLinksProps) {
  return (
    <div className="max-w-full overflow-x-auto">
      <SegmentedLinks
        ariaLabel="Show follow-ups"
        options={FOLLOW_UPS_VIEWS.map((view) => ({
          key: view,
          href: followUpsHref({ ...state, view }),
          active: view === state.view,
          label: FOLLOW_UPS_VIEW_LABELS[view],
        }))}
      />
    </div>
  );
}
