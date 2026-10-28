// QuickActions: a grid of shortcuts on the dashboard.
// "Tell the AI" (full width, first) opens the AI Assistant page.
// "Add Customer", "Log Interaction" and "Create Follow-up" open their
// forms (Log and Create come back to the dashboard after saving).
// View Calendar is disabled until the Calendar page exists.
import { CalendarDays, CalendarPlus, MessageSquarePlus, Sparkles, UserPlus } from "lucide-react";
import { NEW_CUSTOMER_HREF } from "@/lib/customers/customerHrefs";
import { newFollowUpHref } from "@/lib/followUps/followUpHrefs";
import { newInteractionHref } from "@/lib/interactions/interactionHrefs";
import QuickActionLink from "./QuickActionLink";

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <QuickActionLink href="/assistant" label="Tell the AI what happened" icon={<Sparkles {...iconProps} />} />
      </div>
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
