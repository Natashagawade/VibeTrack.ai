# Contributing to VibeTrack AI

## Setup

```bash
npm install          # also runs `prisma generate` via postinstall
cp .env.example .env.local
npm run dev
```

Most modules run with zero configuration (local analysis engine, OCR, PDF/DOCX
extraction, URL scraping). Add `OPENAI_API_KEY` to `.env.local` to unlock
AI-graded scoring, Whisper transcription, and vision analysis. Add
`DATABASE_URL` to unlock accounts and persistence — see `.env.example` for
every optional key.

## Before opening a PR

```bash
npm run lint
npm test
npm run build
```

A pre-commit hook (Husky + lint-staged) runs ESLint and Prettier on staged
files automatically once you run `npm install` inside a git repo.

## Code style

- TypeScript strict mode; no `any` without a comment explaining why.
- Components in `src/components`, one responsibility per file.
- Business logic belongs in `src/lib`, not inside page components — pages
  should mostly wire hooks/fetches to UI.
- New AI-backed features should follow the existing pattern: real
  computation with a documented local fallback when no API key is present,
  never a hardcoded/mocked result.

## Commit messages

Conventional style is preferred but not enforced: `feat:`, `fix:`, `docs:`,
`refactor:`, `test:`, `chore:`.
