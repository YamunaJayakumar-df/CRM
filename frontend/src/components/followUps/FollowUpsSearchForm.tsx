// FollowUpsSearchForm: the "Search follow-ups…" box (title or company).
//
// Same as InteractionSearchForm: a GET form, so pressing Enter goes to
// /follow-ups?q=<text>. The current view and customer filter are kept in
// hidden fields (only when they differ from the default, so URLs stay
// short). next/form's <Form> swaps the page without a full reload. When a
// search is active, "Clear" removes only the search text.
import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  DEFAULT_FOLLOW_UPS_STATE,
  followUpsHref,
  type FollowUpsState,
} from "@/lib/followUps/followUpsView";

type FollowUpsSearchFormProps = {
  state: FollowUpsState;
};

export default function FollowUpsSearchForm({ state }: FollowUpsSearchFormProps) {
  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <Form action="/follow-ups" scroll={false} role="search" className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
        {state.view !== DEFAULT_FOLLOW_UPS_STATE.view && (
          <input type="hidden" name="view" value={state.view} />
        )}
        {state.customerId !== null && (
          <input type="hidden" name="customerId" value={state.customerId} />
        )}
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
          key={state.search}
          id="follow-up-search"
          name="q"
          type="search"
          defaultValue={state.search}
          maxLength={100}
          placeholder="Search follow-ups…"
          className="h-11 w-full rounded-xl border border-line bg-card pr-3 pl-9 text-sm text-ink placeholder:text-muted"
        />
      </Form>
      {state.search !== "" && (
        <Link
          href={followUpsHref({ ...state, search: "" })}
          scroll={false}
          className="inline-flex h-11 shrink-0 items-center rounded-xl px-3 text-sm font-medium text-accent hover:bg-hover"
        >
          Clear
        </Link>
      )}
    </div>
  );
}
