// CustomerActions: the row of quick actions under the customer's name:
// Call, Email, Meeting, Note and the main "+ Follow-up" button.
//
// - Call opens the phone app (tel:) only when the customer has a phone
//   number; Email opens the mail app (mailto:) only with an email address.
//   Otherwise they are disabled, with the reason read out.
// - Meeting and Note open the Log interaction form with this customer and
//   that type already chosen; after saving (or Cancel) the user comes back
//   to this same dashboard view (returnTo).
// - Follow-up needs its form, which comes in a later step, so it is
//   disabled with "Soon" for now.
// On phones the four small actions fill one row and Follow-up gets its own
// full-width row; from `sm` up all five sit in one row.
import { CalendarDays, Mail, Phone, Plus, StickyNote } from "lucide-react";
import type { Customer } from "@/lib/api/types";
import { mailtoHref } from "@/lib/format/mailtoHref";
import { telHref } from "@/lib/format/telHref";
import { newInteractionHref } from "@/lib/interactions/interactionHrefs";
import ActionTile from "./ActionTile";

type CustomerActionsProps = {
  customer: Customer;
  /** The current dashboard URL (panel open), to come back to after logging. */
  returnTo: string;
};

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

export default function CustomerActions({ customer, returnTo }: CustomerActionsProps) {
  return (
    <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-5">
      <ActionTile
        label="Call"
        icon={<Phone {...iconProps} />}
        href={telHref(customer.phone)}
        disabledReason="No phone number"
      />
      <ActionTile
        label="Email"
        icon={<Mail {...iconProps} />}
        href={mailtoHref(customer.email)}
        disabledReason="No email address"
      />
      <ActionTile
        label="Meeting"
        icon={<CalendarDays {...iconProps} />}
        href={newInteractionHref({ customerId: customer.id, type: "MEETING", returnTo })}
      />
      <ActionTile
        label="Note"
        icon={<StickyNote {...iconProps} />}
        href={newInteractionHref({ customerId: customer.id, type: "NOTE", returnTo })}
      />
      <ActionTile
        label="Follow-up"
        icon={<Plus {...iconProps} />}
        href={null}
        disabledReason="Soon"
        primary
        className="col-span-4 sm:col-span-1"
      />
    </div>
  );
}
