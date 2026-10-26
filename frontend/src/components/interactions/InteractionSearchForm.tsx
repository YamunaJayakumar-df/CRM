// InteractionSearchForm: the "Search interactions…" box.
//
// A GET form: pressing Enter goes to /interactions?q=<text>. The current
// view, date range and customer filter are kept in hidden fields (only
// when they differ from the default, so URLs stay short). next/form's
// <Form> works like a normal <form> but swaps the page without a full
// reload. When a search is active, "Clear" removes only the search text.
import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  DEFAULT_INTERACTIONS_STATE,
  interactionsHref,
  type InteractionsState,
} from "@/lib/interactions/interactionsView";

type InteractionSearchFormProps = {
  state: InteractionsState;
};

export default function InteractionSearchForm({ state }: InteractionSearchFormProps) {
  const defaults = DEFAULT_INTERACTIONS_STATE;

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <Form action="/interactions" scroll={false} role="search" className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
        {state.view !== defaults.view && <input type="hidden" name="view" value={state.view} />}
        {state.range !== defaults.range && <input type="hidden" name="range" value={state.range} />}
        {state.customerId !== null && (
          <input type="hidden" name="customerId" value={state.customerId} />
        )}
        <label htmlFor="interaction-search" className="sr-only">
          Search interactions
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
          id="interaction-search"
          name="q"
          type="search"
          defaultValue={state.search}
          maxLength={100}
          placeholder="Search interactions…"
          className="h-11 w-full rounded-xl border border-line bg-card pr-3 pl-9 text-sm text-ink placeholder:text-muted"
        />
      </Form>
      {state.search !== "" && (
        <Link
          href={interactionsHref({ ...state, search: "" })}
          scroll={false}
          className="inline-flex h-11 shrink-0 items-center rounded-xl px-3 text-sm font-medium text-accent hover:bg-hover"
        >
          Clear
        </Link>
      )}
    </div>
  );
}
