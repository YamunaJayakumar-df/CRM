// Reads the Azure OpenAI settings from the environment (backend/.env).
//
// Why a separate file: every AI feature needs these five settings, and a
// missing one should fail EARLY with a clear message ("AZURE_OPENAI_API_KEY
// is missing") instead of a confusing network error later.
// Secret values are never printed or put in error messages: errors only
// name the setting that is missing or wrong.

/** The five settings, as given by the team (see backend/.env.example). */
export type AzureConfig = {
  /** Our company's Azure OpenAI address, e.g. https://example.openai.azure.com/ */
  endpoint: string;
  /** Secret password for that address. Never log it. */
  apiKey: string;
  /** Which version of the Azure OpenAI API to speak, e.g. "2024-10-21". */
  apiVersion: string;
  /** Deployment (model) name for careful work: understanding and actions. */
  reasoningDeployment: string;
  /** Deployment (model) name for quick work: deciding what kind of request it is. */
  routingDeployment: string;
};

// Environment variable name for each setting.
const ENV_NAMES: Record<keyof AzureConfig, string> = {
  endpoint: "AZURE_OPENAI_ENDPOINT",
  apiKey: "AZURE_OPENAI_API_KEY",
  apiVersion: "AZURE_OPENAI_API_VERSION",
  reasoningDeployment: "AZURE_OPENAI_DEPLOYMENT_REASONING",
  routingDeployment: "AZURE_OPENAI_DEPLOYMENT_ROUTING",
};

/**
 * Read and check the Azure settings. `env` defaults to process.env; tests
 * pass their own object. Throws ONE error that lists every problem.
 */
export function readAzureConfig(env: NodeJS.ProcessEnv = process.env): AzureConfig {
  const problems: string[] = [];

  const read = (key: keyof AzureConfig): string => {
    const value = (env[ENV_NAMES[key]] ?? "").trim();
    if (value === "") {
      problems.push(`${ENV_NAMES[key]} is missing`);
    }
    return value;
  };

  const config: AzureConfig = {
    endpoint: read("endpoint"),
    apiKey: read("apiKey"),
    apiVersion: read("apiVersion"),
    reasoningDeployment: read("reasoningDeployment"),
    routingDeployment: read("routingDeployment"),
  };

  // The key would travel over the internet, so the address must be https.
  if (config.endpoint !== "" && !config.endpoint.startsWith("https://")) {
    problems.push(`${ENV_NAMES.endpoint} must start with https://`);
  }

  if (problems.length > 0) {
    throw new Error(
      `Azure OpenAI settings in backend/.env are not complete:\n  - ${problems.join("\n  - ")}`,
    );
  }
  return config;
}
