// DateRangeLinks: "Last 7 days | Last 30 days | Last 90 days | All time".
// Plain links (no JavaScript needed) that change ?range= and keep every
// other filter. On phones the labels shorten to "7 days" etc. so all four
// fit in one row.
import SegmentedLinks from "@/components/SegmentedLinks";
import {
  INTERACTIONS_RANGE_LABELS,
  INTERACTIONS_RANGE_SHORT_LABELS,
  INTERACTIONS_RANGES,
  interactionsHref,
  type InteractionsState,
} from "@/lib/interactions/interactionsView";

type DateRangeLinksProps = {
  state: InteractionsState;
};

export default function DateRangeLinks({ state }: DateRangeLinksProps) {
  return (
    <SegmentedLinks
      ariaLabel="Date range"
      options={INTERACTIONS_RANGES.map((range) => ({
        key: range,
        href: interactionsHref({ ...state, range }),
        active: range === state.range,
        label: (
          <>
            <span className="sm:hidden">{INTERACTIONS_RANGE_SHORT_LABELS[range]}</span>
            <span className="hidden sm:inline">{INTERACTIONS_RANGE_LABELS[range]}</span>
          </>
        ),
      }))}
    />
  );
}
