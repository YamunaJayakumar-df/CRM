// LogInteractionButton: the page's main "+ Log Interaction" button.
// The logging form comes in the next step, so for now it is disabled with
// "Soon" as a tooltip and read out to screen readers, the same treatment as
// the customer panel's disabled actions. The tooltip sits on a wrapper,
// because browsers do not show tooltips on disabled buttons reliably.
import { Plus } from "lucide-react";

export default function LogInteractionButton() {
  return (
    <span title="Soon" className="self-start sm:self-auto">
      <button
        type="button"
        disabled
        className="inline-flex h-11 cursor-not-allowed items-center gap-2 rounded-xl bg-primary px-4 text-base font-medium text-on-primary opacity-50"
      >
        <Plus size={18} strokeWidth={2} aria-hidden="true" />
        Log Interaction
        <span className="sr-only">(Soon)</span>
      </button>
    </span>
  );
}
