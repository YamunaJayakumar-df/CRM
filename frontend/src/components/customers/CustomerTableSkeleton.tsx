// CustomerTableSkeleton: placeholder rows inside a card, shown while the
// customer list loads.
import Card from "@/components/Card";
import ListSkeleton from "@/components/dashboard/ListSkeleton";

export default function CustomerTableSkeleton() {
  return (
    <Card>
      <ListSkeleton label="Loading customers…" rows={6} />
    </Card>
  );
}
