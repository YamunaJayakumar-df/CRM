// InteractionTableSkeleton: placeholder rows inside a card, shown while
// the Table view loads.
import Card from "@/components/Card";
import ListSkeleton from "@/components/dashboard/ListSkeleton";

export default function InteractionTableSkeleton() {
  return (
    <Card>
      <ListSkeleton label="Loading interactions…" rows={6} />
    </Card>
  );
}
