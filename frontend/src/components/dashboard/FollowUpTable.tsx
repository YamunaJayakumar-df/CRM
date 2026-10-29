// FollowUpTable: the follow-ups list on the dashboard as a table
// (Customer | Task | Due date | Status | Priority | actions).
//
// On narrow screens the table keeps its width and scrolls sideways INSIDE
// the card (overflow-x-auto), so the page itself never scrolls sideways.
// Clicking a customer opens that customer's page on its Follow-ups tab (/customers/12?tab=follow-ups).
// The last column has two small icons: a check to mark an open follow-up
// done in one click, and a pencil to edit it. Both come back to this exact
// dashboard view (returnTo).
import Link from "next/link";
import LetterAvatar from "@/components/LetterAvatar";
import PriorityBadge from "@/components/PriorityBadge";
import StatusBadge from "@/components/StatusBadge";
import EditFollowUpIconLink from "@/components/followUps/EditFollowUpIconLink";
import FollowUpDueDate from "@/components/followUps/FollowUpDueDate";
import FollowUpStatusButton from "@/components/followUps/FollowUpStatusButton";
import type { FollowUp } from "@/lib/api/types";
import { customerPageHref } from "@/lib/customers/customerHrefs";
import { followUpEditHref } from "@/lib/followUps/followUpHrefs";
import { firstLine } from "@/lib/format/firstLine";
import { displayWebsite } from "@/lib/format/safeWebsiteUrl";

type FollowUpTableProps = {
  followUps: FollowUp[];
  /** Today in India, "YYYY-MM-DD" (from the dashboard summary). */
  today: string;
  /** The current dashboard URL, so Edit and Mark done come back here. */
  returnTo: string;
};

const headerCellClasses = "px-3 pb-3 text-left text-xs font-medium text-muted";

export default function FollowUpTable({
  followUps,
  today,
  returnTo,
}: FollowUpTableProps) {
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
            <FollowUpRow
              key={followUp.id}
              followUp={followUp}
              today={today}
              customerHref={customerPageHref(followUp.customer.id, "follow-ups")}
              returnTo={returnTo}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

type FollowUpRowProps = {
  followUp: FollowUp;
  today: string;
  /** Opens this customer's page. */
  customerHref: string;
  /** The current dashboard URL. */
  returnTo: string;
};

/** One table row. Kept in this file because only this table uses it. */
function FollowUpRow({ followUp, today, customerHref, returnTo }: FollowUpRowProps) {
  const { customer } = followUp;
  const website = displayWebsite(customer.website);
  const notePreview = firstLine(followUp.notes);

  return (
    <tr className="border-t border-line">
      <td className="max-w-56 px-3 py-3">
        <Link
          href={customerHref}
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
        <div className="flex items-center justify-end">
          {followUp.status === "OPEN" && (
            <FollowUpStatusButton
              followUpId={followUp.id}
              status={followUp.status}
              title={followUp.title}
              returnTo={returnTo}
              look="icon"
            />
          )}
          <EditFollowUpIconLink href={followUpEditHref(followUp.id, returnTo)} title={followUp.title} />
        </div>
      </td>
    </tr>
  );
}
