// ActivityIcon: the round tinted icon in front of each item in Recent
// Activity: phone for a call, envelope for an email, calendar for a
// meeting, sticky note for a note. The title next to it says the type in
// words too, so the icon is decoration (aria-hidden).
import { CalendarDays, Mail, MessageSquare, Phone, StickyNote } from "lucide-react";
import type { InteractionType } from "@/lib/api/types";

type ActivityIconProps = {
  type: InteractionType;
};

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

// Full class names are written out so Tailwind can find them.
const styles: Record<InteractionType, { icon: React.ReactNode; tint: string }> = {
  CALL: { icon: <Phone {...iconProps} />, tint: "bg-avatar-blue text-avatar-blue-ink" },
  EMAIL: { icon: <Mail {...iconProps} />, tint: "bg-avatar-violet text-avatar-violet-ink" },
  MEETING: { icon: <CalendarDays {...iconProps} />, tint: "bg-avatar-teal text-avatar-teal-ink" },
  NOTE: { icon: <StickyNote {...iconProps} />, tint: "bg-medium-bg text-medium-ink" },
};

// Used if the backend ever sends a type this frontend does not know yet.
const fallbackStyle = { icon: <MessageSquare {...iconProps} />, tint: "bg-hover text-icon" };

export default function ActivityIcon({ type }: ActivityIconProps) {
  const { icon, tint } = styles[type] ?? fallbackStyle;

  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tint}`}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}
