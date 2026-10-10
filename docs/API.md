# API reference

All routes are Next.js Route Handlers under `src/app/api`. No separate
Express server exists — see the README for why.

## POST /api/analyze/text
Body: `{ "text": string (1–20,000 chars) }`
Response: `{ result: FullTextAnalysis, engine: "openai:gpt-4o-mini" | "local" }`
Rate limit: 30 req/min per IP. Falls back to the local engine if
`OPENAI_API_KEY` is unset or the OpenAI call fails.

## POST /api/analyze/audio
Body: `multipart/form-data` with field `audio` (max 25MB).
Response: `{ transcript: string, result: FullTextAnalysis, engine }`
Requires `OPENAI_API_KEY` (Whisper) — returns `501` with a clear message if
unset. Rate limit: 10 req/min per IP.

## POST /api/analyze/image
Body: `{ "imageDataUrl": string }` (base64 data URL, ~13MB image max).
Response: `{ result: VisionAnalysis, engine: "openai:gpt-4o-mini" }`
Requires `OPENAI_API_KEY` — returns `501` if unset. Rate limit: 15 req/min.

## POST /api/analyze/url
Body: `{ "url": string }` (http/https only).
Response: `{ title: string, text: string, url: string }`
Server-side fetch + HTML-to-text extraction. No key required. 10s timeout,
rejects non-HTML responses.

## GET /api/config
Response: booleans for which service env vars are set (`openai`, `gemini`,
`database`, `googleOAuth`, etc.) — never returns actual key values.

## GET /api/health
Response: `{ status: "ok", service, timestamp }` — for uptime monitors and
container orchestrators (`Dockerfile` HEALTHCHECK points here).

## /api/auth/[...nextauth]
Auth.js catch-all (session + CSRF endpoints). The app is public — there is no
sign-in UI — so this is retained only so any pre-existing session cookie still
resolves. See `src/lib/auth.ts`.

---

**Not yet implemented as API routes:** batch CSV analysis is intentionally
client-side only (to avoid burning API quota scoring hundreds of rows per
upload) — see `src/lib/batch-analysis.ts`. Social, Brand monitoring, and
Video have no routes yet; they need third-party OAuth apps or a frame/audio
extraction pipeline that don't exist in this codebase.

No OpenAPI/Swagger spec is generated yet — the routes above are simple
enough that this file is currently the source of truth. Adding
`next-swagger-doc` or hand-written OpenAPI YAML is a reasonable next step
once the API surface stabilizes.
