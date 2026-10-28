// EditFollowUpContent: loads one follow-up and shows the Edit form plus the
// Danger zone (delete).
//
// Async Server Component, rendered inside <Suspense> by the edit page.
// - The id is checked BEFORE calling the backend ("abc", "0" -> not found).
// - ?returnTo is only used if it is a safe path inside this app. Cancel,
//   Save and Delete all go there, or to the Follow-ups page.
// - Backend failures other than "not found" go to app/error.tsx.
import { notFound } from "next/navigation";
import { updateFollowUp } from "@/app/follow-ups/actions";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import { getFollowUp } from "@/lib/api/queries";
import { readCustomerId } from "@/lib/customers/customerPageView";
import { firstValue, type SearchParamValue } from "@/lib/dashboard/followUpView";
import { followUpToFormValues } from "@/lib/followUps/followUpForm";
import { safeReturnPath } from "@/lib/forms/safeReturnPath";
import DeleteFollowUpSection from "./DeleteFollowUpSection";
import FollowUpForm from "./FollowUpForm";

type EditFollowUpContentProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, SearchParamValue>>;
};

export default async function EditFollowUpContent({
  params,
  searchParams,
}: EditFollowUpContentProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);

  // Follow-up ids follow the same rules as customer ids (digits, in range).
  const followUpId = readCustomerId(id);
  if (followUpId === null) {
    notFound();
  }
  const followUp = await getFollowUp(followUpId);
  if (followUp === null) {
    notFound();
  }

  const returnTo = safeReturnPath(firstValue(query.returnTo));

  return (
    <>
      <PageHeader title="Edit follow-up" subtitle={followUp.customer.companyName} />
      <div className="max-w-2xl">
        <Card>
          <FollowUpForm
            mode="edit"
            action={updateFollowUp}
            initialValues={followUpToFormValues(followUp)}
            customers={[followUp.customer]}
            followUpId={followUp.id}
            returnTo={returnTo}
            cancelHref={returnTo ?? "/follow-ups"}
          />
        </Card>
        <DeleteFollowUpSection followUpId={followUp.id} returnTo={returnTo} />
      </div>
    </>
  );
}
