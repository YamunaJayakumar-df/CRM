// FollowUpsTable: the Follow-ups page's table
// (Customer | Task | Due date | Status | Priority | actions), soonest due first.
//
// On narrow screens the table keeps its width and scrolls sideways INSIDE
// the card (overflow-x-auto), so the page itself never scrolls sideways.
// - The customer name opens that customer's side panel on the dashboard.
// - "Mark done" / "Reopen" switches the status in one click and comes back
//   to this exact view (returnTo); "Edit" opens the full form.
import Link from "next/link";
import { Pencil } from "lucide-react";
import LetterAvatar from "@/components/LetterAvatar";
import PriorityBadge from "@/components/PriorityBadge";
import StatusBadge from "@/components/StatusBadge";
import type { FollowUp } from "@/lib/api/types";
import { customerPanelHref } from "@/lib/dashboard/customerPanelView";
import { followUpEditHref } from "@/lib/followUps/followUpHrefs";
import { firstLine } from "@/lib/format/firstLine";
import FollowUpDueDate from "./FollowUpDueDate";
import FollowUpStatusButton from "./FollowUpStatusButton";

type FollowUpsTableProps = {
  followUps: FollowUp[];
  /** Today in India, "YYYY-MM-DD". */
  today: string;
  /** The current Follow-ups page URL, so actions come back here. */
  returnTo: string;
};

const headerCellClasses = "px-3 pb-3 text-left text-xs font-medium text-muted";

export default function FollowUpsTable({ followUps, today, returnTo }: FollowUpsTableProps) {
  return (
    <div className="-mx-3 overflow-x-auto">
      <table className="w-full min-w-180 border-collapse">
        <thead>
          <tr>
            <th scope="col" className={headerCellClasses}>Customer</th>
            <th scope="col" className={headerCellClasses}>Task</th>
            <th scope="col" className={headerCellClasses}>Due date</th>
            <th scope="col" className={headerCellClasses}>Status</th>
            <th scope="col" className={headerCellClasses}>Priority</th>
            <th scope="col" className={headerCellClasses}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {followUps.map((followUp) => {
            const notePreview = firstLine(followUp.notes);

            return (
              <tr key={followUp.id} className="border-t border-line">
                <td className="max-w-56 px-3 py-3">
                  <Link
                    href={customerPanelHref(followUp.customer.id, "all", "")}
                    className="group flex min-w-0 items-center gap-2 rounded-lg"
                  >
                    <LetterAvatar name={followUp.customer.companyName} size="sm" />
                    <span className="truncate text-sm font-medium text-ink group-hover:underline">
                      {followUp.customer.companyName}
                    </span>
                  </Link>
                </td>
                <td className="max-w-72 px-3 py-3">
                  <p className="truncate text-sm text-ink">{followUp.title}</p>
                  {notePreview !== "" && (
                    <p className="truncate text-xs text-muted">{notePreview}</p>
                  )}
                </td>
                <td className="px-3 py-3">
                  <FollowUpDueDate followUp={followUp} today={today} />
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={followUp.status} />
                </td>
                <td className="px-3 py-3">
                  <PriorityBadge priority={followUp.priority} />
                </td>
                <td className="px-3 py-1">
                  <div className="flex items-center justify-end gap-1">
                    <FollowUpStatusButton
                      followUpId={followUp.id}
                      status={followUp.status}
                      title={followUp.title}
                      returnTo={returnTo}
                    />
                    <Link
                      href={followUpEditHref(followUp.id, returnTo)}
                      className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-ink transition-colors duration-150 hover:bg-hover"
                    >
                      <Pencil size={16} strokeWidth={1.75} aria-hidden="true" className="text-icon" />
                      Edit
                      <span className="sr-only"> follow-up: {followUp.title}</span>
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
