// AssistantWorkspace: the whole AI Assistant screen, in three stages:
//   1. WRITE   the note box and "Understand"      -> understandNoteAction
//   2. REVIEW  one editable card per customer,
//              the questions, "Discard" / "Save all" -> saveReviewAction
//   3. SAVED   what was created, with links to the customer pages
//
// Nothing is saved before "Save all". The review keeps the backend's
// reviewId ("ticket"), so clicking Save twice (or retrying after an error)
// can never save the same note twice.
// It is a Client Component ("use client") because it keeps the review in
// React state while the user edits it. The Server Actions do the talking to
// the backend, so the backend address never reaches the browser.
"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveReviewAction, understandNoteAction, type ActionFailure } from "@/app/assistant/actions";
import { buildSaveBody, reviewFromPlan, saveProblems, type ReviewCard, type ReviewState } from "@/lib/assistant/reviewState";
import { appendSpokenText } from "@/lib/assistant/speech";
import type { SaveResult } from "@/lib/assistant/types";
import { customerPageHref } from "@/lib/customers/customerHrefs";
import { textAreaClasses } from "@/components/forms/fieldClasses";
import MicButton from "./MicButton";
import ReviewCardView from "./ReviewCardView";

// Same limits as the backend (backend/src/ai/noteValidation.ts).
const MAX_NOTE_LENGTH = 2000;
const MIN_NOTE_LENGTH = 5;

const primaryButtonClasses =
  "inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-base font-medium text-on-primary transition-colors duration-150 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary";

const secondaryButtonClasses =
  "inline-flex h-11 items-center justify-center rounded-xl border border-line px-5 text-base font-medium text-ink transition-colors duration-150 hover:bg-hover disabled:opacity-60";

/** The name to show for a saved card. */
function cardName(card: ReviewCard): string {
  if (card.choice?.kind === "existing") {
    const choiceId = card.choice.id;
    return card.options.find((option) => option.id === choiceId)?.companyName ?? `Customer #${choiceId}`;
  }
  return card.newCustomer.companyName.trim();
}

