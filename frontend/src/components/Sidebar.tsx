// Sidebar: the left navigation column on tablet and desktop screens.
// It is a Server Component; only the NavLink items inside it run in the
// browser (they need the current URL to show which page is active).
// "Follow-ups" gets a count pill (FollowUpCountBadge) when follow-ups are
// due today or overdue.
// On phones it is hidden and MobileNav is shown instead.
import { CircleUserRound } from "lucide-react";
import FollowUpCountBadge from "./FollowUpCountBadge";
import Logo from "./Logo";
import NavLink from "./NavLink";
import SoonNavItem from "./SoonNavItem";
import { NAV_GROUPS, navItems, soonItems } from "./navItems";

// The small grey label above each group of menu items.
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 px-3 text-xs font-medium tracking-wider text-muted uppercase">{children}</p>;
}

export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-sidebar px-4 py-6 md:flex">
      <div className="px-3">
        <Logo showSubtitle />
      </div>

      <nav aria-label="Main" className="mt-8 flex flex-col gap-6">
        {NAV_GROUPS.map((group) => (
          <div key={group} className="flex flex-col gap-0.5">
            <SectionLabel>{group}</SectionLabel>
            {navItems
              .filter((item) => item.group === group)
              .map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  badge={item.href === "/follow-ups" ? <FollowUpCountBadge /> : undefined}
                />
              ))}
          </div>
        ))}
        <div className="flex flex-col gap-0.5">
          <SectionLabel>Coming soon</SectionLabel>
          {soonItems.map((item) => (
            <SoonNavItem key={item.label} label={item.label} icon={item.icon} />
          ))}
        </div>
      </nav>

      {/*
        User area placeholder. There is no login yet, so we show a generic
        icon and text instead of a real name. The Auth step will replace this
        with the signed-in user's name and a sign-out option.
      */}
      <div className="mt-auto flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
        <CircleUserRound
          className="text-icon"
          size={32}
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-medium text-ink">Signed-in user</p>
          <p className="text-xs text-muted">Login comes later</p>
        </div>
      </div>
    </aside>
  );
}
