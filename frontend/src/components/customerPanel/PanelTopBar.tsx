// PanelTopBar: the row at the top of the customer panel: "Back" on the
// left (closes the panel), "Edit" and a "more" (⋮) button on the right.
// Edit opens the Edit customer page; after saving (or Cancel) the user comes
// back to this same dashboard view (editHref carries ?returnTo=...).
// ⋮ is disabled until its menu is built; its label says "coming soon" so
// the reason is clear, not only the grey colour.
import Link from "next/link";
import { ArrowLeft, EllipsisVertical, Pencil } from "lucide-react";

type PanelTopBarProps = {
  /** The dashboard link without ?customer (keeps the follow-up filter). */
  backHref: string;
  /** The Edit customer page, with ?returnTo= the current dashboard view. */
  editHref: string;
};

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

export default function PanelTopBar({ backHref, editHref }: PanelTopBarProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Link
        href={backHref}
        scroll={false}
        className="-ml-3 inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-ink transition-colors duration-150 hover:bg-hover"
      >
        <ArrowLeft {...iconProps} />
        Back
        <span className="sr-only">(close customer details)</span>
      </Link>

      <div className="flex items-center gap-1">
        <Link
          href={editHref}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm font-medium text-ink transition-colors duration-150 hover:bg-hover"
        >
          <Pencil size={16} strokeWidth={1.75} aria-hidden="true" />
          Edit
          <span className="sr-only">customer</span>
        </Link>
        <span title="Coming soon">
          <button
            type="button"
            disabled
            aria-label="More actions (coming soon)"
            className="inline-flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-xl text-icon opacity-60"
          >
            <EllipsisVertical {...iconProps} />
          </button>
        </span>
      </div>
    </div>
  );
}
