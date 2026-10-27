// EmptyCell: what a table cell shows when a value is missing.
// Sighted users see a quiet "—"; screen readers hear "Not set" instead of
// "em dash".
export default function EmptyCell() {
  return (
    <span className="text-muted">
      <span aria-hidden="true">—</span>
      <span className="sr-only">Not set</span>
    </span>
  );
}
