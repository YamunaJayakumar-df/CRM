// SoonNavItem: a greyed-out navigation item for a page that is not built
// yet (Calendar, Reports). It is plain text, not a link, so nobody can
// click into a broken page. The "Soon" label says why it is disabled
// (we do not rely on the grey colour alone).
type SoonNavItemProps = {
  label: string;
  icon: React.ReactNode;
};

export default function SoonNavItem({ label, icon }: SoonNavItemProps) {
  return (
    <span
      className="flex h-10 items-center gap-3 rounded-lg px-3 text-[0.9375rem] text-muted"
      aria-disabled="true"
    >
      <span className="opacity-60">{icon}</span>
      {label}
      <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-xs">
        Soon
      </span>
    </span>
  );
}
