// KanbanBoardFrame: the outer layout of the Kanban board, shared by the
// real board and its loading skeleton so both line up exactly.
//
// Four columns side by side, each at least 14rem (224px) wide. On narrow
// screens they do not fit, so the board scrolls sideways INSIDE this frame
// (overflow-x-auto); the page itself never scrolls sideways. From xl up all
// four fit. `items-start` lets each column be only as tall as its cards.
type KanbanBoardFrameProps = {
  label: string;
  children: React.ReactNode;
};

/** The look of one column: a soft, slightly darker rounded panel. */
export const KANBAN_COLUMN_CLASSES =
  "flex min-w-0 flex-col rounded-xl border border-line bg-sidebar p-3";

export default function KanbanBoardFrame({ label, children }: KanbanBoardFrameProps) {
  return (
    <section aria-label={label} className="overflow-x-auto pb-2">
      <div className="grid grid-cols-[repeat(4,minmax(14rem,1fr))] items-start gap-4">
        {children}
      </div>
    </section>
  );
}
