// SegmentedLinks: a row of joined options where exactly one is active,
// e.g. "Table | Kanban" or "Last 7 days | Last 30 days | ...".
//
// Each option is a plain link that changes the URL, so it works without
// JavaScript and the chosen view can be bookmarked. The active option gets
// a lifted background (bg-selected) and aria-current, so it is never shown
// by colour alone. Segments fill the full 44px height (easy to tap); the
// focus ring is drawn inside (-outline-offset-2) so the rounded frame does
// not cut it off.
import Link from "next/link";

export type SegmentedLinkOption = {
  /** Unique key, e.g. "table". */
  key: string;
  href: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  active: boolean;
};

type SegmentedLinksProps = {
  /** What the group chooses, read out to screen readers, e.g. "View". */
  ariaLabel: string;
  options: SegmentedLinkOption[];
};

const baseClasses =
  "inline-flex h-full items-center gap-2 px-3 text-sm font-medium whitespace-nowrap -outline-offset-2 transition-colors duration-150";
const activeClasses = "bg-selected text-ink";
const inactiveClasses = "text-muted hover:bg-hover hover:text-ink";

export default function SegmentedLinks({ ariaLabel, options }: SegmentedLinksProps) {
  return (
    <nav aria-label={ariaLabel}>
      <ul className="inline-flex h-11 overflow-hidden rounded-xl border border-line bg-card">
        {options.map((option) => (
          <li key={option.key} className="flex">
            <Link
              href={option.href}
              scroll={false}
              aria-current={option.active ? "true" : undefined}
              className={`${baseClasses} ${option.active ? activeClasses : inactiveClasses}`}
            >
              {option.icon}
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
