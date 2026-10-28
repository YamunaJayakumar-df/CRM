// ViewToggle: "Table | Kanban", switching ?view= while keeping every
// other filter. Kanban is the default, so its link leaves ?view out.
import { Rows3, SquareKanban } from "lucide-react";
import SegmentedLinks from "@/components/SegmentedLinks";
import {
  INTERACTIONS_VIEW_LABELS,
  INTERACTIONS_VIEWS,
  interactionsHref,
  type InteractionsState,
  type InteractionsView,
} from "@/lib/interactions/interactionsView";

type ViewToggleProps = {
  state: InteractionsState;
};

const iconProps = { size: 16, strokeWidth: 1.75, "aria-hidden": true } as const;

const icons: Record<InteractionsView, React.ReactNode> = {
  table: <Rows3 {...iconProps} />,
  kanban: <SquareKanban {...iconProps} />,
};

export default function ViewToggle({ state }: ViewToggleProps) {
  return (
    <SegmentedLinks
      ariaLabel="View"
      options={INTERACTIONS_VIEWS.map((view) => ({
        key: view,
        href: interactionsHref({ ...state, view }),
        active: view === state.view,
        icon: icons[view],
        label: INTERACTIONS_VIEW_LABELS[view],
      }))}
    />
  );
}
