// Small helpers shared by our AI lesson scripts (npm run ai:hello, ai:prompt).
import { APIConnectionError, APIError, AuthenticationError, NotFoundError } from "openai";
import { readAzureConfig, type AzureConfig } from "./azureConfig.js";

/** Read the settings, or print what is missing and stop. */
export function loadConfigOrExit(): AzureConfig {
  try {
    return readAzureConfig();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/** Explain a failed request in plain words (never prints the key). */
export function explainError(error: unknown): string {
  if (error instanceof AuthenticationError) {
    return "The key was refused. Check AZURE_OPENAI_API_KEY in backend/.env.";
  }
  if (error instanceof NotFoundError) {
    return "Not found. Check the deployment names and AZURE_OPENAI_API_VERSION in backend/.env.";
  }
  if (error instanceof APIConnectionError) {
    return "Could not reach Azure. Check AZURE_OPENAI_ENDPOINT and your internet connection.";
  }
  if (error instanceof APIError) {
    return `Azure answered with an error (status ${error.status}): ${error.message}`;
  }
  return String(error);
}
