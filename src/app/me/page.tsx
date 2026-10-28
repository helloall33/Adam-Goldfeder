"use client";

// ─────────────────────────────────────────────────────────────
// TECHNICIAN VIEW — the page a technician opens on their phone.
// For the demo you pick which technician you are. In a real version,
// each tech would log in and only see their own jobs.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { isOverdue } from "@/lib/sla";
import { PriorityBadge, StatusBadge, OverdueBadge } from "@/components/Badges";

const ME_KEY = "sherlock-ops-me";

export default function TechnicianViewPage() {
  const { data, setTechDuty, updateStatus, addNote } = useStore();
  const [techId, setTechId] = useState("");
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");

  // Remember which tech this phone belongs to.
  useEffect(() => {
    try { setTechId(localStorage.getItem(ME_KEY) ?? ""); } catch {}
  }, []);
  const choose = (id: string) => {
    setTechId(id);
    try { localStorage.setItem(ME_KEY, id); } catch {}
  };

  const tech = data.technicians.find((t) => t.id === techId);
  const now = new Date();

  if (!tech) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Technician View</h1>
        <p className="text-sm text-slate-600">Demo: pick which technician you are. (A real version would use a login.)</p>
        <select value="" onChange={(e) => choose(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-base">
          <option value="">Choose your name…</option>
          {data.technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
    );
  }

  const myJobs = data.tickets
    .filter((t) => t.assignedTechId === tech.id && t.status !== "Completed")
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const doneToday = data.tickets.filter(
    (t) => t.assignedTechId === tech.id && t.completedAt && now.getTime() - new Date(t.completedAt).getTime() < 24 * 3600_000,
  ).length;
  const bigBtn = "flex-1 rounded-lg py-4 text-base font-semibold border-2";

  return (
    <div className="max-w-md mx-auto space-y-5">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-slate-500">Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"},</p>
          <h1 className="text-2xl font-semibold tracking-tight">{tech.name}</h1>
          <p className="text-xs text-slate-500">{tech.zone} zone{tech.vanNumber ? ` · Van #${tech.vanNumber}` : ""}</p>
        </div>
        <button onClick={() => choose("")} className="text-xs text-blue-700 underline">Not you?</button>
      </header>

      <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold">Today I am…</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTechDuty(tech.id, "On Duty")}
            className={`${bigBtn} ${tech.duty === "On Duty" ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"}`}
          >
            ✅ In today
          </button>
          <button
            onClick={() => {
              if (tech.duty === "Off Today") return;
              if (myJobs.length === 0 || confirm(`You have ${myJobs.length} open job(s). The office will be asked to reassign them. Continue?`))
                setTechDuty(tech.id, "Off Today");
            }}
            className={`${bigBtn} ${tech.duty === "Off Today" ? "bg-slate-700 border-slate-700 text-white" : "border-slate-300 bg-white"}`}
          >
            🤒 Out today
          </button>
        </div>
        {tech.duty === "On Leave" && <p className="text-xs text-slate-500">You&apos;re marked On Leave. Tap &quot;In today&quot; when you&apos;re back.</p>}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          My jobs ({myJobs.length}) <span className="font-normal text-slate-500">· {doneToday} completed today</span>
        </h2>
        {myJobs.length === 0 && <p className="text-sm text-slate-500 bg-white rounded-xl border border-slate-200 p-4">No open jobs. 👍</p>}
        {myJobs.map((j) => (
          <article key={j.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex flex-wrap gap-1 items-center">
              <span className="font-mono text-xs text-slate-500 mr-1">{j.id}</span>
              <StatusBadge status={j.status} />
              <PriorityBadge priority={j.priority} />
              {isOverdue(j, now) && <OverdueBadge />}
            </div>
            <div>
              <h3 className="font-semibold">{j.subject}</h3>
              <p className="text-sm text-slate-600 mt-1">{j.description}</p>
            </div>
            <div className="text-sm">
              <div className="font-medium">{j.customer.company}</div>
              <a className="text-blue-700 underline" href={`https://maps.google.com/?q=${encodeURIComponent(j.customer.address)}`} target="_blank" rel="noreferrer">
                📍 {j.customer.address}
              </a>
              <div><a className="text-blue-700 underline" href={`tel:${j.customer.phone}`}>📞 {j.customer.name} · {j.customer.phone}</a></div>
            </div>
            <div className="flex gap-2">
              {j.status !== "In Progress" && (
                <button onClick={() => updateStatus(j.id, "In Progress")} className="flex-1 rounded-lg bg-violet-600 text-white py-3 font-semibold">▶ Start job</button>
              )}
              <button onClick={() => updateStatus(j.id, "Completed")} className="flex-1 rounded-lg bg-emerald-600 text-white py-3 font-semibold">✓ Complete</button>
              <button onClick={() => { setNoteFor(noteFor === j.id ? null : j.id); setNote(""); }} className="rounded-lg border border-slate-300 px-3 py-3">📝</button>
            </div>
            {noteFor === j.id && (
              <form
                onSubmit={(e) => { e.preventDefault(); if (note.trim()) { addNote(j.id, `${tech.name}: ${note.trim()}`); setNoteFor(null); } }}
                className="flex gap-2"
              >
                <input autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Need a part, coming back tomorrow" className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <button className="rounded-md bg-slate-900 text-white px-3 text-sm">Save</button>
              </form>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
