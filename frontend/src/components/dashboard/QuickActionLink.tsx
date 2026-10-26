// QuickActionLink: one small outlined button (icon + label) in the
// dashboard's Quick Actions grid. Without `href` it shows as disabled
// with a "Soon" tag, for actions whose page does not exist yet (the words
// say why it is disabled, not just the grey colour).
import Link from "next/link";

type QuickActionLinkProps = {
  label: string;
  icon: React.ReactNode;
  /** Where it goes. Leave out for a "Soon" (disabled) action. */
  href?: string;
};

const baseClasses =
  "flex h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm";

export default function QuickActionLink({ label, icon, href }: QuickActionLinkProps) {
  if (href === undefined) {
    return (
      <span className={`${baseClasses} text-muted`} aria-disabled="true">
        <span className="opacity-60">{icon}</span>
        <span className="truncate">{label}</span>
        <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-xs">Soon</span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`${baseClasses} font-medium text-ink transition-colors duration-150 hover:bg-hover`}
    >
      <span className="text-icon">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
