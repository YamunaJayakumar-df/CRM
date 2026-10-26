// TableResults: loads and shows the Table view.
//
// Async Server Component, rendered inside <Suspense> by InteractionsBody.
// One backend request for every type together, up to the 100 newest.
// If the list came back full, a note says only the latest 100 are shown.
// Nothing found -> the page's friendly empty state.
// If the backend fails, the error goes to app/error.tsx ("Try again").
import Card from "@/components/Card";
import { listInteractions } from "@/lib/api/queries";
import {
  interactionFiltersFor,
  type InteractionsState,
} from "@/lib/interactions/interactionsView";
import { INTERACTIONS_TABLE_LIMIT, isListCapped } from "@/lib/interactions/kanbanColumns";
import InteractionsEmptyState from "./InteractionsEmptyState";
import InteractionTable from "./InteractionTable";

type TableResultsProps = {
  state: InteractionsState;
};

export default async function TableResults({ state }: TableResultsProps) {
  const interactions = await listInteractions(
    interactionFiltersFor(state, INTERACTIONS_TABLE_LIMIT),
  );

  if (interactions.length === 0) {
    return <InteractionsEmptyState state={state} />;
  }

  return (
    <Card>
      <InteractionTable interactions={interactions} />
      {isListCapped(interactions.length, INTERACTIONS_TABLE_LIMIT) && (
        <p className="mt-4 text-xs text-muted">Showing latest {INTERACTIONS_TABLE_LIMIT}</p>
      )}
    </Card>
  );
}
