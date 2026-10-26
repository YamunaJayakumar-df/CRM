// Interactions (/interactions): calls, emails and meetings with customers.
// Placeholder for now; the real list is loaded in a later step.
import { MessagesSquare } from "lucide-react";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";

export default function InteractionsPage() {
  return (
    <>
      <PageHeader
        title="Interactions"
        subtitle="Calls, emails, and meetings with your customers."
      />
      <Card>
        <EmptyState
          icon={
            <MessagesSquare size={28} strokeWidth={1.5} aria-hidden="true" />
          }
          message="Interactions will appear here"
          hint="Each call, email, or meeting you log will be listed here."
        />
      </Card>
    </>
  );
}
