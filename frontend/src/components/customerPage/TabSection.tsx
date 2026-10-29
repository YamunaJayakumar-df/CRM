// TabSection: the titled content of one customer-page tab (e.g.
// "Interactions", "Notes"), with an optional link on the right of the
// title. Like Card, but without its own box: the page puts it inside a
// Card already, so it does not draw a second border.
type TabSectionProps = {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export default function TabSection({ title, action, children }: TabSectionProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
