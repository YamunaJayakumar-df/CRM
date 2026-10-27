// NotificationBell: the bell in the top bar. It links to the Follow-ups
// page and shows a small red dot when follow-ups are due today or overdue.
// The link opens the most urgent list: Overdue if any, else Due today,
// else the plain page (see dueFollowUpsHref).
//
// The count needs the backend, so it loads inside <Suspense>. The fallback
// is the same bell without a dot, so the top bar never waits and never
// jumps. If the backend fails, the bell also stays without a dot.
// The dot is decoration; the link's label says the number in words.
import { Suspense } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { getDueFollowUpCounts } from "@/lib/api/dueFollowUpCount";
import { dueFollowUpsHref } from "@/lib/followUps/followUpsView";
import { dueFollowUpsLabel } from "@/lib/format/dueFollowUpsLabel";

type BellLinkProps = {
  /** Follow-ups due today or overdue; 0 = no dot. */
  count: number;
  href: string;
};

function BellLink({ count, href }: BellLinkProps) {
  const label = count > 0 ? `Notifications: ${dueFollowUpsLabel(count)}` : "Notifications";

  return (
    <Link
      href={href}
      aria-label={label}
      className="relative flex h-11 w-11 items-center justify-center rounded-xl text-icon transition-colors duration-150 hover:bg-hover"
    >
      <Bell size={20} strokeWidth={1.75} aria-hidden="true" />
      {count > 0 && (
        <span
          className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-danger ring-2 ring-page"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

async function BellWithCount() {
  const counts = await getDueFollowUpCounts();
  if (counts === null) {
    return <BellLink count={0} href="/follow-ups" />;
  }
  return <BellLink count={counts.dueToday + counts.overdue} href={dueFollowUpsHref(counts)} />;
}

export default function NotificationBell() {
  return (
    <Suspense fallback={<BellLink count={0} href="/follow-ups" />}>
      <BellWithCount />
    </Suspense>
  );
}
