// QuickActions: a 2 x 2 grid of shortcuts on the dashboard.
// "Add Customer", "Log Interaction" and "Create Follow-up" open their
// forms (Log and Create come back to the dashboard after saving).
// View Calendar is disabled until the Calendar page exists.
import { CalendarDays, CalendarPlus, MessageSquarePlus, UserPlus } from "lucide-react";
import { NEW_CUSTOMER_HREF } from "@/lib/customers/customerHrefs";
import { newFollowUpHref } from "@/lib/followUps/followUpHrefs";
import { newInteractionHref } from "@/lib/interactions/interactionHrefs";
import QuickActionLink from "./QuickActionLink";

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <QuickActionLink href={NEW_CUSTOMER_HREF} label="Add Customer" icon={<UserPlus {...iconProps} />} />
      <QuickActionLink
        href={newInteractionHref({ returnTo: "/" })}
        label="Log Interaction"
        icon={<MessageSquarePlus {...iconProps} />}
      />
      <QuickActionLink
        href={newFollowUpHref({ returnTo: "/" })}
        label="Create Follow-up"
        icon={<CalendarPlus {...iconProps} />}
      />
      <QuickActionLink label="View Calendar" icon={<CalendarDays {...iconProps} />} />
    </div>
  );
}
