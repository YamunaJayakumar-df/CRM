// Lesson 3: the AI fills in a form (structured output) instead of writing text.
// Run it from the backend folder with:  npm run ai:understand
//
// For each sample note it checks the note with validateNote, sends it with our
// instructions AND the form (NOTE_UNDERSTANDING_FORMAT), and prints the JSON
// answer. Reads and writes no CRM data.
import "../env.js"; // must stay the first import: loads backend/.env
import type { AzureOpenAI } from "openai";
import { createAzureClient } from "./azureClient.js";
import { buildAssistantInstructions } from "./assistantInstructions.js";
import { validateNote } from "./noteValidation.js";
import { explainError, loadConfigOrExit } from "./scriptHelpers.js";
import { NOTE_UNDERSTANDING_FORMAT, type NoteUnderstanding } from "./understandingSchema.js";
import { todayInKolkata } from "../shared/plainDate.js";

// Change these to try your own notes.
const SAMPLE_NOTES = [
  "Talked to Ravi at Sunrise Hospital. Call him Friday. Also, Maya from Greenfield School wants a quote next Monday.",
  "Emailed Arjun at Bluewave Logistics, their server is down, send a technician tomorrow urgently",
  "send proposal to them next week",
];

/** Send one note with the form and print the answer. True if it worked. */
async function understand(
  client: AzureOpenAI,
  deployment: string,
  instructions: string,
  note: string,
): Promise<boolean> {
  try {
    const response = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: note },
      ],
      response_format: NOTE_UNDERSTANDING_FORMAT,
    });
    const message = response.choices[0]?.message;
    if (message?.refusal) {
      // The model may refuse unsafe requests; then there is no JSON.
      console.log(`REFUSED: ${message.refusal}`);
      return false;
    }
    // The answer is JSON text; JSON.parse turns it into a JavaScript object.
    // (Checking that its values make sense for the CRM is Lesson 5.)
    const understanding = JSON.parse(message?.content ?? "") as NoteUnderstanding;
    console.log(JSON.stringify(understanding, null, 2));
    if (response.usage) {
      console.log(`[${response.usage.prompt_tokens} tokens in, ${response.usage.completion_tokens} out]`);
    }
    return true;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.log("FAILED: the answer was not valid JSON.");
    } else {
      console.log(`FAILED: ${explainError(error)}`);
    }
    return false;
  }
}

const config = loadConfigOrExit();
const client = createAzureClient(config);
const instructions = buildAssistantInstructions(todayInKolkata());
let allOk = true;

for (const sample of SAMPLE_NOTES) {
  console.log("\n" + "=".repeat(70));
  console.log(`NOTE: "${sample}"\n`);

  const check = validateNote(sample);
  if (!check.ok) {
    console.log(`NOT SENT (validation): ${check.errors.join(" ")}`);
    continue;
  }
  const ok = await understand(client, config.reasoningDeployment, instructions, check.data);
  allOk = allOk && ok;
}
process.exitCode = allOk ? 0 : 1;
