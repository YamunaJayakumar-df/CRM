// FollowUpFilterChips: the "All / Open / Overdue / Completed" pills above
// the follow-ups table.
//
// Each chip is a plain link that changes ?fu= in the URL (and keeps the
// current search text). The server then renders the matching list. Links
// work without JavaScript and can be bookmarked; `scroll={false}` keeps the
// page where it is instead of jumping to the top.
// The counts come from the dashboard summary (all follow-ups, not only the
// searched ones). "Open" includes overdue ones: they are still open.
import Link from "next/link";
import {
  FOLLOW_UP_CHIP_LABELS,
  FOLLOW_UP_CHIPS,
  followUpViewHref,
  type FollowUpChip,
} from "@/lib/dashboard/followUpView";

type FollowUpFilterChipsProps = {
  active: FollowUpChip;
  counts: Record<FollowUpChip, number>;
  search: string;
};

const baseClasses =
  "inline-flex h-11 items-center rounded-full px-4 text-sm font-medium transition-colors duration-150";
const activeClasses = "bg-primary text-on-primary";
const inactiveClasses = "border border-line text-ink hover:bg-hover";

export default function FollowUpFilterChips({
  active,
  counts,
  search,
}: FollowUpFilterChipsProps) {
  return (
    <nav aria-label="Filter follow-ups">
      <ul className="flex flex-wrap gap-2">
        {FOLLOW_UP_CHIPS.map((chip) => {
          const isActive = chip === active;
          return (
            <li key={chip}>
              <Link
                href={followUpViewHref(chip, search)}
                scroll={false}
                aria-current={isActive ? "true" : undefined}
                className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
              >
                {FOLLOW_UP_CHIP_LABELS[chip]} ({counts[chip]})
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
