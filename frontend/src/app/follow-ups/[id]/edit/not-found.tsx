// Shown when someone opens /follow-ups/<id>/edit for a follow-up that does
// not exist (wrong link, or it was deleted). Next.js uses this file
// whenever the edit page calls notFound().
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";

export default function EditFollowUpNotFound() {
  return (
    <Card>
      <EmptyState
        icon={<CalendarCheck size={28} strokeWidth={1.5} aria-hidden="true" />}
        message="Follow-up not found"
        hint="The link may be wrong, or the follow-up was deleted."
        action={
          <Link
            href="/follow-ups"
            className="inline-flex h-11 items-center rounded-xl border border-line px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-hover"
          >
            Back to follow-ups
          </Link>
        }
      />
    </Card>
  );
}
