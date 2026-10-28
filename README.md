# Sherlock Ops — Service Operations Prototype

A web app for managing service requests at a commercial security company:
an operations dashboard, service tickets, and technician management.
**All data is fictional.** This is a demo and is not connected to any real company system.

## What it does (Stage 1)
- **Dashboard**: open, overdue, and "needs review" tickets, the job pipeline, technician workload, and tickets by type.
- **Service Tickets**: search and filter tickets. Open one to change its status or priority, assign a technician, and add notes.
- **Suggested technicians**: chosen by skill and current workload. A person always makes the final choice.
- **Technicians**: 25 fictional techs with their skills, certifications, availability, vans, and open jobs.
- **Email → Ticket (AI)**: paste a customer email; Claude fills in the customer, address, problem type, priority and anything missing. A person checks it and clicks Create.
- **Location matching**: technicians in the customer's zone are suggested first.
- **Technician View** (`/me`): a phone-friendly page where a tech marks "In today" / "Out today" and starts or completes jobs. Marking "Out" flags their jobs for the office to reassign.
- **🤖 Autopilot**: routine emails become tickets automatically, technicians are assigned and reassigned automatically, and overdue jobs are escalated. Staff only see the exceptions. Each automation can be switched on or off, every action is logged with an Undo, and the dashboard shows the estimated hours saved.
- **Human review**: urgent tickets are flagged for a person. The app never contacts emergency services.

Changes are saved in your web browser. Click **Reset demo data** (bottom left) to start fresh.

## Run it on your computer
1. Install **Node.js** (the "LTS" version) from https://nodejs.org
2. Open a terminal in this folder and run:
   ```
   npm install
   npm run dev
   ```
3. Open http://localhost:3000 in your browser.
4. For the AI feature: copy `.env.example` to `.env.local` and paste your Anthropic API key into it.

## Changing things
Ask Claude Code in plain English, e.g. *"Add a 'Contract number' field to tickets"*.
`CLAUDE.md` explains where everything lives.
