// MobileNav: the navigation for phone-sized screens (below the `md` size),
// where there is no room for the sidebar. It shows the logo and a single
// row of links. If the row is wider than the screen, only the row scrolls
// sideways, never the whole page. Pages marked "Soon" are left out to keep
// the row short. Like the Sidebar, "Follow-ups" gets the due count pill.
import FollowUpCountBadge from "./FollowUpCountBadge";
import Logo from "./Logo";
import NavLink from "./NavLink";
import { navItems } from "./navItems";

export default function MobileNav() {
  return (
    <div className="bg-sidebar px-4 pt-4 pb-2 md:hidden">
      <Logo />
      <nav aria-label="Main" className="mt-3 flex gap-1 overflow-x-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            badge={item.href === "/follow-ups" ? <FollowUpCountBadge /> : undefined}
          />
        ))}
      </nav>
    </div>
  );
}
