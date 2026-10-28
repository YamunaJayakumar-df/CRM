// AI Assistant (/assistant): write a note, check what the AI understood,
// then save it all with one click.
//
// The page needs no data to start, so it is sent at once. Everything else
// happens in AssistantWorkspace (a Client Component), which calls the
// Server Actions in ./actions.ts.
import { Sparkles } from "lucide-react";
import AssistantWorkspace from "@/components/assistant/AssistantWorkspace";
import PageHeader from "@/components/PageHeader";

export default function AssistantPage() {
  return (
    <>
      <PageHeader
        title="AI Assistant"
        subtitle="Tell the CRM what happened. Check what it understood, then save."
        icon={<Sparkles size={22} strokeWidth={1.75} aria-hidden="true" />}
      />
      <AssistantWorkspace />
    </>
  );
}
