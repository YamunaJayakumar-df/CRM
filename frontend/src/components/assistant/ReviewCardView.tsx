// ReviewCardView: one customer from the note, as an editable card.
//   1. which customer (CustomerChoice)
//   2. the interaction the AI heard (or "Add interaction")
//   3. the follow-ups (each editable and removable, "Add follow-up")
// "Remove this customer" leaves the card out of the save (and can be undone).
// The card never saves anything itself: it reports every change to the
// parent with onChange(nextCard), and Save all saves all cards together.
"use client";

import { Plus, Trash2, Undo2 } from "lucide-react";
import type { FollowUpPriority, InteractionType } from "@/lib/api/types";
import type { EditableFollowUp, ReviewCard } from "@/lib/assistant/reviewState";
import { FOLLOW_UP_PRIORITY_LABELS, INTERACTION_TYPE_LABELS } from "@/lib/format/labels";
import CustomerChoice from "./CustomerChoice";
import { ReviewInput, ReviewSelect, ReviewTextArea } from "./ReviewFields";

const iconProps = { size: 16, strokeWidth: 1.75, "aria-hidden": true } as const;

const TYPE_OPTIONS = (Object.keys(INTERACTION_TYPE_LABELS) as InteractionType[]).map((value) => ({
  value,
  label: INTERACTION_TYPE_LABELS[value],
}));

const PRIORITY_OPTIONS = (Object.keys(FOLLOW_UP_PRIORITY_LABELS) as FollowUpPriority[]).map((value) => ({
  value,
  label: FOLLOW_UP_PRIORITY_LABELS[value],
}));

const NEW_FOLLOW_UP: EditableFollowUp = { title: "", dueDate: "", priority: "MEDIUM" };

// Quiet text buttons for "remove" and "add" (the words say what happens).
const smallButtonClasses =
  "inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-accent transition-colors duration-150 hover:bg-hover";

type ReviewCardViewProps = {
  card: ReviewCard;
  /** 1-based number shown as "Customer 1". */
  number: number;
  onChange: (card: ReviewCard) => void;
};

export default function ReviewCardView({ card, number, onChange }: ReviewCardViewProps) {
  const idPrefix = `card-${number}`;
  const heading = card.heardName.trim() === "" ? `Customer ${number}` : `Customer ${number}: ${card.heardName}`;

  const changeFollowUp = (index: number, change: Partial<EditableFollowUp>) =>
    onChange({
      ...card,
      followUps: card.followUps.map((followUp, i) => (i === index ? { ...followUp, ...change } : followUp)),
    });

  if (!card.included) {
    return (
      <section className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-line px-6 py-4">
        <p className="text-muted">
          <span className="font-medium text-ink">{heading}</span> will not be saved.
        </p>
        <button type="button" className={smallButtonClasses} onClick={() => onChange({ ...card, included: true })}>
          <Undo2 {...iconProps} /> Keep it
        </button>
      </section>
    );
  }

  return (
    <section aria-labelledby={`${idPrefix}-heading`} className="rounded-xl border border-line bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 id={`${idPrefix}-heading`} className="text-lg font-medium text-ink">
          {heading}
        </h2>
        <button type="button" className={smallButtonClasses} onClick={() => onChange({ ...card, included: false })}>
          <Trash2 {...iconProps} /> Remove this customer
        </button>
      </div>

      {card.question && <p className="mb-4 rounded-xl bg-medium-bg px-4 py-3 text-sm text-medium-ink">{card.question}</p>}

      <CustomerChoice
        idPrefix={idPrefix}
        options={card.options}
        moreMatches={card.moreMatches}
        choice={card.choice}
        newCustomer={card.newCustomer}
        onChoose={(choice) => onChange({ ...card, choice })}
        onNewCustomerChange={(newCustomer) => onChange({ ...card, newCustomer })}
      />

      {/* 2. Interaction */}
      <div className="mt-6 border-t border-line pt-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h3 className="text-sm font-medium text-ink">What happened</h3>
          {card.interaction ? (
            <button type="button" className={smallButtonClasses} onClick={() => onChange({ ...card, interaction: null })}>
              <Trash2 {...iconProps} /> Remove
            </button>
          ) : (
            <button
              type="button"
              className={smallButtonClasses}
              onClick={() => onChange({ ...card, interaction: { type: "NOTE", summary: "", typeWasGuessed: false } })}
            >
              <Plus {...iconProps} /> Add interaction
            </button>
          )}
        </div>
        {card.interaction ? (
          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            <ReviewSelect
              id={`${idPrefix}-type`}
              label="Type"
              value={card.interaction.type}
              options={TYPE_OPTIONS}
              // Once the user picks the type, it is no longer a guess.
              onChange={(type) => onChange({ ...card, interaction: { ...card.interaction!, type, typeWasGuessed: false } })}
              hint={card.interaction.typeWasGuessed ? "The AI guessed this. Please check." : undefined}
            />
            <ReviewTextArea
              id={`${idPrefix}-summary`}
              label="Summary"
              required
              value={card.interaction.summary}
              onChange={(summary) => onChange({ ...card, interaction: { ...card.interaction!, summary } })}
            />
          </div>
        ) : (
          <p className="text-sm text-muted">Nothing happened yet with this customer (only plans).</p>
        )}
      </div>

      {/* 3. Follow-ups */}
      <div className="mt-6 border-t border-line pt-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h3 className="text-sm font-medium text-ink">Follow-ups</h3>
          <button
            type="button"
            className={smallButtonClasses}
            onClick={() => onChange({ ...card, followUps: [...card.followUps, { ...NEW_FOLLOW_UP }] })}
          >
            <Plus {...iconProps} /> Add follow-up
          </button>
        </div>
        {card.followUps.length === 0 && <p className="text-sm text-muted">No follow-ups.</p>}
        <div className="space-y-4">
          {card.followUps.map((followUp, index) => (
            <div key={index} className="grid items-end gap-4 sm:grid-cols-[1fr_11rem_8rem_auto]">
              <ReviewInput
                id={`${idPrefix}-fu-${index}-title`}
                label="Title"
                required
                maxLength={200}
                value={followUp.title}
                onChange={(title) => changeFollowUp(index, { title })}
              />
              <ReviewInput
                id={`${idPrefix}-fu-${index}-date`}
                label="Due date"
                type="date"
                required
                value={followUp.dueDate}
                onChange={(dueDate) => changeFollowUp(index, { dueDate })}
              />
              <ReviewSelect
                id={`${idPrefix}-fu-${index}-priority`}
                label="Priority"
                value={followUp.priority}
                options={PRIORITY_OPTIONS}
                onChange={(priority) => changeFollowUp(index, { priority })}
              />
              <button
                type="button"
                className={`${smallButtonClasses} mb-1`}
                aria-label={`Remove follow-up ${index + 1}`}
                onClick={() => onChange({ ...card, followUps: card.followUps.filter((_, i) => i !== index) })}
              >
                <Trash2 {...iconProps} /> <span className="sm:sr-only">Remove</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
