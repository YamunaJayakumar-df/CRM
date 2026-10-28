// Tests for checking the values in the AI's answer (no AI, no database).
import { describe, expect, it } from "vitest";
import { checkUnderstanding } from "./checkUnderstanding.js";
import { RAVI_AND_MAYA_ANSWER, RECORDED_ON } from "./fixtures/recordedAnswers.js";
import type { NoteUnderstanding, UnderstoodCustomer, UnderstoodFollowUp } from "./understandingSchema.js";

/** A note answer with one customer, changed by `extra`. */
function answerWith(extra: Partial<UnderstoodCustomer>): NoteUnderstanding {
  return {
    customers: [
      { companyName: "Nova Tech", contactName: null, phone: null, email: null, interaction: null, followUps: [], ...extra },
    ],
    unclear: [],
  };
}

function followUp(extra: Partial<UnderstoodFollowUp>): UnderstoodFollowUp {
  return { title: "Send quote", dueDate: "2026-11-02", priority: "MEDIUM", ...extra };
}

describe("checkUnderstanding", () => {
  it("finds nothing wrong in the recorded real answer", () => {
    const recorded = JSON.parse(RAVI_AND_MAYA_ANSWER) as NoteUnderstanding;
    expect(checkUnderstanding(recorded, RECORDED_ON)).toEqual([]);
  });

  it("asks for a due date the note did not give", () => {
    expect(checkUnderstanding(answerWith({ followUps: [followUp({ dueDate: null })] }), RECORDED_ON)).toEqual([
      'Follow-up "Send quote" for Nova Tech: when is it due?',
    ]);
  });

  it("flags a due date in the past", () => {
    expect(checkUnderstanding(answerWith({ followUps: [followUp({ dueDate: "2026-10-20" })] }), RECORDED_ON)).toEqual([
      'Follow-up "Send quote" for Nova Tech: the due date 2026-10-20 is in the past. Please pick a date.',
    ]);
  });

  it("accepts a due date of today", () => {
    expect(checkUnderstanding(answerWith({ followUps: [followUp({ dueDate: RECORDED_ON })] }), RECORDED_ON)).toEqual([]);
  });

  it("flags a date that does not exist", () => {
    const questions = checkUnderstanding(answerWith({ followUps: [followUp({ dueDate: "2026-02-31" })] }), RECORDED_ON);
    expect(questions).toEqual(['Follow-up "Send quote" for Nova Tech: dueDate must be a date like "2026-10-30".']);
  });

  it("flags a follow-up title that is too long or empty", () => {
    const questions = checkUnderstanding(
      answerWith({ followUps: [followUp({ title: "x".repeat(201) }), followUp({ title: "  " })] }),
      RECORDED_ON,
    );
    expect(questions).toHaveLength(2);
    expect(questions[0]).toMatch(/title must be at most 200 characters/);
    expect(questions[1]).toMatch(/title cannot be empty/);
  });

  it("flags an email that is not an email", () => {
    const questions = checkUnderstanding(answerWith({ email: "ravi at sunrise" }), RECORDED_ON);
    expect(questions).toHaveLength(1);
    expect(questions[0]).toMatch(/^Nova Tech: email/);
  });

  it("flags an interaction with an empty summary", () => {
    const questions = checkUnderstanding(
      answerWith({ interaction: { type: "CALL", summary: "  ", typeWasGuessed: false } }),
      RECORDED_ON,
    );
    expect(questions).toHaveLength(1);
    expect(questions[0]).toMatch(/^Interaction for Nova Tech: summary/);
  });

  it("does not check customer details when the company is missing (asked elsewhere)", () => {
    const questions = checkUnderstanding(
      answerWith({ companyName: "", followUps: [followUp({ dueDate: null })] }),
      RECORDED_ON,
    );
    expect(questions).toEqual(['Follow-up "Send quote" for the unnamed customer: when is it due?']);
  });

  it("checks every customer in the note", () => {
    const answer: NoteUnderstanding = {
      customers: [
        answerWith({ followUps: [followUp({ dueDate: null })] }).customers[0]!,
        answerWith({ companyName: "Orchid Hotels", followUps: [followUp({ dueDate: "2026-01-01" })] }).customers[0]!,
      ],
      unclear: [],
    };
    expect(checkUnderstanding(answer, RECORDED_ON)).toHaveLength(2);
  });
});
