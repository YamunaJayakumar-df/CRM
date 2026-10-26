// ActionTile: one square button in the customer panel's action row, with
// the icon above a short label (Call, Email, ...).
//
// - With `href`: a real link (e.g. "tel:..." or "mailto:..."). A plain <a>,
//   not next/link, because these open the phone or mail app, not a page.
// - Without `href`: a disabled button. `disabledReason` is read out to
//   screen readers and shown as a tooltip (on a wrapper, because browsers
//   do not show tooltips on disabled buttons reliably).
// `primary` gives the filled lavender style for the main action.
type ActionTileProps = {
  label: string;
  icon: React.ReactNode;
  /** Where it goes. null = disabled. */
  href: string | null;
  /** Why it is disabled, e.g. "No phone number" or "Soon". */
  disabledReason: string;
  primary?: boolean;
  /** Extra layout classes for the grid cell, e.g. "col-span-4". */
  className?: string;
};

const baseClasses =
  "flex h-16 w-full flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium transition-colors duration-150";

export default function ActionTile({
  label,
  icon,
  href,
  disabledReason,
  primary = false,
  className = "",
}: ActionTileProps) {
  const colourClasses = primary
    ? "bg-primary text-on-primary"
    : "border border-line text-ink";

  if (href !== null) {
    const hoverClasses = primary ? "hover:bg-primary-hover" : "hover:bg-hover";
    return (
      <a href={href} className={`${baseClasses} ${colourClasses} ${hoverClasses} ${className}`}>
        <span className={primary ? "" : "text-icon"}>{icon}</span>
        {label}
      </a>
    );
  }

  return (
    <span title={disabledReason} className={className}>
      <button
        type="button"
        disabled
        className={`${baseClasses} ${colourClasses} cursor-not-allowed opacity-50`}
      >
        {icon}
        {label}
        <span className="sr-only">({disabledReason})</span>
      </button>
    </span>
  );
}
