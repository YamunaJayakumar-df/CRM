// navItems: the single list of pages shown in the navigation.
// Both the desktop Sidebar and the phone MobileNav read from here, so a
// new page only needs to be added in one place.
import {
  CalendarCheck,
  CalendarDays,
  ChartColumn,
  LayoutDashboard,
  MessagesSquare,
  Sparkles,
  Users,
} from "lucide-react";

// Same size and stroke for every nav icon keeps the column calm and aligned.
const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

export type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

// Pages that exist and can be visited.
export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard {...iconProps} /> },
  { href: "/customers", label: "Customers", icon: <Users {...iconProps} /> },
  {
    href: "/interactions",
    label: "Interactions",
    icon: <MessagesSquare {...iconProps} />,
  },
  {
    href: "/follow-ups",
    label: "Follow-ups",
    icon: <CalendarCheck {...iconProps} />,
  },
  { href: "/assistant", label: "AI Assistant", icon: <Sparkles {...iconProps} /> },
];

// Pages planned for later. Shown greyed out with a "Soon" label.
export const soonItems: Omit<NavItem, "href">[] = [
  { label: "Calendar", icon: <CalendarDays {...iconProps} /> },
  { label: "Reports", icon: <ChartColumn {...iconProps} /> },
];
