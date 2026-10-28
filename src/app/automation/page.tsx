"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { MINUTES_SAVED, minutesSaved } from "@/lib/automation";
import { formatDateTime } from "@/lib/format";
import type { AutomationKind, AutomationSettings } from "@/lib/types";

// Each switch on this page. Edit the wording here.
const SWITCHES: { key: keyof AutomationSettings; kind: AutomationKind; title: string; description: string }[] = [
  { key: "autoCreateFromEmail", kind: "create", title: "Create tickets from emails", description: "When the AI reads a routine email, the ticket is created instantly. No one has to check the form." },
  { key: "autoAssign", kind: "assign", title: "Assign technicians", description: "New jobs go to the best technician: right skills, same zone, lightest workload." },
  { key: "autoReassign", kind: "reassign", title: "Reassign when a tech is out", description: "When a technician marks themselves out, their jobs move to the next best technician." },
  { key: "autoEscalate", kind: "escalate", title: "Escalate overdue jobs", description: "Late jobs are raised one priority level and sent to a person." },
];

const ALWAYS_HUMAN = [
  "Critical priority jobs",
  "Fire alarm and life-safety systems",
  "Possible emergencies (the app never contacts emergency services)",
  "Anything the AI flags as unusual",
  "Jobs where a person has overridden the Autopilot",
];

const KIND_LABEL: Record<AutomationKind, string> = { create: "Created", assign: "Assigned", reassign: "Reassigned", escalate: "Escalated" };

export default function AutomationPage() {
  const { data, setAutomation, undoAutomation } = useStore();
  const { settings, log } = data.automation;
  const active = log.filter((e) => !e.undone);
  const hours = (minutesSaved(log) / 60).toFixed(1);

  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">🤖 Autopilot</h1>
        <p className="text-sm text-slate-500">Routine work the system does by itself, so people only handle the exceptions.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Hours saved</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">{hours}h</div>
          <div className="text-xs text-slate-500">estimated office time</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Automatic actions</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">{active.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Left for a person</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">{data.tickets.filter((t) => t.needsReview).length}</div>
          <Link href="/tickets?filter=review" className="text-xs text-blue-700 hover:underline">View →</Link>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Undone by staff</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">{log.length - active.length}</div>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
          <h2 className="px-4 py-3 text-sm font-semibold">What the Autopilot does</h2>
          {SWITCHES.map((s) => (
            <label key={s.key} className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={settings[s.key]}
                onChange={(e) => setAutomation({ [s.key]: e.target.checked })}
                className="mt-1 h-5 w-5 accent-blue-700"
              />
              <span className="flex-1">
                <span className="block text-sm font-medium">{s.title} <span className={`ml-1 text-xs ${settings[s.key] ? "text-emerald-700" : "text-slate-400"}`}>{settings[s.key] ? "ON" : "OFF"}</span></span>
                <span className="block text-xs text-slate-500">{s.description}</span>
                <span className="block text-xs text-slate-400">Saves about {MINUTES_SAVED[s.kind]} min each time</span>
              </span>
            </label>
          ))}
        </section>

        <section className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold mb-2">🔒 Always handled by a person</h2>
          <p className="text-xs text-slate-500 mb-3">These can&apos;t be switched to Autopilot. A wrong automatic decision here could put people or property at risk.</p>
          <ul className="space-y-2 text-sm">
            {ALWAYS_HUMAN.map((r) => <li key={r} className="flex gap-2"><span>🔒</span>{r}</li>)}
          </ul>
        </section>
      </div>

      <section className="bg-white rounded-lg border border-slate-200">
        <h2 className="px-4 py-3 text-sm font-semibold border-b border-slate-200">Activity log</h2>
        {log.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No automatic actions yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {log.slice(0, 50).map((e) => (
              <li key={e.id} className={`flex flex-wrap items-center gap-2 px-4 py-2 text-sm ${e.undone ? "opacity-50 line-through" : ""}`}>
                <span className="w-24 text-xs font-medium text-slate-500">{KIND_LABEL[e.kind]}</span>
                <Link href={`/tickets/${e.ticketId}`} className="font-mono text-xs text-blue-700 hover:underline">{e.ticketId}</Link>
                <span className="flex-1 min-w-48">{e.text}</span>
                <span className="text-xs text-slate-400">{formatDateTime(e.at)}</span>
                {!e.undone && e.before && (
                  <button onClick={() => undoAutomation(e.id)} className="text-xs rounded border border-slate-300 px-2 py-0.5 hover:bg-slate-50 no-underline">Undo</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
