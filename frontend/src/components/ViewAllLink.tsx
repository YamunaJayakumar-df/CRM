// ViewAllLink: the small "View all →" link used in a Card's header to
// jump to the full list page.
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type ViewAllLinkProps = {
  href: string;
};

export default function ViewAllLink({ href }: ViewAllLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg py-1 text-sm font-medium text-accent hover:underline"
    >
      View all
      <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
    </Link>
  );
}
