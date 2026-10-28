// Lesson 3: the AI fills in a form (structured output) instead of writing text.
// Run it from the backend folder with:  npm run ai:understand
//
// For each sample note it checks the note with validateNote, sends it with our
// instructions AND the form (NOTE_UNDERSTANDING_FORMAT), and prints the JSON
// answer. Reads and writes no CRM data.
import "../env.js"; // must stay the first import: loads backend/.env
import type { AzureOpenAI } from "openai";
import { createAzureClient } from "./azureClient.js";
import { validateNote } from "./noteValidation.js";
import { explainError, loadConfigOrExit } from "./scriptHelpers.js";
import { understandNote } from "./understandNote.js";
import { todayInKolkata } from "../shared/plainDate.js";

// Change these to try your own notes.
const SAMPLE_NOTES = [
  "Talked to Ravi at Sunrise Hospital. Call him Friday. Also, Maya from Greenfield School wants a quote next Monday.",
  "Emailed Arjun at Bluewave Logistics, their server is down, send a technician tomorrow urgently",
  "send proposal to them next week",
];

/** Send one note with the form and print the answer. True if it worked. */
async function understand(client: AzureOpenAI, deployment: string, note: string): Promise<boolean> {
  try {
    const outcome = await understandNote(client, deployment, note, todayInKolkata());
    if (!outcome.ok) {
      console.log(`FAILED (${outcome.problem}): ${outcome.detail}`);
      return false;
    }
    console.log(JSON.stringify(outcome.understanding, null, 2));
    if (outcome.tokens) {
      console.log(`[${outcome.tokens.input} tokens in, ${outcome.tokens.output} out]`);
    }
    return true;
  } catch (error) {
    console.log(`FAILED: ${explainError(error)}`);
    return false;
  }
}

const config = loadConfigOrExit();
const client = createAzureClient(config);
let allOk = true;

for (const sample of SAMPLE_NOTES) {
  console.log("\n" + "=".repeat(70));
  console.log(`NOTE: "${sample}"\n`);

  const check = validateNote(sample);
  if (!check.ok) {
    console.log(`NOT SENT (validation): ${check.errors.join(" ")}`);
    continue;
  }
  const ok = await understand(client, config.reasoningDeployment, check.data);
  allOk = allOk && ok;
}
process.exitCode = allOk ? 0 : 1;
