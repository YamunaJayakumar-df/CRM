// Real answers our Azure model gave, saved so tests can reuse them for free.
//
// Why: calling the AI in every test run would cost money, be slow, and give
// slightly different answers each time. A "recorded answer" (a fixture) is
// paid for once and gives the same result forever.
// Only tests import this file.

/**
 * Lesson 3 run on 2026-10-28 (today was Wednesday 2026-10-28) for the note:
 * "Talked to Ravi at Sunrise Hospital. Call him Friday. Also, Maya from
 *  Greenfield School wants a quote next Monday."
 * Copied exactly as Azure returned it (JSON text).
 */
export const RAVI_AND_MAYA_NOTE =
  "Talked to Ravi at Sunrise Hospital. Call him Friday. Also, Maya from Greenfield School wants a quote next Monday.";

export const RAVI_AND_MAYA_ANSWER = JSON.stringify({
  customers: [
    {
      companyName: "Sunrise Hospital",
      contactName: "Ravi",
      phone: null,
      email: null,
      interaction: { type: "CALL", summary: "Talked to Ravi.", typeWasGuessed: true },
      followUps: [{ title: "Call Ravi", dueDate: "2026-10-30", priority: "MEDIUM" }],
    },
    {
      companyName: "Greenfield School",
      contactName: "Maya",
      phone: null,
      email: null,
      interaction: null,
      followUps: [{ title: "Send quote to Maya", dueDate: "2026-11-02", priority: "MEDIUM" }],
    },
  ],
  unclear: [],
});

/** Lesson 3 answer for "send proposal to them next week" (no customer named). */
export const NO_CUSTOMER_ANSWER = JSON.stringify({
  customers: [],
  unclear: ["Which customer?", "Details of the proposal?"],
});

/** The day these answers were recorded; tests use it as "today". */
export const RECORDED_ON = "2026-10-28";
