// InteractionsEmptyState: what the page shows when nothing at all matches
// the current filters, e.g. "No interactions in this period" with a hint
// to pick a longer date range. Used by both the Kanban and Table views.
import { MessagesSquare } from "lucide-react";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import {
  interactionsEmptyText,
  type InteractionsState,
} from "@/lib/interactions/interactionsView";

type InteractionsEmptyStateProps = {
  state: InteractionsState;
};

export default function InteractionsEmptyState({ state }: InteractionsEmptyStateProps) {
  const { message, hint } = interactionsEmptyText(state);

  return (
    <Card>
      <EmptyState
        icon={<MessagesSquare size={28} strokeWidth={1.5} aria-hidden="true" />}
        message={message}
        hint={hint}
      />
    </Card>
  );
}
