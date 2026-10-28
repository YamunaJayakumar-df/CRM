// CustomerChoice: "which customer is this?" on one review card.
//
// Every option the backend found is a radio button, best first, with the
// reasons it matched; the last radio is always "Create a new customer"
// (with its fields). One radio is ticked only when the backend pre-selected
// a clear match or found nothing (owner rule); the user can change it.
// Radio buttons in a <fieldset> + <legend>: screen readers read the question
// with each option, and the arrow keys move between options.
"use client";

import type { CardChoice, NewCustomerFields } from "@/lib/assistant/reviewState";
import type { CustomerOption, MatchStrength } from "@/lib/assistant/types";
import { ReviewInput } from "./ReviewFields";

// How sure the match is, in plain words (the reasons say why).
const STRENGTH_LABELS: Record<MatchStrength, string> = {
  exactName: "Same name",
  allWords: "All words match",
  someWords: "Some words match",
  contactOnly: "Contact name matches",
};

type CustomerChoiceProps = {
  /** Unique per card, used for radio names and field ids. */
  idPrefix: string;
  options: CustomerOption[];
  moreMatches: boolean;
  choice: CardChoice;
  newCustomer: NewCustomerFields;
  onChoose: (choice: CardChoice) => void;
  onNewCustomerChange: (fields: NewCustomerFields) => void;
};

export default function CustomerChoice({
  idPrefix,
  options,
  moreMatches,
  choice,
  newCustomer,
  onChoose,
  onNewCustomerChange,
}: CustomerChoiceProps) {
  const radioName = `${idPrefix}-customer`;
  const isNew = choice?.kind === "new";
  const setField = (field: keyof NewCustomerFields) => (value: string) =>
    onNewCustomerChange({ ...newCustomer, [field]: value });

  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium text-ink">
        Which customer is this?
        {choice === null && <span className="ml-2 font-normal text-danger">Please choose one</span>}
      </legend>

      <div className="space-y-2">
        {options.map((option) => {
          const checked = choice?.kind === "existing" && choice.id === option.id;
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 transition-colors duration-150 hover:bg-hover ${
                checked ? "border-primary bg-primary-soft" : "border-line"
              }`}
            >
              <input
                type="radio"
                name={radioName}
                checked={checked}
                onChange={() => onChoose({ kind: "existing", id: option.id })}
                className="mt-1 accent-primary"
              />
              <span className="min-w-0">
                <span className="block font-medium text-ink">
                  {option.companyName}
                  <span className="ml-2 rounded-full bg-open-bg px-2 py-0.5 text-xs font-medium text-open-ink">
                    {STRENGTH_LABELS[option.strength]}
                  </span>
                </span>
                {option.contactName && <span className="block text-sm text-muted">Contact: {option.contactName}</span>}
                <span className="mt-1 block text-xs text-muted">{option.reasons.join(" · ")}</span>
              </span>
            </label>
          );
        })}

        {moreMatches && (
          <p className="text-sm text-muted">More customers match this name. Write a more exact name in the note to see them.</p>
        )}

        <label
          className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 transition-colors duration-150 hover:bg-hover ${
            isNew ? "border-primary bg-primary-soft" : "border-line"
          }`}
        >
          <input
            type="radio"
            name={radioName}
            checked={isNew}
            onChange={() => onChoose({ kind: "new" })}
            className="mt-1 accent-primary"
          />
          <span className="font-medium text-ink">
            Create a new customer
            {options.length === 0 && <span className="ml-2 font-normal text-muted">(no matching customer found)</span>}
          </span>
        </label>
      </div>

      {isNew && (
        <div className="mt-3 grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-2">
          <ReviewInput id={`${idPrefix}-company`} label="Company name" required maxLength={200} value={newCustomer.companyName} onChange={setField("companyName")} />
          <ReviewInput id={`${idPrefix}-contact`} label="Contact person" maxLength={200} value={newCustomer.contactName} onChange={setField("contactName")} />
          <ReviewInput id={`${idPrefix}-phone`} label="Phone" type="tel" maxLength={50} value={newCustomer.phone} onChange={setField("phone")} />
          <ReviewInput id={`${idPrefix}-email`} label="Email" type="email" maxLength={254} value={newCustomer.email} onChange={setField("email")} />
        </div>
      )}
    </fieldset>
  );
}
