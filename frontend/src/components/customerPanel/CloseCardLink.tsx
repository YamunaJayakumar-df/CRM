// CloseCardLink: the round "✕" button in the top-right corner of the
// customer card. It is a plain link to the same page without ?customer,
// so the card closes but the page and its filters stay as they were.
import Link from "next/link";
import { X } from "lucide-react";

type CloseCardLinkProps = {
  /** This page without ?customer (keeps its filters). */
  href: string;
};

export default function CloseCardLink({ href }: CloseCardLinkProps) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-label="Close customer details"
      className="-mt-2 -mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-icon transition-colors duration-150 hover:bg-hover hover:text-ink"
    >
      <X size={18} strokeWidth={1.75} aria-hidden="true" />
    </Link>
  );
}
