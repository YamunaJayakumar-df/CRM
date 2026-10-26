// Logo: the leaf icon + "CRM" name shown at the top of the navigation.
// Shared by the desktop Sidebar and the phone MobileNav so the brand
// looks the same everywhere. The subtitle is optional (sidebar only).
import { Leaf } from "lucide-react";

type LogoProps = {
  showSubtitle?: boolean;
};

export default function Logo({ showSubtitle = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <Leaf
        className="text-accent"
        size={24}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <div>
        <p className="text-lg font-medium leading-tight text-ink">CRM</p>
        {showSubtitle && (
          <p className="text-xs text-muted">Build better relationships</p>
        )}
      </div>
    </div>
  );
}
