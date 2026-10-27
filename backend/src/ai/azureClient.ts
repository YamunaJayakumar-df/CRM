// Creates the client object that talks to our company's Azure OpenAI.
//
// A "client" is the SDK's ready-made messenger: we hand it a message, it
// sends it over the internet with the key, and gives back the reply.
// It runs ONLY in the backend; the browser never sees the key.
import { AzureOpenAI } from "openai";
import type { AzureConfig } from "./azureConfig.js";

/**
 * A client for our Azure OpenAI resource. Which model answers is chosen per
 * request by passing a deployment name as `model` (reasoning or routing).
 */
export function createAzureClient(config: AzureConfig): AzureOpenAI {
  return new AzureOpenAI({
    endpoint: config.endpoint,
    apiKey: config.apiKey,
    apiVersion: config.apiVersion,
  });
}
