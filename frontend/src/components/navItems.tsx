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

/** The sidebar shows items under small section labels, in this order. */
export const NAV_GROUPS = ["Workspace", "Assistant"] as const;

export type NavGroup = (typeof NAV_GROUPS)[number];

export type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  group: NavGroup;
};

// Pages that exist and can be visited.
export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard {...iconProps} />, group: "Workspace" },
  { href: "/customers", label: "Customers", icon: <Users {...iconProps} />, group: "Workspace" },
  {
    href: "/interactions",
    label: "Interactions",
    icon: <MessagesSquare {...iconProps} />,
    group: "Workspace",
  },
  {
    href: "/follow-ups",
    label: "Follow-ups",
    icon: <CalendarCheck {...iconProps} />,
    group: "Workspace",
  },
  { href: "/assistant", label: "AI Assistant", icon: <Sparkles {...iconProps} />, group: "Assistant" },
];

// Pages planned for later. Shown greyed out with a "Soon" label.
export const soonItems: Omit<NavItem, "href" | "group">[] = [
  { label: "Calendar", icon: <CalendarDays {...iconProps} /> },
  { label: "Reports", icon: <ChartColumn {...iconProps} /> },
];
