# BuildIDE MVP v0.1

Browser IDE + AI coding agent. WebContainers run apps in-browser (zero server cost), agent writes files via OpenRouter (BYOK — user's own key, no token markup).

## Stack
- Next.js 15 (App Router) + React 19 + Tailwind
- WebContainers (@webcontainer/api) — in-browser Node runtime
- Monaco editor
- Turso (libSQL/SQLite edge DB) — projects API at `/api/projects`, Save button in IDE
- Supabase (auth — stub only, phase 2)
- OpenRouter proxy at `/api/chat` with hybrid model router

## Run
```bash
npm install
cp .env.example .env.local   # fill values (or leave blank — IDE works without Supabase)
npm run dev
```
Open http://localhost:3000 → click "Launch IDE" → paste a free OpenRouter key → start prompting.

## How it works
1. User enters OpenRouter key (stored in browser localStorage only, never on server).
2. Chat message → `/api/chat` → hybrid router picks free or frontier model → OpenRouter.
3. Agent replies with explanation + a ```files JSON block of complete file contents.
4. Client applies files to WebContainer, runs `npm install` + `npm run dev`, shows live iframe preview.

## Monetization (phase 2 — not yet implemented)
- Pro $15/mo via Stripe (unlimited prompts, priority routing)
- Free tier: 10 prompts/day (client-side counter — add server enforcement with Supabase)
- BYOK = $0 model cost to you.

## Roadmap
- [x] Landing page (SEO), IDE, agent loop, preview, router
- [ ] Supabase auth + server-side credit enforcement
- [ ] Stripe checkout + webhook
- [ ] GitHub push / deploy
- [ ] Templates gallery
