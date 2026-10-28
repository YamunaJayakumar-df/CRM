// InteractionTable: the Table view of interactions
// (Type | Summary | Customer | Date | Edit), newest first.
//
// On narrow screens the table keeps its width and scrolls sideways INSIDE
// the card (overflow-x-auto), so the page itself never scrolls sideways.
// The customer name opens that customer's own page (/customers/12).
// "Edit" opens the Edit page with ?returnTo= this page (same view and filters).
import Link from "next/link";
import { Pencil } from "lucide-react";
import LetterAvatar from "@/components/LetterAvatar";
import type { Interaction } from "@/lib/api/types";
import { customerPageHref } from "@/lib/customers/customerHrefs";
import { formatShortDate, formatTime } from "@/lib/format/dates";
import { firstLine } from "@/lib/format/firstLine";
import { interactionTypeLabel } from "@/lib/format/labels";
import { interactionEditHref } from "@/lib/interactions/interactionHrefs";
import InteractionTypePill from "./InteractionTypePill";

type InteractionTableProps = {
  interactions: Interaction[];
  /** The current Interactions page URL, so Edit comes back here. */
  returnTo: string;
};

const headerCellClasses = "px-3 pb-3 text-left text-xs font-medium text-muted";

export default function InteractionTable({ interactions, returnTo }: InteractionTableProps) {
  return (
    <div className="-mx-3 overflow-x-auto">
      <table className="w-full min-w-160 border-collapse">
        <thead>
          <tr>
            <th scope="col" className={headerCellClasses}>Type</th>
            <th scope="col" className={headerCellClasses}>Summary</th>
            <th scope="col" className={headerCellClasses}>Customer</th>
            <th scope="col" className={headerCellClasses}>Date</th>
            <th scope="col" className={headerCellClasses}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {interactions.map((interaction) => (
            <tr key={interaction.id} className="border-t border-line">
              <td className="px-3 py-3">
                <InteractionTypePill type={interaction.type} />
              </td>
              <td className="max-w-80 px-3 py-3">
                <p className="truncate text-sm text-ink">{firstLine(interaction.summary)}</p>
              </td>
              <td className="max-w-56 px-3 py-3">
                <Link
                  href={customerPageHref(interaction.customer.id)}
                  className="group flex min-w-0 items-center gap-2 rounded-lg"
                >
                  <LetterAvatar name={interaction.customer.companyName} size="sm" />
                  <span className="truncate text-sm font-medium text-ink group-hover:underline">
                    {interaction.customer.companyName}
                  </span>
                </Link>
              </td>
              <td className="px-3 py-3 text-sm whitespace-nowrap text-muted">
                <time dateTime={interaction.occurredAt}>
                  {formatShortDate(interaction.occurredAt)} · {formatTime(interaction.occurredAt)}
                </time>
              </td>
              <td className="px-3 py-1 text-right">
                <Link
                  href={interactionEditHref(interaction.id, returnTo)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-ink transition-colors duration-150 hover:bg-hover"
                >
                  <Pencil size={16} strokeWidth={1.75} aria-hidden="true" className="text-icon" />
                  Edit
                  <span className="sr-only">
                    {" "}interaction: {firstLine(interaction.summary) || interactionTypeLabel(interaction.type)}
                  </span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
