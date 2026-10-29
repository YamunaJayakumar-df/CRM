// TrendText: the small "↑ 4 vs last week" line on a stat card.
// The arrow and number sit in a small coloured chip (green up, red down,
// grey for 0) and the rest of the sentence stays grey. The arrow and the
// words carry the meaning too, so it never depends on colour alone.
import { ArrowDown, ArrowUp } from "lucide-react";

type TrendTextProps = {
  direction: "up" | "down";
  amount: number;
  /** Words after the number, e.g. "this week" or "vs last week". */
  suffix: string;
};

export default function TrendText({ direction, amount, suffix }: TrendTextProps) {
  let chip = "bg-hover text-muted";
  if (amount > 0) {
    chip = direction === "up" ? "bg-done-bg text-done-ink" : "bg-high-bg text-high-ink";
  }
  const Arrow = direction === "up" ? ArrowUp : ArrowDown;

  return (
    <p className="flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold ${chip}`}>
        <Arrow size={14} strokeWidth={2} aria-hidden="true" />
        {/* Screen readers hear "up 4" / "down 2" instead of an unnamed arrow. */}
        <span className="sr-only">{direction === "up" ? "up" : "down"}</span>
        {amount}
      </span>
      {suffix}
    </p>
  );
}
