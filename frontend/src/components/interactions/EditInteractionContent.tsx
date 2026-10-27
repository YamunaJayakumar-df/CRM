// EditInteractionContent: loads one interaction and shows the Edit form
// plus the Danger zone (delete).
//
// Async Server Component, rendered inside <Suspense> by the edit page.
// - The id is checked BEFORE calling the backend ("abc", "0" -> not found).
// - ?returnTo is only used if it is a safe path inside this app. Cancel,
//   Save and Delete all go there, or to the Interactions page.
// - Backend failures other than "not found" go to app/error.tsx.
import { notFound } from "next/navigation";
import { updateInteraction } from "@/app/interactions/actions";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import { getInteraction } from "@/lib/api/queries";
import { readCustomerId } from "@/lib/dashboard/customerPanelView";
import { firstValue, type SearchParamValue } from "@/lib/dashboard/followUpView";
import { safeReturnPath } from "@/lib/forms/safeReturnPath";
import { interactionToFormValues } from "@/lib/interactions/interactionForm";
import DeleteInteractionSection from "./DeleteInteractionSection";
import InteractionForm from "./InteractionForm";

type EditInteractionContentProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, SearchParamValue>>;
};

export default async function EditInteractionContent({
  params,
  searchParams,
}: EditInteractionContentProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);

  // Interaction ids follow the same rules as customer ids (digits, in range).
  const interactionId = readCustomerId(id);
  if (interactionId === null) {
    notFound();
  }
  const interaction = await getInteraction(interactionId);
  if (interaction === null) {
    notFound();
  }

  const returnTo = safeReturnPath(firstValue(query.returnTo));

  return (
    <>
      <PageHeader title="Edit interaction" subtitle={interaction.customer.companyName} />
      <div className="max-w-2xl">
        <Card>
          <InteractionForm
            mode="edit"
            action={updateInteraction}
            initialValues={interactionToFormValues(interaction)}
            customers={[interaction.customer]}
            interactionId={interaction.id}
            returnTo={returnTo}
            cancelHref={returnTo ?? "/interactions"}
          />
        </Card>
        <DeleteInteractionSection interactionId={interaction.id} returnTo={returnTo} />
      </div>
    </>
  );
}
