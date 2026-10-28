// EditFollowUpIconLink: a small pencil link to the Edit follow-up page,
// used in tight rows (dashboard table, customer panel).
//
// Same rules as EditInteractionIconLink: its own link (never inside another
// link), the icon has no visible words so aria-label names it, with the
// follow-up's title so a list of them is not just "Edit, Edit, Edit".
// The tap area is the full 44 x 44px.
import Link from "next/link";
import { Pencil } from "lucide-react";

type EditFollowUpIconLinkProps = {
  href: string;
  /** The follow-up's title. */
  title: string;
  /** Extra layout classes, e.g. negative margins in a list row. */
  className?: string;
};

export default function EditFollowUpIconLink({ href, title, className = "" }: EditFollowUpIconLinkProps) {
  return (
    <Link
      href={href}
      aria-label={`Edit follow-up: ${title}`}
      title="Edit follow-up"
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-icon transition-colors duration-150 hover:bg-hover hover:text-ink ${className}`}
    >
      <Pencil size={16} strokeWidth={1.75} aria-hidden="true" />
    </Link>
  );
}
