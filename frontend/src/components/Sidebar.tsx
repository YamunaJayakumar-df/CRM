// Sidebar: the left navigation column on tablet and desktop screens.
// It is a Server Component; only the NavLink items inside it run in the
// browser (they need the current URL to show which page is active).
// On phones it is hidden and MobileNav is shown instead.
import { CircleUserRound } from "lucide-react";
import Logo from "./Logo";
import NavLink from "./NavLink";
import SoonNavItem from "./SoonNavItem";
import { navItems, soonItems } from "./navItems";

export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar px-4 py-6 md:flex">
      <div className="px-3">
        <Logo showSubtitle />
      </div>

      <nav aria-label="Main" className="mt-8 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
          />
        ))}
        {soonItems.map((item) => (
          <SoonNavItem key={item.label} label={item.label} icon={item.icon} />
        ))}
      </nav>

      {/*
        User area placeholder. There is no login yet, so we show a generic
        icon and text instead of a real name. The Auth step will replace this
        with the signed-in user's name and a sign-out option.
      */}
      <div className="mt-auto flex items-center gap-3 px-3">
        <CircleUserRound
          className="text-accent"
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
