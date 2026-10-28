// FollowUpSearchForm: the small "Search follow-ups…" box in the
// Upcoming Follow-ups card.
//
// A GET form: pressing Enter goes to /?fq=<text> (plus the current chip,
// kept in a hidden field), and the server renders the matching list.
// next/form's <Form> is part of Next.js (no extra package): it does the
// same as a normal <form>, but swaps the page without a full reload.
// When a search is active, a "Clear" link goes back to the same chip
// without search text.
import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import { followUpViewHref, type FollowUpChip } from "@/lib/dashboard/followUpView";

type FollowUpSearchFormProps = {
  chip: FollowUpChip;
  search: string;
};

export default function FollowUpSearchForm({ chip, search }: FollowUpSearchFormProps) {
  return (
    <div className="flex items-center gap-2">
      <Form action="/" scroll={false} role="search" className="relative min-w-0 flex-1 lg:w-64 lg:flex-none">
        {chip !== "all" && <input type="hidden" name="fu" value={chip} />}
        <label htmlFor="follow-up-search" className="sr-only">
          Search follow-ups
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
          id="follow-up-search"
          name="fq"
          type="search"
          defaultValue={search}
          maxLength={100}
          placeholder="Search follow-ups…"
          className="h-11 w-full rounded-xl border border-line bg-card pr-3 pl-9 text-sm text-ink placeholder:text-muted"
        />
      </Form>
      {search !== "" && (
        <Link
          href={followUpViewHref(chip, "")}
          scroll={false}
          className="inline-flex h-11 shrink-0 items-center rounded-xl px-3 text-sm font-medium text-accent hover:bg-hover"
        >
          Clear
        </Link>
      )}
    </div>
  );
}
