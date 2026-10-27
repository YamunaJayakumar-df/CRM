// LogInteractionLink: the small "+ Log" link in the header of the panel's
// interaction lists. Opens the Log form for this customer (any type, e.g.
// after a phone call made with the Call tile) and comes back to returnTo.
// Styled like ViewAllLink, its neighbour in the header.
import Link from "next/link";
import { Plus } from "lucide-react";
import { newInteractionHref } from "@/lib/interactions/interactionHrefs";

type LogInteractionLinkProps = {
  customerId: number;
  /** The current dashboard URL (panel open). */
  returnTo: string;
};

export default function LogInteractionLink({ customerId, returnTo }: LogInteractionLinkProps) {
  return (
    <Link
      href={newInteractionHref({ customerId, returnTo })}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg py-1 text-sm font-medium text-accent hover:underline"
    >
      <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
      Log
      <span className="sr-only"> an interaction</span>
    </Link>
  );
}
