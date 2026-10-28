// EditInteractionIconLink: a small pencil link to the Edit interaction page,
// used in the corner of Kanban cards and next to timeline items.
//
// It is its own link (separately focusable with Tab), next to, not inside,
// any other link: links inside links are not allowed in HTML.
// The icon has no visible words, so aria-label names it for screen
// readers; the interaction's title is added so a list of them is not just
// "Edit, Edit, Edit". The tap area is the full 44 x 44px.
import Link from "next/link";
import { Pencil } from "lucide-react";

type EditInteractionIconLinkProps = {
  href: string;
  /** The interaction's title (first line of its summary). */
  title: string;
  /** Extra layout classes, e.g. absolute positioning in a card. */
  className?: string;
};

export default function EditInteractionIconLink({
  href,
  title,
  className = "",
}: EditInteractionIconLinkProps) {
  return (
    <Link
      href={href}
      aria-label={`Edit interaction: ${title}`}
      title="Edit interaction"
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-icon transition-colors duration-150 hover:bg-hover hover:text-ink ${className}`}
    >
      <Pencil size={16} strokeWidth={1.75} aria-hidden="true" />
    </Link>
  );
}
