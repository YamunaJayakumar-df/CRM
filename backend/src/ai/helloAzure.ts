// Lesson 1: say hello to our Azure OpenAI models.
// Run it from the backend folder with:  npm run ai:hello
//
// It sends one short message to EACH of our two deployments (routing and
// reasoning), prints each reply and how many tokens it used, and nothing
// else: it reads and writes no CRM data. Costs a fraction of a cent.
import "../env.js"; // must stay the first import: loads backend/.env
import type { AzureOpenAI } from "openai";
import { createAzureClient } from "./azureClient.js";
import { explainError, loadConfigOrExit } from "./scriptHelpers.js";

const HELLO_MESSAGE =  "Explain what a CRM is in one simple sentence.";

/** Send the hello message to one deployment and print the reply. True if it worked. */
async function sayHello(client: AzureOpenAI, label: string, deployment: string): Promise<boolean> {
  try {
    const response = await client.chat.completions.create({
      // On Azure, "model" is the DEPLOYMENT name our team chose.
      model: deployment,
      messages: [{ role: "user", content: HELLO_MESSAGE }],
    });
    const reply = response.choices[0]?.message?.content ?? "(empty reply)";
    console.log(`\n${label} (${deployment}, model: ${response.model})`);
    console.log(`  Reply:  ${reply}`);
    if (response.usage) {
      console.log(
        `  Tokens: ${response.usage.prompt_tokens} in, ${response.usage.completion_tokens} out`,
      );
    }
    return true;
  } catch (error) {
    console.error(`\n${label} (${deployment}) failed: ${explainError(error)}`);
    return false;
  }
}

const config = loadConfigOrExit();
const client = createAzureClient(config);

console.log(`Asking our Azure OpenAI models: "${HELLO_MESSAGE}"`);
const routingOk = await sayHello(client, "ROUTING model", config.routingDeployment);
const reasoningOk = await sayHello(client, "REASONING model", config.reasoningDeployment);
process.exitCode = routingOk && reasoningOk ? 0 : 1;
