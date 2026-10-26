// NavLink: one item in the navigation (icon + label) that highlights
// itself when it matches the page you are on.
//
// Why "use client": to know the current page we call usePathname(), which
// reads the browser URL. Only Client Components can do that, so this small
// piece runs in the browser while the rest of the sidebar stays on the server.
//
// The icon arrives as a ready-made element (e.g. <Users />), not as the
// component itself: the server can send elements to the browser, but it
// cannot send functions.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export default function NavLink({ href, label, icon }: NavLinkProps) {
  const pathname = usePathname();

  // "/" must match exactly, otherwise Dashboard would be active on every page.
  // Other items also stay active on sub-pages, e.g. /customers/12.
  const isActive =
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const baseClasses =
    "flex h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-base transition-colors duration-150";
  const stateClasses = isActive
    ? "bg-selected font-medium text-ink"
    : "text-ink/80 hover:bg-hover hover:text-ink";

  return (
    <Link
      href={href}
      className={`${baseClasses} ${stateClasses}`}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="text-icon">{icon}</span>
      {label}
    </Link>
  );
}