/** A failed action: the message and its details. */
function FailureBox({ failure }: { failure: ActionFailure }) {
  return (
    <div role="alert" className="rounded-xl border border-danger px-4 py-3">
      <p className="text-sm font-medium text-ink">{failure.message}</p>
      {failure.details.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-danger">
          {failure.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Saved = { result: SaveResult; names: string[] };

export default function AssistantWorkspace() {
  const [note, setNote] = useState("");
  const [review, setReview] = useState<ReviewState | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [failure, setFailure] = useState<ActionFailure | null>(null);
  const [isUnderstanding, startUnderstanding] = useTransition();
  const [isSaving, startSaving] = useTransition();

  const trimmedNote = note.trim();
  const noteTooShort = trimmedNote.length < MIN_NOTE_LENGTH;

  function understand() {
    setFailure(null);
    startUnderstanding(async () => {
      const answer = await understandNoteAction(trimmedNote);
      if (answer.ok) {
        setReview(reviewFromPlan(answer.plan));
      } else {
        setFailure(answer);
      }
    });
  }

  function save(current: ReviewState) {
    setFailure(null);
    // Names in the same order as the saved items (included, decided cards).
    const names = current.cards.filter((card) => card.included && card.choice !== null).map(cardName);
    startSaving(async () => {
      const answer = await saveReviewAction(buildSaveBody(current));
      if (answer.ok) {
        setSaved({ result: answer.result, names });
        setReview(null);
        setNote("");
      } else {
        setFailure(answer);
      }
    });
  }

  function startOver() {
    setReview(null);
    setSaved(null);
    setFailure(null);
  }

  function changeCard(index: number, card: ReviewCard) {
    setReview((current) =>
      current === null ? current : { ...current, cards: current.cards.map((old, i) => (i === index ? card : old)) },
    );
  }

  // ---- 3. SAVED ----
  if (saved !== null) {
    return (
      <div className="max-w-3xl space-y-6">
        <section role="status" className="rounded-xl border border-line bg-card p-6 shadow-soft">
          <h2 className="text-lg font-medium text-ink">{saved.result.alreadySaved ? "This note was already saved ✓" : "Saved ✓"}</h2>
          <ul className="mt-4 space-y-2">
            {saved.result.items.map((item, index) => (
              <li key={`${item.customerId}-${index}`} className="text-base">
                <Link href={customerPageHref(item.customerId)} className="font-medium text-accent underline-offset-2 hover:underline">
                  {saved.names[index] ?? `Customer #${item.customerId}`}
                </Link>
                <span className="text-muted">
                  {item.customerCreated ? " · new customer" : ""}
                  {item.interactionId !== null ? " · 1 interaction" : ""}
                  {item.followUpIds.length > 0
                    ? ` · ${item.followUpIds.length} follow-up${item.followUpIds.length === 1 ? "" : "s"}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <button type="button" className={primaryButtonClasses} onClick={startOver}>
          Write another note
        </button>
      </div>
    );
  }

  // ---- 2. REVIEW ----
  if (review !== null) {
    const problems = saveProblems(review);
    return (
      <div className="max-w-3xl space-y-6">
        <section className="rounded-xl border border-line bg-card px-6 py-4">
          <p className="text-sm text-muted">Your note</p>
          <p className="mt-1 whitespace-pre-wrap text-ink">{trimmedNote}</p>
        </section>

        {review.questions.length > 0 && (
          <section className="rounded-xl bg-medium-bg px-6 py-4 text-medium-ink">
            <h2 className="font-medium">Please check</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {review.questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </section>
        )}

        {review.cards.length === 0 ? (
          <p className="rounded-xl border border-line bg-card px-6 py-4 text-ink">
            No customer was found in this note. Please write the note again and name the company.
          </p>
        ) : (
          review.cards.map((card, index) => (
            <ReviewCardView key={index} card={card} number={index + 1} onChange={(next) => changeCard(index, next)} />
          ))
        )}

        {failure && <FailureBox failure={failure} />}

        <div className="flex flex-col-reverse gap-4 border-t border-line pt-6 sm:flex-row sm:items-start sm:justify-between">
          <button type="button" className={secondaryButtonClasses} onClick={startOver} disabled={isSaving}>
            Discard
          </button>
          <div className="sm:text-right">
            <button
              type="button"
              className={primaryButtonClasses}
              disabled={problems.length > 0 || isSaving}
              onClick={() => save(review)}
              aria-describedby={problems.length > 0 ? "save-problems" : undefined}
            >
              {isSaving ? "Saving…" : "Save all"}
            </button>
            {problems.length > 0 && review.cards.length > 0 && (
              <ul id="save-problems" className="mt-3 space-y-1 text-sm text-muted">
                {problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- 1. WRITE ----
  return (
    <div className="max-w-3xl space-y-4">
      <section className="rounded-xl border border-line bg-card p-6 shadow-soft">
        <label htmlFor="assistant-note" className="mb-2 block text-sm font-medium text-ink">
          What happened?
        </label>
        <textarea
          id="assistant-note"
          rows={5}
          maxLength={MAX_NOTE_LENGTH}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. Met Vikram at Orchid Hotels, send him a quote by Monday. Kiran from Nova Tech wants a demo next week."
          aria-describedby="assistant-note-hint"
          className={textAreaClasses(false)}
        />
        <div className="mt-2 flex items-center justify-between gap-4">
          <p id="assistant-note-hint" className="text-sm text-muted">
            Name the company. Nothing is saved until you check and press Save.
          </p>
          <p className="shrink-0 text-xs text-muted" aria-live="polite">
            {note.length} / {MAX_NOTE_LENGTH}
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <MicButton
            disabled={isUnderstanding}
            onText={(spoken) => setNote((current) => appendSpokenText(current, spoken, MAX_NOTE_LENGTH))}
          />
          <button type="button" className={primaryButtonClasses} disabled={noteTooShort || isUnderstanding} onClick={understand}>
            {isUnderstanding ? "Reading your note…" : "Understand"}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">
          Voice is turned into text by your browser&apos;s speech service (Google in Chrome, Microsoft in Edge). The CRM does not
          record audio.
        </p>
      </section>
      {failure && <FailureBox failure={failure} />}
    </div>
  );
}
