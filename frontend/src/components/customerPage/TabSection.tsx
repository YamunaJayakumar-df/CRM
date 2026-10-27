// PanelSection: one titled block inside the customer panel (e.g. "Contact
// Information", "Interaction History"), with an optional link on the right
// of the title. Like Card, but without its own box: the panel already is
// the box, so sections are separated by space instead of more borders.
type PanelSectionProps = {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export default function PanelSection({ title, action, children }: PanelSectionProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-base font-medium text-ink">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
