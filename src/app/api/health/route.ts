// Health check endpoint: GET /api/health
//
// A tiny "is the app alive?" URL. Developers, tests, and (later) hosting
// platforms or uptime monitors can call it to confirm the server is running.
// It deliberately touches nothing else (no database, no secrets), so it
// stays fast and safe to expose.
export function GET() {
  return Response.json({ ok: true }, { status: 200 });
}
