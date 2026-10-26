// Tests for createApp(). supertest sends fake HTTP requests straight to the
// app in memory, so no real port is opened (that's why we never import server.ts).
//
// app.ts loads the customer routes, which import the database client from db.ts.
// vi.mock replaces db.ts with an empty fake, so these tests never connect to the
// real database and do not need DATABASE_URL. (Vitest moves vi.mock to the top
// of the file automatically, so it runs before app.js is imported.)
import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

vi.mock("./db.js", () => ({ prisma: {} }));

describe("createApp", () => {
  // Protects the health check that developers and uptime monitors rely on.
  it("GET /health returns 200 with JSON body { ok: true }", async () => {
    const res = await request(createApp()).get("/health");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toEqual({ ok: true });
  });

  // Protects against accidentally adding a catch-all route that answers every URL.
  it("returns 404 for an unknown route", async () => {
    const res = await request(createApp()).get("/does-not-exist");

    expect(res.status).toBe(404);
  });

  // Protects that /health only answers GET; other methods are not handled.
  it("POST /health is not handled and returns 404", async () => {
    const res = await request(createApp()).post("/health").send({});

    expect(res.status).toBe(404);
  });
});
