// Lesson 2: see what the assistant's instructions change.
// Run it from the backend folder with:  npm run ai:prompt
//
// For each sample note it:
//   1. checks the note with validateNote (bad notes are NOT sent, cost nothing),
//   2. asks the reasoning model WITHOUT instructions,
//   3. asks again WITH our instructions (the system message),
// and prints both answers so you can compare. Reads and writes no CRM data.
import "../env.js"; // must stay the first import: loads backend/.env
import type { AzureOpenAI } from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { createAzureClient } from "./azureClient.js";
import { buildAssistantInstructions } from "./assistantInstructions.js";
import { validateNote } from "./noteValidation.js";
import { explainError, loadConfigOrExit } from "./scriptHelpers.js";
import { todayInKolkata } from "../shared/plainDate.js";

// Change these to try your own notes. The last one is meant to be rejected.
const SAMPLE_NOTES = [
  
 "Talked to Ravi at Sunrise Hospital. Call him Friday. Also, Maya from Greenfield School wants a quote next Monday.",
  // Tests the priority rule and an EMAIL.
  "Emailed Arjun at Bluewave Logistics, their server is down, send a technician tomorrow urgently",
  // Tests "never guess the company".
  "send proposal to them next week",
  // Tests "nothing happened yet" (Interaction: none).
  "Need to send the AMC renewal to Greenfield School by 5 November, no rush",
];

/** Send messages to one deployment and return the reply text (or the problem). */
async function ask(
  client: AzureOpenAI,
  deployment: string,
  messages: ChatCompletionMessageParam[],
): Promise<string> {
  try {
    const response = await client.chat.completions.create({ model: deployment, messages });
    const reply = response.choices[0]?.message?.content ?? "(empty reply)";
    const tokens = response.usage
      ? `\n  [${response.usage.prompt_tokens} tokens in, ${response.usage.completion_tokens} out]`
      : "";
    return reply + tokens;
  } catch (error) {
    process.exitCode = 1;
    return `FAILED: ${explainError(error)}`;
  }
}

const config = loadConfigOrExit();
const client = createAzureClient(config);
const instructions = buildAssistantInstructions(todayInKolkata());

for (const sample of SAMPLE_NOTES) {
  console.log("\n" + "=".repeat(70));
  console.log(`NOTE: "${sample}"`);

  const check = validateNote(sample);
  if (!check.ok) {
    console.log(`\nNOT SENT (validation): ${check.errors.join(" ")}`);
    continue;
  }
  const note = check.data;

  const without = await ask(client, config.reasoningDeployment, [{ role: "user", content: note }]);
  console.log(`\n--- WITHOUT instructions ---\n${without}`);

  const withInstructions = await ask(client, config.reasoningDeployment, [
    { role: "system", content: instructions },
    { role: "user", content: note },
  ]);
  console.log(`\n--- WITH instructions ---\n${withInstructions}`);
}
