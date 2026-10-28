# Sherlock Ops — notes for Claude Code

A prototype service-operations app for a commercial security company (interview demo).
The owner is NOT a programmer: explain changes in plain English, one step at a time,
and tell them exactly what to click/run to test.

## Tech
- Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS v4.
- Run locally: `npm install` then `npm run dev` → http://localhost:3000
- Hosted on Vercel (auto-deploys from GitHub `main`). Repo: helloall33/Adam-Goldfeder.
- Check for errors before committing: `npm run build`

## Where things live
- `src/lib/types.ts` — data shapes (Ticket, Technician, categories, priorities). Start here for new fields.
- `src/lib/store.tsx` — the ONLY place data is read/saved. Currently browser localStorage.
  Swap this for a database / Google Sheets later without touching pages.
- `src/lib/sla.ts` — due-time rules per priority (what counts as "overdue").
- `src/lib/recommend.ts` — rule-based technician suggestions (skill, duty, same zone, workload). Weights at top.
- `src/lib/automation.ts` — the Autopilot: auto-assign, reassign when a tech is out, escalate overdue,
  `canAutomate()` safety rule, minutes-saved estimates, undo. Runs after every change (see `update()` in store).
- `src/app/automation/page.tsx` — Autopilot on/off switches + activity log.
- `src/lib/ai.ts` — ALL Claude API code (server-only). Prompt/instructions + output schema for email → ticket.
- `src/app/api/parse-email/route.ts` — server endpoint the browser calls; needs `ANTHROPIC_API_KEY`.
- `src/data/` — fictional seed data (25 technicians, ~30 tickets, dates relative to "now").
- `src/app/` — pages: `/` dashboard, `/tickets`, `/tickets/[id]`, `/tickets/new`, `/tickets/from-email` (AI),
  `/technicians`, `/me` (technician phone view — demo picks a tech instead of logging in).
- `src/components/` — shared UI (sidebar menu, badges, stat cards, `TicketForm` used by manual + AI pages).
- `src/data/sampleEmails.ts` — fake customer emails for demoing the AI.
- Changing the data shape? Bump `STORAGE_KEY` in `store.tsx` so browsers reload fresh demo data.

## Rules (do not break)
- Fictional data only. Never connect real company systems without explicit authorization.
- Never commit secrets. API keys go in `.env.local` (git-ignored), never in code.
- The app must NEVER contact police/fire/emergency services. Urgent items are flagged
  for human review (`needsReview`) — a person decides.
- The Autopilot must never act on Critical, Fire Alarm, flagged, or person-overridden (`manualOnly`) tickets.
  Every automatic action is logged with an Undo.

## Roadmap
1. ✅ Stage 1: dashboard, tickets, technicians, fictional data. + zone matching, technician phone view.
2. ✅ Stage 2: paste an email → Claude extracts a structured ticket; a person reviews before creating.
   Key: `.env.local` locally, Vercel → Settings → Environment Variables in production.
2b. ✅ Autopilot: routine work automated, people handle exceptions only.
3. Stage 3: Gmail (test account) → tickets; Google Sheets sync. OAuth, test data only.
4. Stage 4: AI daily management summary; optional scheduled email.
