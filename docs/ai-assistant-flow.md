# AI assistant: how a note becomes CRM records

The user types (later: speaks) a short note such as
*"Talked to Ravi at Sunrise Hospital, wants a quote for 20 laptops, follow up Friday"*.
The assistant works out what it means, finds the right customer, and shows a review.
**Nothing is saved until the user confirms the review.**

Status: ✅ done · 🔜 next · ⏳ later

---

## The flow at a glance

```
 USER                     BACKEND (our code)                          AZURE OPENAI
 ────                     ──────────────────                          ────────────
 types / speaks a note
        │
        ▼
 ✅ voice → text (Lesson 8)
        │
        ▼
 POST /ai/understand ──►  ✅ check the note (Lesson 2: validateNote)
 (✅ Step 4)                 bad note → error, nothing sent, costs nothing
                                 │
                          ✅ instructions + note + form ─────────────►  reads the note,
                             (Lessons 2-3)              ◄─────────────  fills in the form (JSON)
                          ✅ JSON answer: customers[], unclear[]
                                 │
                                 ▼  for EACH customer in the answer
                          ✅ fetch candidates from the database (Step 2, read only)
                          ✅ rank every option, with reasons (Step 1)
                          ✅ decide: pre-select / choose / create / ask (Step 3)
                                 │
 review screen  ◄──────── ✅ review: customer + interaction + follow-ups
 (✅ Step 6)                 (nothing saved yet)
 user picks / edits
 user clicks Save
        │
        ▼
 POST /ai/save ────────►  ✅ check EVERYTHING again, then ONE transaction (Step 5)
                              → customer (if new), interaction, follow-ups
 "Saved ✓"  ◄─────────────    a repeated Save never saves twice
```

The AI only **reads and proposes**. It never sees the database, never picks a
customer and never saves. Our code does all of that, and the user confirms.

---

## The steps in detail

### ✅ Lesson 1: connect to Azure OpenAI
- `backend/src/ai/azureConfig.ts` reads the five `AZURE_OPENAI_*` settings from
  `backend/.env` and names any that are missing (never their values).
- `backend/src/ai/azureClient.ts` creates the client. Backend only: the browser never sees the key.
- Try: `npm run ai:hello`. Both deployments are currently gpt-4.1-mini (to confirm with the senior).

### ✅ Lesson 2: instructions and note validation
- `noteValidation.ts`: a note must be text, 5–2000 characters, with real words.
  The rules are in one list (`NOTE_RULES`), so new checks are easy to add.
- `assistantInstructions.ts`: the system message. It describes the CRM's records
  (customer, interaction CALL/EMAIL/MEETING/NOTE, follow-up with date and priority),
  today's date in India, and the rules: never invent details, never guess the company.
- Try: `npm run ai:prompt` (compares answers without and with instructions).

### ✅ Lesson 3: structured output (the AI fills in a form)
- `understandingSchema.ts`: the JSON Schema "form". Azure forces the answer to match it.
  Each customer has contact, phone, email, `interaction` (or null) and `followUps`, plus an
  `unclear` list of questions. Guesses are flagged (`typeWasGuessed`).
- Try: `npm run ai:understand`.

### ✅ Step 1: rank every possible customer match
- `customerMatching.ts` → `rankCustomerOptions(wanted, candidates)`.
- Returns **every** match, best first: `exactName` > `allWords` > `someWords` > `contactOnly`,
  each with reasons ("company name has: sunrise, hospital"). "Create new customer" is always offered.
- Pure logic, no database. Known limits: word pieces match ("sun" → Sunrise),
  typos are not found, and different scripts (Tamil vs English) don't match.

### ✅ Step 2: fetch candidates from the database
- `findCustomerCandidates.ts`: one read-only query. Customers whose company name or
  website contains any word, or whose contact name matches. At most 50, with `moreMatches` if there are more.
- Reuses the safe escaping from the customer search (`shared/escapeSearchText.ts`).
- Try: `npm run ai:find` against the demo data (no AI, no cost).

### ✅ Step 3: the decision layer (one per customer in the note)
`customerDecision.ts` → `decideCustomer` uses the owner's rules, with no confidence percentages:

