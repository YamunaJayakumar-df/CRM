// FollowUpTable: the follow-ups list on the dashboard as a table
// (Customer | Task | Due date | Status | Priority | actions).
//
// On narrow screens the table keeps its width and scrolls sideways INSIDE
// the card (overflow-x-auto), so the page itself never scrolls sideways.
import Link from "next/link";
import { EllipsisVertical, TriangleAlert } from "lucide-react";
import LetterAvatar from "@/components/LetterAvatar";
import PriorityBadge from "@/components/PriorityBadge";
import StatusBadge from "@/components/StatusBadge";
import type { FollowUp } from "@/lib/api/types";
import { formatDueDate, isOverdue } from "@/lib/format/dates";
import { firstLine } from "@/lib/format/firstLine";
import { displayWebsite } from "@/lib/format/safeWebsiteUrl";

type FollowUpTableProps = {
  followUps: FollowUp[];
  /** Today in India, "YYYY-MM-DD" (from the dashboard summary). */
  today: string;
};

const headerCellClasses = "px-3 pb-3 text-left text-xs font-medium text-muted";

export default function FollowUpTable({ followUps, today }: FollowUpTableProps) {
  return (
    <div className="-mx-3 overflow-x-auto">
      <table className="w-full min-w-160 border-collapse">
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
          {followUps.map((followUp) => (
            <FollowUpRow key={followUp.id} followUp={followUp} today={today} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

type FollowUpRowProps = {
  followUp: FollowUp;
  today: string;
};

/** One table row. Kept in this file because only this table uses it. */
function FollowUpRow({ followUp, today }: FollowUpRowProps) {
  const { customer } = followUp;
  const website = displayWebsite(customer.website);
  const notePreview = firstLine(followUp.notes);

  // Only OPEN follow-ups can be late; a DONE one with an old date is fine.
  const isOpen = followUp.status === "OPEN";
  const late = isOpen && isOverdue(followUp.dueDate, today);
  const dueToday = isOpen && followUp.dueDate === today;
  const dueColour = late || dueToday ? "font-medium text-danger" : "text-ink";

  return (
    <tr className="border-t border-line">
      <td className="max-w-56 px-3 py-3">
        {/*
          Opens the customer side panel (?customer=12). The panel itself
          comes in the next step; for now the link only changes the URL.
        */}
        <Link
          href={`/?customer=${customer.id}`}
          scroll={false}
          className="group flex min-w-0 items-center gap-3 rounded-lg"
        >
          <LetterAvatar name={customer.companyName} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-ink group-hover:underline">
              {customer.companyName}
            </span>
            {website !== "" && (
              <span className="block truncate text-xs text-muted">{website}</span>
            )}
          </span>
        </Link>
      </td>
      <td className="max-w-64 px-3 py-3">
        <p className="truncate text-sm text-ink">{followUp.title}</p>
        {notePreview !== "" && <p className="truncate text-xs text-muted">{notePreview}</p>}
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 text-sm ${dueColour}`}>
          {late && <TriangleAlert size={14} strokeWidth={2} aria-hidden="true" />}
          <time dateTime={followUp.dueDate}>{formatDueDate(followUp.dueDate, today)}</time>
          {/* Said in words too, so "late" never depends on the red colour alone. */}
          {late && <span className="sr-only">(overdue)</span>}
        </span>
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={followUp.status} />
      </td>
      <td className="px-3 py-3">
        <PriorityBadge priority={followUp.priority} />
      </td>
      <td className="px-3 py-3 text-right">
        {/*
          Row actions menu (edit, mark done, ...) comes in a later step.
          Disabled until then so it does not look like it works.
        */}
        <button
          type="button"
          disabled
          aria-label={`More actions for ${followUp.title} (coming soon)`}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-icon disabled:opacity-50"
        >
          <EllipsisVertical size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}
