// CustomerNotesTab: the "Notes" tab of a customer's page: the customer's
// notes in full. `whitespace-pre-wrap` keeps the line breaks and spacing
// exactly as they were typed. Shows an EmptyState when there are no notes.
import { StickyNote } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import TabSection from "./TabSection";

type CustomerNotesTabProps = {
  notes: string | null;
};

export default function CustomerNotesTab({ notes }: CustomerNotesTabProps) {
  const hasNotes = (notes ?? "").trim() !== "";

  return (
    <TabSection title="Notes">
      {hasNotes ? (
        <p className="text-sm whitespace-pre-wrap break-words text-ink">{notes}</p>
      ) : (
        <EmptyState
          icon={<StickyNote size={28} strokeWidth={1.5} aria-hidden="true" />}
          message="No notes yet"
          hint="Notes about this customer will appear here."
        />
      )}
    </TabSection>
  );
}
