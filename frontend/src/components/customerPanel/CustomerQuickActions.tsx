// CustomerQuickActions: the three buttons at the bottom of the customer card:
// Edit (the customer), Log (an interaction) and + Follow-up (the main action).
// Each opens its form with this customer already chosen; after saving or
// Cancel, the user comes back to this same view (returnTo).
// (Call and Email are the phone and email lines on the card itself.)
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { customerEditHref } from "@/lib/customers/customerHrefs";
import { newFollowUpHref } from "@/lib/followUps/followUpHrefs";
import { newInteractionHref } from "@/lib/interactions/interactionHrefs";

type CustomerQuickActionsProps = {
  customerId: number;
  /** This page with the card open, to come back to after saving. */
  returnTo: string;
};

const iconProps = { size: 16, strokeWidth: 1.75, "aria-hidden": true } as const;
const baseClasses =
  "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150";
// Edit and Log are as wide as their text; Follow-up (the main action) takes the rest.
const outlineClasses = `${baseClasses} shrink-0 border border-line text-ink hover:bg-hover`;
const primaryClasses = `${baseClasses} flex-1 bg-primary text-on-primary hover:bg-primary-hover`;

export default function CustomerQuickActions({ customerId, returnTo }: CustomerQuickActionsProps) {
  return (
    <div className="flex gap-2">
      <Link href={customerEditHref(customerId, returnTo)} className={outlineClasses}>
        <Pencil {...iconProps} />
        Edit<span className="sr-only"> customer</span>
      </Link>
      <Link href={newInteractionHref({ customerId, returnTo })} className={outlineClasses}>
        <Plus {...iconProps} />
        Log<span className="sr-only"> an interaction</span>
      </Link>
      <Link href={newFollowUpHref({ customerId, returnTo })} className={primaryClasses}>
        <Plus {...iconProps} />
        Follow-up<span className="sr-only"> (new)</span>
      </Link>
    </div>
  );
}
