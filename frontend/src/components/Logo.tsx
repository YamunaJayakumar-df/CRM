// Logo: the leaf icon + "Nexora CRM" name shown at the top of the navigation.
// Shared by the desktop Sidebar and the phone MobileNav so the brand
// looks the same everywhere. The tagline is optional (sidebar only).
import { Leaf } from "lucide-react";

type LogoProps = {
  showSubtitle?: boolean;
};

export default function Logo({ showSubtitle = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Brand mark: the leaf in a violet rounded square. */}
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
        <Leaf size={20} strokeWidth={2} aria-hidden="true" />
      </span>
      <div>
        <p className="text-lg font-semibold leading-tight text-ink">
          Nexora CRM
        </p>
        {showSubtitle && (
          <p className="text-xs text-muted">
            Better conversations. Bigger opportunities.
          </p>
        )}
      </div>
    </div>
  );
}
