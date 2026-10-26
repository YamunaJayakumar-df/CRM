// ActivityIcon: the round tinted icon in front of each item in Recent
// Activity: phone for a call, envelope for an email, calendar for a
// meeting, sticky note for a note. The title next to it says the type in
// words too, so the icon is decoration (aria-hidden).
import { CalendarDays, Mail, MessageSquare, Phone, StickyNote } from "lucide-react";
import type { InteractionType } from "@/lib/api/types";
import { interactionTypeTint } from "@/components/interactionTypeTints";

type ActivityIconProps = {
  type: InteractionType;
};

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

// The colours come from interactionTypeTints.ts (shared with the Interactions page).
const icons: Record<InteractionType, React.ReactNode> = {
  CALL: <Phone {...iconProps} />,
  EMAIL: <Mail {...iconProps} />,
  MEETING: <CalendarDays {...iconProps} />,
  NOTE: <StickyNote {...iconProps} />,
};

export default function ActivityIcon({ type }: ActivityIconProps) {
  // Unknown type from the backend: a generic icon in grey.
  const icon = icons[type] ?? <MessageSquare {...iconProps} />;
  const tint = interactionTypeTint(type);

  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tint}`}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}
