// CustomerSectionView: one section of the customer card (Interactions,
// Follow-ups or Notes), shown INSIDE the card when the URL has ?tab=...
// At the top: "← Company name" goes back to the card's summary, and ✕
// closes the card. Below: the section itself (passed in as children).
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CloseCardLink from "./CloseCardLink";

type CustomerSectionViewProps = {
  companyName: string;
  /** The card's summary view (same page, no ?tab). */
  summaryHref: string;
  /** This page without the card (the ✕ button). */
  closeHref: string;
  children: React.ReactNode;
};

export default function CustomerSectionView({
  companyName,
  summaryHref,
  closeHref,
  children,
}: CustomerSectionViewProps) {
  return (
    <div>
      <div className="flex items-start gap-2">
        <Link
          href={summaryHref}
          scroll={false}
          className="-mt-2 -ml-2 inline-flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-2 text-sm font-medium text-ink transition-colors duration-150 hover:bg-hover"
        >
          <ArrowLeft className="shrink-0" size={18} strokeWidth={1.75} aria-hidden="true" />
          <span className="truncate">{companyName}</span>
          <span className="sr-only">(back to summary)</span>
        </Link>
        <CloseCardLink href={closeHref} />
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
