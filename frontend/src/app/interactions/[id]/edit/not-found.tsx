// Shown when someone opens /interactions/<id>/edit for an interaction that
// does not exist (wrong link, or it was deleted). Next.js uses this file
// whenever the edit page calls notFound().
import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";

export default function EditInteractionNotFound() {
  return (
    <Card>
      <EmptyState
        icon={<MessagesSquare size={28} strokeWidth={1.5} aria-hidden="true" />}
        message="Interaction not found"
        hint="The link may be wrong, or the interaction was deleted."
        action={
          <Link
            href="/interactions"
            className="inline-flex h-11 items-center rounded-xl border border-line px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-hover"
          >
            Back to interactions
          </Link>
        }
      />
    </Card>
  );
}
