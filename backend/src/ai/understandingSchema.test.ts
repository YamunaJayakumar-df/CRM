// Tests that our form follows Azure's strict-mode rules.
// If one of these fails, Azure would reject the request with a 400 error.
import { describe, expect, it } from "vitest";
import { NOTE_UNDERSTANDING_FORMAT, NOTE_UNDERSTANDING_SCHEMA } from "./understandingSchema.js";

type SchemaNode = {
  type?: unknown;
  properties?: Record<string, SchemaNode>;
  required?: string[];
  additionalProperties?: unknown;
  items?: SchemaNode;
  anyOf?: SchemaNode[];
  enum?: unknown[];
};

/** Every object in the schema, found by walking into properties, items and anyOf. */
function allObjects(node: SchemaNode): SchemaNode[] {
  const found: SchemaNode[] = node.properties ? [node] : [];
  for (const child of Object.values(node.properties ?? {})) {
    found.push(...allObjects(child));
  }
  if (node.items) {
    found.push(...allObjects(node.items));
  }
  for (const option of node.anyOf ?? []) {
    found.push(...allObjects(option));
  }
  return found;
}

const schema = NOTE_UNDERSTANDING_SCHEMA as SchemaNode;

describe("NOTE_UNDERSTANDING_SCHEMA", () => {
  const objects = allObjects(schema);

  it("contains the four objects: answer, customer, interaction, follow-up", () => {
    expect(objects).toHaveLength(4);
  });

  it("lists every field as required in every object", () => {
    for (const object of objects) {
      expect([...(object.required ?? [])].sort()).toEqual(Object.keys(object.properties ?? {}).sort());
    }
  });

  it("allows no extra fields in any object", () => {
    for (const object of objects) {
      expect(object.additionalProperties).toBe(false);
    }
  });

  it("only allows the CRM's interaction types and priorities", () => {
    const customer = schema.properties?.customers?.items;
    const interaction = customer?.properties?.interaction?.anyOf?.[0];
    const followUp = customer?.properties?.followUps?.items;
    expect(interaction?.properties?.type?.enum).toEqual(["CALL", "EMAIL", "MEETING", "NOTE"]);
    expect(followUp?.properties?.priority?.enum).toEqual(["LOW", "MEDIUM", "HIGH"]);
  });

  it("is sent in strict mode", () => {
    expect(NOTE_UNDERSTANDING_FORMAT.json_schema.strict).toBe(true);
  });
});
