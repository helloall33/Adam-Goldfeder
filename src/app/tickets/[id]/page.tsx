"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { isOverdue } from "@/lib/sla";
import { formatDateTime, timeAgo } from "@/lib/format";
import { suggestTechnicians, openJobCount } from "@/lib/recommend";
import { PRIORITIES, STATUSES, type Priority } from "@/lib/types";
import { OverdueBadge, PriorityBadge, ReviewBadge, StatusBadge } from "@/components/Badges";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const { data } = store;
  const [note, setNote] = useState("");

  const ticket = data.tickets.find((t) => t.id === id);
  if (!ticket) {
    return (
      <div className="space-y-2">
        <p>Ticket {id} was not found.</p>
        <Link href="/tickets" className="text-blue-700 underline">Back to tickets</Link>
      </div>
    );
  }

  const now = new Date();
  const tech = data.technicians.find((t) => t.id === ticket.assignedTechId);
  const suggestions = ticket.status === "Completed" ? [] : suggestTechnicians(ticket, data);
  const card = "bg-white rounded-lg border border-slate-200 p-4";

  return (
    <div className="max-w-6xl space-y-4">
      <Link href="/tickets" className="text-sm text-blue-700 hover:underline">← All tickets</Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-slate-500">{ticket.id}</span>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          {ticket.needsReview && <ReviewBadge />}
          {isOverdue(ticket, now) && <OverdueBadge />}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{ticket.subject}</h1>
        <p className="text-sm text-slate-500">
          {ticket.category} · via {ticket.source} · received {formatDateTime(ticket.createdAt)} ({timeAgo(ticket.createdAt, now)}) ·
          due {formatDateTime(ticket.dueAt)}
        </p>
      </header>

      {ticket.needsReview && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm space-y-2">
          <p className="font-semibold text-yellow-900">👁 A person must review this ticket</p>
          {ticket.reviewReason && <p className="text-yellow-900">{ticket.reviewReason}</p>}
          <p className="text-yellow-800 text-xs">
            This system never contacts police, fire, or emergency services. If there may be an emergency,
            follow company procedure and contact the monitoring center directly.
          </p>
          <button onClick={() => store.markReviewed(ticket.id)} className="rounded-md bg-yellow-400 px-3 py-1.5 font-medium text-yellow-950 hover:bg-yellow-300">
            I&apos;ve reviewed this — clear flag
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <section className={card}>
            <h2 className="text-sm font-semibold mb-2">Customer&apos;s request</h2>
            <p className="text-sm whitespace-pre-line text-slate-700">{ticket.description}</p>
          </section>

          <section className={card}>
            <h2 className="text-sm font-semibold mb-3">Update status</h2>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => store.updateStatus(ticket.id, s)}
                  disabled={ticket.status === s}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    ticket.status === s ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <label className="block mt-4 text-sm">
              <span className="text-slate-600">Priority</span>
              <select
                value={ticket.priority}
                onChange={(e) => store.setPriority(ticket.id, e.target.value as Priority)}
                className="ml-2 rounded-md border border-slate-300 px-2 py-1 text-sm"
              >
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
          </section>

          <section className={card}>
            <h2 className="text-sm font-semibold mb-3">History & notes</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (note.trim()) { store.addNote(ticket.id, note.trim()); setNote(""); }
              }}
              className="flex gap-2 mb-4"
            >
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note (e.g. called customer, part ordered)…" className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
              <button className="rounded-md bg-slate-900 text-white text-sm px-3">Add</button>
            </form>
            {ticket.notes.length === 0 ? (
              <p className="text-sm text-slate-500">No activity yet.</p>
            ) : (
              <ul className="space-y-2">
                {[...ticket.notes].reverse().map((n, i) => (
                  <li key={i} className="text-sm border-l-2 border-slate-200 pl-3">
                    <div>{n.text}</div>
                    <div className="text-xs text-slate-500">{n.author} · {formatDateTime(n.at)}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className={card}>
            <h2 className="text-sm font-semibold mb-2">Customer</h2>
            <dl className="text-sm space-y-1">
              <div className="font-medium">{ticket.customer.company}</div>
              <div>{ticket.customer.name}</div>
              <div className="text-slate-600">{ticket.customer.address}</div>
              <div><a className="text-blue-700 hover:underline" href={`tel:${ticket.customer.phone}`}>{ticket.customer.phone}</a></div>
              <div><a className="text-blue-700 hover:underline break-all" href={`mailto:${ticket.customer.email}`}>{ticket.customer.email}</a></div>
            </dl>
          </section>

          <section className={card}>
            <h2 className="text-sm font-semibold mb-2">Assigned technician</h2>
            <select
              value={ticket.assignedTechId ?? ""}
              onChange={(e) => store.assignTechnician(ticket.id, e.target.value || undefined)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">— Unassigned —</option>
              {data.technicians.map((t) => (
                <option key={t.id} value={t.id} disabled={t.duty !== "On Duty" && t.id !== ticket.assignedTechId}>
                  {t.name} ({t.zone}){t.duty !== "On Duty" ? ` — ${t.duty}` : ""}
                </option>
              ))}
            </select>
            {tech && (
              <p className="mt-2 text-xs text-slate-500">
                {tech.phone} · {openJobCount(tech.id, data.tickets)} open job(s){tech.vanNumber ? ` · Van #${tech.vanNumber}` : ""}
              </p>
            )}

            {suggestions.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Suggested technicians</h3>
                <ul className="space-y-2">
                  {suggestions.map((s) => (
                    <li key={s.tech.id} className="rounded-md border border-slate-200 p-2 text-sm">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-medium">{s.tech.name}</span>
                        {s.tech.id === ticket.assignedTechId ? (
                          <span className="text-xs text-emerald-700">✓ Assigned</span>
                        ) : (
                          <button onClick={() => store.assignTechnician(ticket.id, s.tech.id)} className="text-xs rounded border border-slate-300 px-2 py-0.5 hover:bg-slate-50">
                            Assign
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{s.reasons.join(" · ")}</div>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-slate-400">Suggestions are based on skills and current workload. A person makes the final decision.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
