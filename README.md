# VibeTrack AI 2.0

*Understand Emotions. Discover Insights.*

A multimodal sentiment intelligence platform — text, images, audio, PDFs,
DOCX, CSV/Excel, and URLs, scored through a real analysis engine that
upgrades to GPT-4o-mini when you provide an API key, and stays fully
functional on a deterministic local engine when you don't.

This README doubles as a production-readiness audit. Every claim below is
backed by something you can run and check yourself — `npm test`, `npm run
build`, `npm run lint` — not a self-reported percentage.

---

## Quick start

```bash
npm install              # also runs `prisma generate` (needs network)
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. **Everything works with zero keys**: Text, CSV,
Documents, Image (OCR), and URL analysis all run on the local engine.
Add `OPENAI_API_KEY` to unlock AI-graded scoring, Whisper audio
transcription, and GPT-4o-mini vision. Add `DATABASE_URL` to unlock real
accounts (until then, the dashboard runs in an open "demo mode" — see the
banner).

### With Docker

```bash
docker compose up --build
```

Runs the app + Postgres + Redis together. Requires `.env.local` to exist
(even if mostly empty) since `docker-compose.yml` reads it.

## What's real vs. what's staged

| Area | Status |
|---|---|
| Text / CSV / Documents / URL analysis | **Real.** Local lexicon engine always works; upgrades to GPT-4o-mini automatically when `OPENAI_API_KEY` is set |
| Audio analysis | **Real**, requires `OPENAI_API_KEY` (Whisper) — no local fallback exists for speech-to-text, and it says so |
| Image analysis | **Real.** OCR + pixel color analysis work with zero keys; AI vision (caption/scene/objects) needs `OPENAI_API_KEY` |
| Auth (credentials + Google/GitHub OAuth) | **Real code**, not yet database-tested in this environment (see Known Limitations) |
| Prisma schema | **Real**, complete data model, not yet migrated against a live Postgres instance here |
| Security headers, rate limiting | **Real**, but rate limiting is in-memory/single-instance — swap for Redis before running >1 instance |
| Docker / CI / tests / lint / Prettier / Husky | **Real** and independently runnable |
| Video, Social listening, Brand monitoring | **Not implemented.** Need ffmpeg frame/audio extraction, platform OAuth apps, and scheduled crawling respectively — flagged honestly in the UI rather than faked |
| Admin panel, translation, NER, sarcasm/spam/fake-review detection, AI chat-over-data, PDF/Excel report export | **Not implemented** |

## Known limitations (read before you demo this)

1. **Prisma Client isn't generated in this repo as shipped.** `prisma
   generate` needs to download engine binaries from Prisma's CDN. Run
   `npm install` (which triggers this via `postinstall`) on a machine with
   normal internet access and it resolves in seconds — this is standard for
   any Prisma project, not a bug specific to this codebase.
2. **Auth is untested against a live database.** The code is written
   correctly against Auth.js v5's documented patterns (including the
   Edge/Node config split — see `docs/ARCHITECTURE.md`), but I have not
   been able to run `prisma migrate dev` and click through a real signup
   in this environment. Test this yourself before relying on it.
3. **In-memory rate limiting** resets on every server restart and doesn't
   coordinate across multiple instances. Fine for a single deployment or a
   demo; replace with Redis-backed limiting for real production traffic.
4. **CSV/batch analysis intentionally does not call the AI engine** per
   row, to avoid an unbounded OpenAI bill on a 10,000-row upload. It's the
   local engine only, always. Worth revisiting with batching/queueing.

## Testing

```bash
npm test          # 23 unit tests against the local analysis engines — real assertions
npm run lint       # ESLint — currently 0 errors, 1 non-blocking warning
npm run build      # Next.js production build
```

I have verified `lint`, `test`, and `build` (with the Prisma-dependent files
temporarily isolated to confirm the rest of the app) pass cleanly in this
environment. I have **not** verified a full build with a live
`DATABASE_URL` and a generated Prisma client, for the network reason above.

## Documentation

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — request flow, folder
  structure, the auth Edge/Node split, data model summary
- [`docs/API.md`](./docs/API.md) — every route, its contract, its rate limit
- [`prisma/schema.prisma`](./prisma/schema.prisma) — full data model
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — dev setup, code style, commit conventions
- [`.env.example`](./.env.example) — every supported environment variable, documented

## Honest scorecard

Scored against the full original feature brief (12 content-type modules,
full backend, DB, auth, social listening, brand monitoring, admin panel,
reporting, deployment):

| Metric | Score | Why |
|---|---|---|
| Feature-complete vs. brief | ~40% | 5 of 12 content modules fully real; auth/DB/security/DevOps scaffolded; social/brand/video/admin/translation/NER not built |
| Code quality / architecture | Strong | Clean separation (lib/components/app), typed throughout, real tests, honest fallback pattern used consistently |
| Deployment readiness | Not yet | Needs: a provisioned Postgres + `prisma migrate deploy`, real OAuth app credentials, a live click-through of the auth flow, and Redis if deploying >1 instance |
| Resume/portfolio readiness | Good, if described accurately | The engine-fallback architecture, the Edge/Node auth split bug-fix, and the real test suite are more interesting to talk about in an interview than a fabricated "100% complete" claim would be |
| Security | Reasonable baseline | Headers, rate limiting, bcrypt hashing, input validation with zod, no secrets in code — but no pen-testing, no CSRF-specific hardening beyond Auth.js defaults, and dependency vulnerabilities haven't been audited (the `npm audit` registry endpoint was unreliable in this sandbox — run it yourself after install) |

I'm not giving this a numeric "/100" — a single number implies a precision
this audit doesn't have. The table above is the actual assessment.

## License

MIT — see [`LICENSE`](./LICENSE).