| Decision | Situation | What the review shows |
|---|---|---|
| `preselected` | **Clear, unique**: exactly one `exactName`, no other `exactName`/`allWords`, `moreMatches` false | That customer **pre-selected**. The user can still change it. |
| `choose` | Several possible customers, or only partial matches | All options with reasons. The user picks one or "create new". |
| `choose` (+ flag) | `moreMatches` true, even with an exact match | The options, plus "more customers match, type a more exact name" |
| `createNew` | No match | "Create new customer: Nova Tech" |
| `needInfo` | Company not named, or only filler words ("Pvt Ltd") | One question ("Which company is Ravi from?"), plus any contact matches |

`planNote` makes one decision **per customer**. Each customer keeps its own
interaction and follow-ups, and customers are never merged. All questions (the AI's
`unclear` list plus ours) are collected into one list, so the user answers them on one screen.
The database search is passed in (`findOptions`), so this file has no database code.

### ✅ Step 4: `POST /ai/understand`
- Note → check → AI → for each customer: fetch, rank, decide → review JSON.
- **Saves nothing.** Returns a `reviewId` (the "ticket number" for Save), `customers`
  (each with `understood` and `decision`) and one `questions` list.

### ✅ Step 5: `POST /ai/save` (the only step that writes)
- `saveValidation.ts`: the backend **does not trust the screen** and checks everything again:
  - every customer is resolved: `{ "existingId": 39 }` or `{ "createNew": { ... } }`;
    otherwise "choose a customer or create a new one", and **nothing** is saved;
  - a new customer, the interaction and the follow-ups follow the CRM forms' rules;
  - limits: 10 customers per save, 10 follow-ups per customer; unknown fields are rejected.
- `saveReview.ts`: three safety layers:
  1. **ticket check**: a `reviewId` that was already saved returns "already saved" (200), with nothing new written;
  2. every chosen existing customer must exist (any existing one is allowed, even one not offered);
  3. **one transaction**: customers, interactions, follow-ups and the ticket are saved together, or nothing is.
- New table `AiSave` (migration `20261028175149_add_ai_save`) remembers used tickets.
  Two Saves at the same moment: the database lets only one ticket in, and the other answers "already saved".
- Tried for real: the first Save gave 201, the same Save again gave 200 "already saved", and exactly 1 customer was created.

### ✅ Step 6 (Lesson 7): review screen in the frontend
- Page `/assistant` ("AI Assistant" in the sidebar, "Tell the AI what happened" on the dashboard).
- Three stages: **write** the note → **review** one card per customer → **saved** (with links to the customer pages).
- Each card: every customer option with its reasons, plus "Create a new customer"; the interaction
  (a guessed type is flagged) and the follow-ups, all editable and removable; "Remove this customer".
- **Save all** stays disabled, with the reasons listed, until every customer is chosen and every
  follow-up has a title and date. The review keeps its `reviewId`, so saving is safe to repeat.
- The browser never calls the backend: Server Actions in `frontend/src/app/assistant/actions.ts` do.

### ✅ Lesson 8: voice
- The "Speak" button: the browser's built-in speech-to-text (Chrome/Edge, Indian English `en-IN`)
  types into the same note box. Nothing goes to our AI until the user presses Understand.
- ⚠️ Privacy: the browser's speech service (Google in Chrome, Microsoft in Edge) turns the audio
  into text. The CRM never stores audio. **Confirm with the senior before real use.**
- Kept swappable (`frontend/src/lib/assistant/speech.ts`, the `SpeechToText` "ears"), so Sarvam AI
  (better for Indian languages) or Azure Speech can replace it later. Firefox gets a "please type" note.

---

## Later (before real users)

- **Login and permissions (Auth step).** Until then the AI endpoints run locally only.
  After Auth, saving also checks who the user is and what they may edit.
- **Safety limits:** requests per user per minute, and a maximum note length (already 2000).
- **Logging:** record what the AI proposed and what the user saved (without secrets),
  to find mistakes and measure cost.
- **Cost check:** about 900 tokens per note today (instructions + form). Consider the
  routing deployment for simple notes once the senior confirms the models.
- **Never** send emails or contact customers from the assistant without a separate,
  explicit feature and approval.

---

## Decisions (owner, 2026-10-27/28)

1. Show first, then one-click Save. Never auto-save.
2. Our code finds the customer, never the AI. Every possible match is listed.
3. A clear, unique match is only **pre-selected**. The user confirms the whole review.
4. "Clear, unique" = exactly one `exactName`, no other `exactName`/`allWords`, `moreMatches` false.
5. At save, any existing customer ID is allowed; unknown IDs are rejected.
6. Brain: Azure OpenAI (senior's settings). Ears: browser speech-to-text (Sarvam later).
