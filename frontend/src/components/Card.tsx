// Card: the soft white box used to group content on a page.
// Optional `title` shows a heading at the top (with an optional `icon`
// before it); optional `action` puts something on the right of that
// heading (e.g. a "View all" link).
type CardProps = {
  title?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export default function Card({ title, icon, action, children }: CardProps) {
  const hasHeader = title !== undefined || action !== undefined;

  return (
    // min-w-0 lets a card inside a grid shrink on phones, so wide content
    // (like a table) scrolls inside the card instead of widening the page.
    <section className="min-w-0 rounded-xl border border-line bg-card p-6 shadow-soft">
      {hasHeader && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && (
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              {icon && <span className="text-icon">{icon}</span>}
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
