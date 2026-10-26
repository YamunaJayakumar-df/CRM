// Entry point: starts the HTTP server on a real port.
// All routes live in app.ts; this file only reads config and listens.
import "./env.js"; // must stay the first import: loads backend/.env
import { createApp } from "./app.js";

const DEFAULT_PORT = 4000;

/** Read PORT from the environment, falling back to DEFAULT_PORT. */
function readPort(): number {
  const rawPort = process.env.PORT;
  if (rawPort === undefined || rawPort.trim() === "") {
    return DEFAULT_PORT;
  }

  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    // Fail loudly: silently using another port would be confusing.
    throw new Error(
      `Invalid PORT "${rawPort}": must be a whole number from 1 to 65535.`,
    );
  }
  return port;
}

const port = readPort();

createApp().listen(port, () => {
  console.log(`CRM backend listening on http://localhost:${port}`);
});
