// CustomerSearchForm: the "Search customers…" box on the Customers page.
//
// A GET form: pressing Enter goes to /customers?q=<text>. next/form's <Form>
// works like a normal <form> but swaps the page without a full reload.
// When a search is active, "Clear" goes back to the full list.
import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import { customersListHref } from "@/lib/customers/customerHrefs";

type CustomerSearchFormProps = {
  search: string;
};

export default function CustomerSearchForm({ search }: CustomerSearchFormProps) {
  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <Form
        action="/customers"
        scroll={false}
        role="search"
        className="relative min-w-0 flex-1 sm:w-80 sm:flex-none"
      >
        <label htmlFor="customer-search" className="sr-only">
          Search customers
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          size={16}
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <input
          // `key` resets the box when the search in the URL changes
          // (e.g. after "Clear"), because defaultValue is only read once.
          key={search}
          id="customer-search"
          name="q"
          type="search"
          defaultValue={search}
          maxLength={100}
          placeholder="Search customers…"
          className="h-11 w-full rounded-xl border border-line bg-card pr-3 pl-9 text-sm text-ink placeholder:text-muted"
        />
      </Form>
      {search !== "" && (
        <Link
          href={customersListHref("")}
          scroll={false}
          className="inline-flex h-11 shrink-0 items-center rounded-xl px-3 text-sm font-medium text-accent hover:bg-hover"
        >
          Clear
        </Link>
      )}
    </div>
  );
}
