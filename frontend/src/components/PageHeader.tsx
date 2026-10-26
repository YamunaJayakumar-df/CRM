// PageHeader: the title at the top of each page, with an optional
// subtitle underneath, an optional icon before the title, and optional
// content on the right (e.g. the date or a button).
type PageHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
};

export default function PageHeader({
  title,
  subtitle,
  icon,
  right,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          {icon && <span className="text-accent">{icon}</span>}
          <h1 className="text-title font-medium text-ink">{title}</h1>
        </div>
        {subtitle && <p className="mt-1 text-base text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
