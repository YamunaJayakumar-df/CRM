// QuickActions: a 2 x 2 grid of shortcuts on the dashboard.
// "Add Customer" opens the Add customer form; the others open the matching
// list page until their forms exist. View Calendar is disabled until the
// Calendar page exists.
import { CalendarDays, CalendarPlus, MessageSquarePlus, UserPlus } from "lucide-react";
import { NEW_CUSTOMER_HREF } from "@/lib/customers/customerHrefs";
import QuickActionLink from "./QuickActionLink";

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <QuickActionLink href={NEW_CUSTOMER_HREF} label="Add Customer" icon={<UserPlus {...iconProps} />} />
      <QuickActionLink
        href="/interactions"
        label="Log Interaction"
        icon={<MessageSquarePlus {...iconProps} />}
      />
      <QuickActionLink
        href="/follow-ups"
        label="Create Follow-up"
        icon={<CalendarPlus {...iconProps} />}
      />
      <QuickActionLink label="View Calendar" icon={<CalendarDays {...iconProps} />} />
    </div>
  );
}
