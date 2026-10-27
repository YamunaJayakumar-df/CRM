// LogInteractionButton: the Interactions page's main "+ Log Interaction"
// button. It opens the Log form with ?returnTo= the page as it is now
// (same view, range, search and customer), so saving or cancelling comes
// straight back to the same view.
//
// Reading the URL means awaiting `searchParams`, so the page renders this
// inside <Suspense>. Its fallback, LogInteractionButtonLink with the plain
// "/interactions", looks identical, so nothing jumps while it loads.
import PrimaryButtonLink from "@/components/PrimaryButtonLink";
import { newInteractionHref } from "@/lib/interactions/interactionHrefs";
import {
  interactionsHref,
  readInteractionsState,
  type InteractionsSearchParams,
} from "@/lib/interactions/interactionsView";

type LogInteractionButtonLinkProps = {
  /** The Interactions page URL to come back to. */
  returnTo: string;
};

/** The button itself, for a known return URL. */
export function LogInteractionButtonLink({ returnTo }: LogInteractionButtonLinkProps) {
  return (
    <PrimaryButtonLink href={newInteractionHref({ returnTo })}>Log Interaction</PrimaryButtonLink>
  );
}

type LogInteractionButtonProps = {
  searchParams: Promise<InteractionsSearchParams>;
};

export default async function LogInteractionButton({ searchParams }: LogInteractionButtonProps) {
  const state = readInteractionsState(await searchParams);
  return <LogInteractionButtonLink returnTo={interactionsHref(state)} />;
}
