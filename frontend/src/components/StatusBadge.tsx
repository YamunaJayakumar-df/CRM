// StatusBadge: a small coloured pill showing a follow-up's status.
// The word ("Open" / "Done") is always shown, so the meaning never
// depends on colour alone. Status values match the backend: OPEN | DONE.
type StatusBadgeProps = {
  status: "OPEN" | "DONE";
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const isOpen = status === "OPEN";
  const label = isOpen ? "Open" : "Done";
  const colours = isOpen
    ? "bg-open-bg text-open-ink"
    : "bg-done-bg text-done-ink";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colours}`}
    >
      {label}
    </span>
  );
}
