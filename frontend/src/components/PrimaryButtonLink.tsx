// PrimaryButtonLink: a link that looks like the main (dark brown) button.
// Use it for the single most important action on a screen, e.g. "+ New".
// It is a link (not a <button>) because it takes you to another page.
import Link from "next/link";
import { Plus } from "lucide-react";

type PrimaryButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  showPlusIcon?: boolean;
};

export default function PrimaryButtonLink({
  href,
  children,
  showPlusIcon = true,
}: PrimaryButtonLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-base font-medium text-on-primary transition-colors duration-150 hover:bg-primary-hover"
    >
      {showPlusIcon && <Plus size={18} strokeWidth={2} aria-hidden="true" />}
      {children}
    </Link>
  );
}
