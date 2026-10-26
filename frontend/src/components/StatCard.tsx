// StatCard: one of the small number boxes at the top of the dashboard
// (e.g. "Total Customers"). Until real data is connected the value is "—".
type StatCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

export default function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-line bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className="text-accent">{icon}</span>
        {label}
      </div>
      <p className="mt-3 text-title font-medium text-ink">{value}</p>
    </div>
  );
}
