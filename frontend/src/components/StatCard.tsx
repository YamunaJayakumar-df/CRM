// StatCard: one of the four number boxes at the top of the dashboard
// (e.g. "Total Customers"). Shows an icon in a soft tinted square next to
// the label, a big semibold number, one short line of context (the
// `trend`), and an optional small chart in the bottom-right corner.
// It only lays things out; the dashboard decides what goes in each slot.
type StatCardTone = "primary" | "red";

type StatCardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
  /** Colour of the icon circle. "red" is for things that need attention. */
  tone?: StatCardTone;
  /** One short line under the number, e.g. "3 due this week". */
  trend: React.ReactNode;
  /** Optional small chart (e.g. a Sparkline), shown bottom-right. */
  chart?: React.ReactNode;
};

// Full class names are written out so Tailwind can find them.
const toneClasses: Record<StatCardTone, string> = {
  primary: "bg-primary-soft text-primary",
  red: "bg-high-bg text-high-ink",
};

export default function StatCard({
  label,
  value,
  icon,
  tone = "primary",
  trend,
  chart,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-line bg-card p-5 shadow-soft">
      {/* Header: icon and label side by side, like a small card title. */}
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          {icon}
        </span>
        <p className="text-sm font-medium text-muted">{label}</p>
      </div>

      {/* Number and chart share a row; the chart may shrink on narrow cards. */}
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-stat font-semibold text-ink">{value}</p>
        {chart && <div className="h-10 w-24 min-w-0 shrink">{chart}</div>}
      </div>
      {/* The trend text gets its own line so it never wraps word by word. */}
      <div className="mt-2 truncate text-sm text-muted">{trend}</div>
    </div>
  );
}
