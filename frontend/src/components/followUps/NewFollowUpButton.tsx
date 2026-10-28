// NewFollowUpButton: the Follow-ups page's main "+ New follow-up" button.
// It opens the form with ?returnTo= the page as it is now (same view,
// search and customer), so saving or cancelling comes straight back.
// When the page is filtered to one customer, that customer is preselected.
//
// Reading the URL means awaiting `searchParams`, so the page renders this
// inside <Suspense>. Its fallback, NewFollowUpButtonLink with the plain
// "/follow-ups", looks identical, so nothing jumps while it loads.
import PrimaryButtonLink from "@/components/PrimaryButtonLink";
import { newFollowUpHref } from "@/lib/followUps/followUpHrefs";
import {
  followUpsHref,
  readFollowUpsState,
  type FollowUpsSearchParams,
} from "@/lib/followUps/followUpsView";

type NewFollowUpButtonLinkProps = {
  /** The Follow-ups page URL to come back to. */
  returnTo: string;
  /** Preselect this customer in the form. */
  customerId?: number;
};

/** The button itself, for a known return URL. */
export function NewFollowUpButtonLink({ returnTo, customerId }: NewFollowUpButtonLinkProps) {
  return (
    <PrimaryButtonLink href={newFollowUpHref({ customerId, returnTo })}>New follow-up</PrimaryButtonLink>
  );
}

type NewFollowUpButtonProps = {
  searchParams: Promise<FollowUpsSearchParams>;
};

export default async function NewFollowUpButton({ searchParams }: NewFollowUpButtonProps) {
  const state = readFollowUpsState(await searchParams);
  return (
    <NewFollowUpButtonLink
      returnTo={followUpsHref(state)}
      customerId={state.customerId ?? undefined}
    />
  );
}
