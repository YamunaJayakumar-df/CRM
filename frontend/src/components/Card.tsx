// Card: the soft white box used to group content on a page.
// Optional `title` shows a heading at the top; optional `action` puts
// something on the right of that heading (e.g. a "View all" link).
type CardProps = {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export default function Card({ title, action, children }: CardProps) {
  const hasHeader = title !== undefined || action !== undefined;

  return (
    <section className="rounded-xl border border-line bg-card p-6 shadow-soft">
      {hasHeader && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <h2 className="text-lg font-medium text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
