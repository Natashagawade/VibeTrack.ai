# VibeTrack — Customer Intelligence & Action Platform

*Understand your customers. Know what to do next.*

VibeTrack turns feedback from every channel — reviews, support tickets, chats,
calls, surveys, CSVs, documents, and URLs — into a single **signal stream**.
Each signal is classified deterministically (intent, issue category, severity),
then ran through intelligence engines that surface **issues, insights,
customer risk, competitor mentions, opportunities, and actions** for your team.

Every number in the product is computed from signals you actually stored. There
is **no placeholder data and no fabricated metric**: the seed script is a no-op
and the smart empty states tell you exactly how to start.

---

## The platform model

```
Feedback (any channel)
        │  capture: text, CSV/Excel, URL, image, audio, documents, …
        ▼
CustomerSignal  ── normalized + sha256-deduplicated + classified
        │         intent (complaint / refund / cancel / feature_request / praise / question)
        │         issue category (delivery, billing, login, support, …) · severity (LOW→CRITICAL)
        ├─► Issues            recurring problems, bucketed and ranked
        ├─► Insights          weekly: sentiment swings, issue surges, refund
        │                     anomalies, feature waves, competitor mentions
        ├─► Customer risk     explainable 0–100 score with recorded reasons
        ├─► Competitors       mention tracking, week over week
        ├─► Opportunities     feature demand with evidence
        └─► Actions           HIGH/CRITICAL insights → assignable, prioritized
```

Key properties:

- **Deterministic classification** in `src/lib/analysis.ts` — word-boundary
  matching for issue buckets, an emotional lexicon for sentiment, and severity
  rules that flag furious complaints as CRITICAL. Unit-tested, no randomness.
- **AI first, local always** — the pipeline tries OpenAI when a healthy key
  exists and falls back to the local engine the moment it doesn't (including a
  zero-credit key). Nothing blocks on the network.
- **Tenant-scoped** — everything hangs off `Organization`; API keys are stored
  as sha256 hashes and can ingest signals headlessly.

## Stack

- **Next.js 16** (App Router, React 19, Turbopack) + **TypeScript**
- **Prisma 7** driver adapter + **Postgres** (Neon), **Redis** (Upstash)
- **Auth.js v5** beta (credentials + Google/GitHub OAuth), JWT sessions
- **Tailwind v4**, **recharts**, **Vitest**, ESLint, Husky, GitHub Actions CI

## Database

Multi-tenant schema (30 tables) migrated against the live Postgres in two
tracked migrations:

- `prisma/migrations/0_init` — baseline extracted from the pre-existing DB
- `prisma/migrations/20260905000000_vibetrack_customer_intelligence` — additive
  platform tables (signals, issues, insights, risks, actions, integrations,
  audit log, API keys, …)

New environments: `npx prisma migrate deploy`. The legacy `User`/`Account`
rows (and the old `Project`/`Analysis`/`Report` models) are preserved — the
migration is strictly additive on those tables.

## Quick start

```bash
npm install               # runs `prisma generate` via postinstall
cp .env.example .env.local
npx prisma migrate deploy # optional — only if you have your own DATABASE_URL
npm run dev
```

Open http://localhost:3000. The app is public — there is no sign-in. Everything
in the capture tools runs on the local engine with zero keys. Add
`OPENAI_API_KEY` to unlock AI-graded scoring, Whisper transcription, and vision.
Add `DATABASE_URL` to persist signals and intelligence (until then the app shows
a note that nothing is being saved).

### With Docker

```bash
docker compose up --build
```

## Testing & checks

```bash
npm test           # 42 unit tests — analysis engine, pipeline helpers, batch
npm run lint       # ESLint — 0 errors
npm run build      # Next.js production build + typecheck
npx prisma validate
```

CI (`.github/workflows/ci.yml`) runs lint, tests, `prisma generate`, and the
build on every push.

## What's real vs. what's not

| Area | Status |
|---|---|
| Signal pipeline + dedupe + classification | **Real** — `ingestSignal` persists every analyzed input as a CustomerSignal |
| Intelligence (issues, insights, risk, competitors, actions) | **Real** — deterministic engines over stored signals, unit-tested |
| Dashboard (Overview, Signals, Issues, Insights, Customers, Competitors, Opportunities, Actions, Integrations) | **Real** — server-rendered from your org's data with honest empty states |
| Auth & tenancy (org auto-provisioning, shared public workspace) | **Real** — tested against the live Neon DB |
| API (analyze/text, signals, intelligence, insights, bearer keys) | **Real** — bearer key + shared-workspace auth, audit-logged |
| Capture tools | Text, CSV/Excel, URL, Images (OCR + on-device facial expression) run locally. Audio needs OpenAI Whisper; AI caption/scene labels need a vision key. Document connectors are thin shells |
| External connectors (Zendesk, Intercom, Slack, Jira, Linear) | **Schema + Integrations UI only** — rows are `NOT_CONFIGURED`; no live OAuth connector yet |
| Ask VibeTrack (chat over your data) | **Not built** — the Signals/search UX is the placeholder |
| Social listening | **Not implemented** — page exists and is labeled honestly. Brand monitoring **is** real, over your own signals |
| Rate limiting | In-memory, single-instance — swap for Redis-backed before running >1 instance |

## Repository layout

```
src/
  lib/                    domain logic (analysis, org, authz, audit, signals, intelligence)
  app/api/                route handlers (analyze/*, signals, intelligence, insights, auth)
  app/(dashboard)/        platform UI (overview + module pages)
  app/                    landing, auth pages
  components/             UI + dashboard + landing components
prisma/
  schema.prisma           full multi-tenant data model
  migrations/             applied DB history
docs/
  ARCHITECTURE.md         request flow, folder structure, auth
  API.md                  route contracts
```

## Documentation

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — request flow, auth/tenant
  resolution, folder structure
- [`docs/API.md`](./docs/API.md) — route-by-route contracts
- [`prisma/schema.prisma`](./prisma/schema.prisma) — full data model
- [`.env.example`](./.env.example) — supported environment variables
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — setup, style, commit conventions

## License

MIT — see [`LICENSE`](./LICENSE).