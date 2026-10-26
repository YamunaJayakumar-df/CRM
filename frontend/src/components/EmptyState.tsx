// EmptyState: what a list shows when it has nothing in it yet.
// A friendly icon and a short message are clearer than a blank box.
type EmptyStateProps = {
  icon: React.ReactNode;
  message: string;
  hint?: string;
};

export default function EmptyState({ icon, message, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <span className="text-accent">{icon}</span>
      <p className="mt-3 text-base text-ink">{message}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}
