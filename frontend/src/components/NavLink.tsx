// NavLink: one item in the navigation (icon + label) that highlights
// itself when it matches the page you are on.
//
// Why "use client": to know the current page we call usePathname(), which
// reads the browser URL. Only Client Components can do that, so this small
// piece runs in the browser while the rest of the sidebar stays on the server.
//
// The icon arrives as a ready-made element (e.g. <Users />), not as the
// component itself: the server can send elements to the browser, but it
// cannot send functions. The optional `badge` works the same way: the
// server renders it (e.g. the follow-up count) and this item just places
// it on the right.
//
// Why the <Suspense> (Next 16 with cacheComponents): on a page whose URL has
// a part only known when someone visits it (e.g. /customers/12/edit), the
// pathname cannot be read while Next.js prebuilds the page shell, so
// usePathname() waits. The fallback shows the same link, just not
// highlighted, until the real URL is known a moment later. On fixed pages
// (/, /customers, ...) the pathname is known up front and nothing changes.
"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Optional small element on the right, e.g. a count pill. */
  badge?: React.ReactNode;
};

const baseClasses =
  "flex h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-base transition-colors duration-150";

/** The link itself, highlighted or not. */
function NavLinkView({ href, label, icon, badge, isActive }: NavLinkProps & { isActive: boolean }) {
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
      {badge}
    </Link>
  );
}

/** Reads the current URL and highlights the link when it matches. */
function ActiveAwareNavLink(props: NavLinkProps) {
  const pathname = usePathname();

  // "/" must match exactly, otherwise Dashboard would be active on every page.
  // Other items also stay active on sub-pages, e.g. /customers/12.
  const isActive =
    props.href === "/" ? pathname === "/" : pathname.startsWith(props.href);

  return <NavLinkView {...props} isActive={isActive} />;
}

export default function NavLink(props: NavLinkProps) {
  return (
    <Suspense fallback={<NavLinkView {...props} isActive={false} />}>
      <ActiveAwareNavLink {...props} />
    </Suspense>
  );
}
