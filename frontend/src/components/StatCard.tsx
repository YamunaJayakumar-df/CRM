// StatCard: one of the four number boxes at the top of the dashboard
// (e.g. "Total Customers"). Shows an icon in a soft tinted circle, a label,
// a big number, one short line of context (the `trend`), and an optional
// small chart in the bottom-right corner.
// It only lays things out; the dashboard decides what goes in each slot.
type StatCardTone = "blue" | "red";

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
  blue: "bg-avatar-blue text-avatar-blue-ink",
  red: "bg-high-bg text-high-ink",
};

export default function StatCard({
  label,
  value,
  icon,
  tone = "blue",
  trend,
  chart,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-line bg-card p-5 shadow-soft">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full ${toneClasses[tone]}`}
      >
        {icon}
      </span>
      <p className="mt-4 text-sm text-muted">{label}</p>

      <div className="mt-1 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-title font-medium text-ink">{value}</p>
          <div className="mt-1 text-sm text-muted">{trend}</div>
        </div>
        {chart && <div className="h-10 w-24 shrink-0">{chart}</div>}
      </div>
    </div>
  );
}
