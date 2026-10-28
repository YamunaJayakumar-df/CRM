// FollowUpsTableSkeleton: placeholder rows inside a card, shown while the
// follow-ups table loads.
import Card from "@/components/Card";
import ListSkeleton from "@/components/dashboard/ListSkeleton";

export default function FollowUpsTableSkeleton() {
  return (
    <Card>
      <ListSkeleton label="Loading follow-ups…" rows={6} />
    </Card>
  );
}
