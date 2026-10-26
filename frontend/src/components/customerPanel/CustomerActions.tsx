// CustomerActions: the row of quick actions under the customer's name:
// Call, Email, Meeting, Note and the main "+ Follow-up" button.
//
// - Call opens the phone app (tel:) only when the customer has a phone
//   number; Email opens the mail app (mailto:) only with an email address.
//   Otherwise they are disabled, with the reason read out.
// - Meeting, Note and Follow-up need the "log" forms, which come in a later
//   step, so they are disabled with "Soon" for now.
// On phones the four small actions fill one row and Follow-up gets its own
// full-width row; from `sm` up all five sit in one row.
import { CalendarDays, Mail, Phone, Plus, StickyNote } from "lucide-react";
import type { Customer } from "@/lib/api/types";
import { mailtoHref } from "@/lib/format/mailtoHref";
import { telHref } from "@/lib/format/telHref";
import ActionTile from "./ActionTile";

type CustomerActionsProps = {
  customer: Customer;
};

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

export default function CustomerActions({ customer }: CustomerActionsProps) {
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
        href={null}
        disabledReason="Soon"
      />
      <ActionTile label="Note" icon={<StickyNote {...iconProps} />} href={null} disabledReason="Soon" />
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
