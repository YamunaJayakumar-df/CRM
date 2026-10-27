// Tests for reading the Azure OpenAI settings.
// They use made-up values only; no real key and no network.
import { describe, expect, it } from "vitest";
import { readAzureConfig } from "./azureConfig.js";

const COMPLETE_ENV = {
  AZURE_OPENAI_ENDPOINT: "https://example.openai.azure.com/",
  AZURE_OPENAI_API_KEY: "test-key-not-real",
  AZURE_OPENAI_API_VERSION: "2024-10-21",
  AZURE_OPENAI_DEPLOYMENT_REASONING: "reasoning-model",
  AZURE_OPENAI_DEPLOYMENT_ROUTING: "routing-model",
};

describe("readAzureConfig", () => {
  it("reads all five settings and trims spaces", () => {
    const config = readAzureConfig({ ...COMPLETE_ENV, AZURE_OPENAI_API_VERSION: " 2024-10-21 " });
    expect(config).toEqual({
      endpoint: "https://example.openai.azure.com/",
      apiKey: "test-key-not-real",
      apiVersion: "2024-10-21",
      reasoningDeployment: "reasoning-model",
      routingDeployment: "routing-model",
    });
  });

  it("names every missing setting in one error", () => {
    expect(() => readAzureConfig({ AZURE_OPENAI_ENDPOINT: "https://example.openai.azure.com/" })).toThrow(
      /AZURE_OPENAI_API_KEY is missing[\s\S]*AZURE_OPENAI_API_VERSION is missing[\s\S]*AZURE_OPENAI_DEPLOYMENT_REASONING is missing[\s\S]*AZURE_OPENAI_DEPLOYMENT_ROUTING is missing/,
    );
  });

  it("treats blank values as missing", () => {
    expect(() => readAzureConfig({ ...COMPLETE_ENV, AZURE_OPENAI_API_KEY: "   " })).toThrow(
      /AZURE_OPENAI_API_KEY is missing/,
    );
  });

  it("rejects an endpoint that is not https", () => {
    expect(() =>
      readAzureConfig({ ...COMPLETE_ENV, AZURE_OPENAI_ENDPOINT: "http://example.openai.azure.com/" }),
    ).toThrow(/must start with https:\/\//);
  });

  // Protects the key: error messages name settings, never their values.
  it("never puts the key in the error message", () => {
    try {
      readAzureConfig({ ...COMPLETE_ENV, AZURE_OPENAI_ENDPOINT: "http://wrong" });
      expect.unreachable();
    } catch (error) {
      expect(String(error)).not.toContain("test-key-not-real");
    }
  });
});
