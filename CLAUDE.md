# Sherlock Ops — notes for Claude Code

A prototype service-operations app for a commercial security company (interview demo).
The owner is NOT a programmer: explain changes in plain English, one step at a time,
and tell them exactly what to click/run to test.

## Tech
- Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS v4.
- Run locally: `npm install` then `npm run dev` → http://localhost:3000
- Check for errors before committing: `npm run build`

## Where things live
- `src/lib/types.ts` — data shapes (Ticket, Technician, categories, priorities). Start here for new fields.
- `src/lib/store.tsx` — the ONLY place data is read/saved. Currently browser localStorage.
  Swap this for a database / Google Sheets later without touching pages.
- `src/lib/sla.ts` — due-time rules per priority (what counts as "overdue").
- `src/lib/recommend.ts` — rule-based technician suggestions.
- `src/data/` — fictional seed data (25 technicians, ~30 tickets, dates relative to "now").
- `src/app/` — pages: `/` dashboard, `/tickets`, `/tickets/[id]`, `/tickets/new`, `/technicians`.
- `src/components/` — shared UI (sidebar menu, badges, stat cards).

## Rules (do not break)
- Fictional data only. Never connect real company systems without explicit authorization.
- Never commit secrets. API keys go in `.env.local` (git-ignored), never in code.
- The app must NEVER contact police/fire/emergency services. Urgent items are flagged
  for human review (`needsReview`) — a person decides.

## Roadmap
1. ✅ Stage 1: dashboard, tickets, technicians, fictional data.
2. Stage 2: paste an email → Claude API extracts a structured ticket (server-side API route, key in `.env.local`).
3. Stage 3: Gmail (test account) → tickets; Google Sheets sync. OAuth, test data only.
4. Stage 4: AI daily management summary; optional scheduled email.
