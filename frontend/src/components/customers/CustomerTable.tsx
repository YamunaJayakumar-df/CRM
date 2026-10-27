// CustomerTable: the customer list as a table
// (Company | Contact | Email | Phone | Industry | Status | Edit).
//
// - The company name opens that customer's side panel on THIS page
//   (/customers?customer=12), keeping the search.
// - "Edit" opens the Edit page; `returnTo` brings the user back to this
//   list (with the same search) after saving or cancelling.
// - On narrow screens the table keeps its width and scrolls sideways INSIDE
//   the card (overflow-x-auto), so the page itself never scrolls sideways.
import Link from "next/link";
import CustomerStatusBadge from "@/components/CustomerStatusBadge";
import LetterAvatar from "@/components/LetterAvatar";
import type { Customer } from "@/lib/api/types";
import { customerPanelLink, type PanelPlace } from "@/lib/customerPanel/panelPlace";
import { customerEditHref } from "@/lib/customers/customerHrefs";
import { displayWebsite } from "@/lib/format/safeWebsiteUrl";
import EmptyCell from "./EmptyCell";

type CustomerTableProps = {
  customers: Customer[];
  /** This page and its search, so the company links open the panel here. */
  panelPlace: PanelPlace;
  /** The list URL to come back to after editing, e.g. "/customers?q=acme". */
  returnTo: string;
};

const headerCellClasses = "px-3 pb-3 text-left text-xs font-medium text-muted";
const cellClasses = "px-3 py-3 text-sm text-ink";

/** A table cell showing optional text, or a quiet "—" when there is none. */
function TextCell({ value }: { value: string | null }) {
  return (
    <td className={`max-w-56 ${cellClasses}`}>
      {value ? <span className="block truncate">{value}</span> : <EmptyCell />}
    </td>
  );
}

export default function CustomerTable({ customers, panelPlace, returnTo }: CustomerTableProps) {
  return (
    <div className="-mx-3 overflow-x-auto">
      <table className="w-full min-w-200 border-collapse">
        <thead>
          <tr>
            <th scope="col" className={headerCellClasses}>Company</th>
            <th scope="col" className={headerCellClasses}>Contact</th>
            <th scope="col" className={headerCellClasses}>Email</th>
            <th scope="col" className={headerCellClasses}>Phone</th>
            <th scope="col" className={headerCellClasses}>Industry</th>
            <th scope="col" className={headerCellClasses}>Status</th>
            <th scope="col" className={headerCellClasses}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => {
            const website = displayWebsite(customer.website);
            return (
              <tr key={customer.id} className="border-t border-line">
                <td className="max-w-72 px-3 py-3">
                  <Link
                    href={customerPanelLink(panelPlace, customer.id)}
                    // Keep the list where it is; the panel opens beside it.
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
                <TextCell value={customer.contactName} />
                <TextCell value={customer.email} />
                <td className={`whitespace-nowrap ${cellClasses}`}>
                  {customer.phone ? customer.phone : <EmptyCell />}
                </td>
                <TextCell value={customer.industry} />
                <td className="px-3 py-3">
                  <CustomerStatusBadge status={customer.status} />
                </td>
                <td className="px-3 py-1 text-right">
                  <Link
                    href={customerEditHref(customer.id, returnTo)}
                    className="inline-flex h-11 items-center rounded-xl px-3 text-sm font-medium text-accent transition-colors duration-150 hover:bg-hover"
                  >
                    Edit<span className="sr-only"> {customer.companyName}</span>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
