// Builds the Express app (all routes and middleware) WITHOUT starting it.
//
// Why app.ts and server.ts are separate: tests import createApp() and send
// fake requests to it with supertest, so no real network port is opened.
// Only server.ts actually listens on a port.
import express from "express";
import { aiRouter } from "./ai/aiRoutes.js";
import { customerRouter } from "./customers/customerRoutes.js";
import { dashboardRouter } from "./dashboard/dashboardRoutes.js";
import { followUpRouter } from "./followUps/followUpRoutes.js";
import { interactionRouter } from "./interactions/interactionRoutes.js";
import {
  handleInvalidJson,
  handleUnexpectedError,
} from "./shared/errorHandler.js";

/**
 * Create a new, fully configured Express app.
 * Returns the app; call `.listen(port)` on it to start serving.
 */
export function createApp() {
  const app = express();

  // Don't advertise "X-Powered-By: Express" on every response
  // (it tells attackers which framework to target).
  app.disable("x-powered-by");

  // Parse JSON request bodies into req.body (used by POST/PATCH routes).
  app.use(express.json());

  // Health check: a tiny "is the server alive?" URL for developers,
  // tests, and uptime monitors. Touches no database or secrets.
  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  // Feature routes: every URL starting with /customers goes to customerRouter, etc.
  app.use("/customers", customerRouter);
  app.use("/interactions", interactionRouter);
  app.use("/follow-ups", followUpRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/ai", aiRouter);

  // Error handlers must come LAST so they catch errors from everything above.
  app.use(handleInvalidJson);
  app.use(handleUnexpectedError);

  return app;
}
