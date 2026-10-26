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
      <Leaf
        className="text-primary"
        size={26}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <div>
        <p className="text-lg font-medium leading-tight text-ink">
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
