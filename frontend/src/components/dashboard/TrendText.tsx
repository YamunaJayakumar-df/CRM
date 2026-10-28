// TrendText: the small "↑ 4 vs last week" line on a stat card.
// The arrow and number are coloured (green up, red down, grey for 0) and the
// rest of the sentence stays grey. The arrow and the words carry the meaning
// too, so it never depends on colour alone.
import { ArrowDown, ArrowUp } from "lucide-react";

type TrendTextProps = {
  direction: "up" | "down";
  amount: number;
  /** Words after the number, e.g. "this week" or "vs last week". */
  suffix: string;
};

export default function TrendText({ direction, amount, suffix }: TrendTextProps) {
  let colour = "text-muted";
  if (amount > 0) {
    colour = direction === "up" ? "text-done-ink" : "text-danger";
  }
  const Arrow = direction === "up" ? ArrowUp : ArrowDown;

  return (
    <p className="flex items-center gap-1">
      <span className={`inline-flex items-center gap-0.5 font-medium ${colour}`}>
        <Arrow size={14} strokeWidth={2} aria-hidden="true" />
        {/* Screen readers hear "up 4" / "down 2" instead of an unnamed arrow. */}
        <span className="sr-only">{direction === "up" ? "up" : "down"}</span>
        {amount}
      </span>
      {suffix}
    </p>
  );
}
