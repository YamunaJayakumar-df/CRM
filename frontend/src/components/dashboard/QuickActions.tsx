// QuickActions: a 2 x 2 grid of shortcuts on the dashboard.
// For now each one opens the matching list page; the "add" forms come in
// later steps. View Calendar is disabled until the Calendar page exists.
import { CalendarDays, CalendarPlus, MessageSquarePlus, UserPlus } from "lucide-react";
import QuickActionLink from "./QuickActionLink";

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <QuickActionLink href="/customers" label="Add Customer" icon={<UserPlus {...iconProps} />} />
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
