// InteractionsBody: everything under the Interactions page title.
//
// 1. Reads the filters from the URL (view, range, search, customer).
//    `searchParams` is a Promise in Next 16; we await it HERE, inside the
//    page's <Suspense>, so the page title can still be sent at once.
// 2. Shows the toolbar straight away (it needs only the URL).
// 3. Loads the Kanban board or the table inside its own <Suspense>. Its
//    `key` is the current filter, so changing a filter shows the loading
//    skeleton instead of leaving the old results on screen.
import { Suspense } from "react";
import {
  interactionsStateKey,
  readInteractionsState,
  type InteractionsSearchParams,
} from "@/lib/interactions/interactionsView";
import InteractionsToolbar from "./InteractionsToolbar";
import InteractionTableSkeleton from "./InteractionTableSkeleton";
import KanbanBoardSkeleton from "./KanbanBoardSkeleton";
import KanbanResults from "./KanbanResults";
import TableResults from "./TableResults";

type InteractionsBodyProps = {
  searchParams: Promise<InteractionsSearchParams>;
};

export default async function InteractionsBody({ searchParams }: InteractionsBodyProps) {
  const state = readInteractionsState(await searchParams);
  const isTable = state.view === "table";

  return (
    <>
      <InteractionsToolbar state={state} />
      <Suspense
        key={interactionsStateKey(state)}
        fallback={isTable ? <InteractionTableSkeleton /> : <KanbanBoardSkeleton />}
      >
        {isTable ? <TableResults state={state} /> : <KanbanResults state={state} />}
      </Suspense>
    </>
  );
}
