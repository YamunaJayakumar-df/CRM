// The look of every data table (Customers, Interactions, Follow-ups and the
// dashboard's Upcoming Follow-ups), in one place.
//
// - Header: a light grey band with small uppercase labels (rounded at the
//   ends), so the columns are easy to find.
// - Rows: a thin line between rows and a soft highlight under the mouse.
// Full class names are written out so Tailwind can find them.

/** A <th> in the header row. */
export const HEADER_CELL_CLASSES =
  "bg-table-head px-3 py-2.5 text-left text-xs font-medium tracking-wide text-muted uppercase first:rounded-l-lg last:rounded-r-lg";

/** A <tr> in the body. */
export const BODY_ROW_CLASSES = "border-t border-line transition-colors duration-150 hover:bg-hover/60";
