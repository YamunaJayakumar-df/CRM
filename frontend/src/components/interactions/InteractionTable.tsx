// InteractionTable: the Table view of interactions
// (Type | Summary | Customer | Date), newest first.
//
// On narrow screens the table keeps its width and scrolls sideways INSIDE
// the card (overflow-x-auto), so the page itself never scrolls sideways.
// The customer name opens that customer's side panel on the dashboard.
import Link from "next/link";
import LetterAvatar from "@/components/LetterAvatar";
import type { Interaction } from "@/lib/api/types";
import { customerPanelHref } from "@/lib/dashboard/customerPanelView";
import { formatShortDate, formatTime } from "@/lib/format/dates";
import { firstLine } from "@/lib/format/firstLine";
import InteractionTypePill from "./InteractionTypePill";

type InteractionTableProps = {
  interactions: Interaction[];
};

const headerCellClasses = "px-3 pb-3 text-left text-xs font-medium text-muted";

export default function InteractionTable({ interactions }: InteractionTableProps) {
  return (
    <div className="-mx-3 overflow-x-auto">
      <table className="w-full min-w-160 border-collapse">
        <thead>
          <tr>
            <th scope="col" className={headerCellClasses}>Type</th>
            <th scope="col" className={headerCellClasses}>Summary</th>
            <th scope="col" className={headerCellClasses}>Customer</th>
            <th scope="col" className={headerCellClasses}>Date</th>
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
                  href={customerPanelHref(interaction.customer.id, "all", "")}
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
