"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { isOverdue } from "@/lib/sla";
import { timeAgo } from "@/lib/format";
import { CATEGORIES, PRIORITIES, STATUSES } from "@/lib/types";
import { OverdueBadge, PriorityBadge, ReviewBadge, StatusBadge } from "@/components/Badges";

const PRIORITY_ORDER = Object.fromEntries(PRIORITIES.map((p, i) => [p, i]));

function TicketList() {
  const { data } = useStore();
  const params = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(params.get("status") ?? "Open");
  const [priority, setPriority] = useState("All");
  const [category, setCategory] = useState("All");
  const [special, setSpecial] = useState(params.get("filter") ?? "none"); // "review" | "overdue" | "none"

  const now = new Date();
  const techName = (id?: string) => data.technicians.find((t) => t.id === id)?.name;

  const q = search.toLowerCase();
  const rows = data.tickets
    .filter((t) => (status === "All" ? true : status === "Open" ? t.status !== "Completed" : t.status === status))
    .filter((t) => priority === "All" || t.priority === priority)
    .filter((t) => category === "All" || t.category === category)
    .filter((t) => special !== "review" || t.needsReview)
    .filter((t) => special !== "overdue" || isOverdue(t, now))
    .filter((t) =>
      !q || [t.id, t.subject, t.customer.company, t.customer.name, t.customer.address, techName(t.assignedTechId) ?? ""]
        .some((s) => s.toLowerCase().includes(q)),
    )
    .sort((a, b) =>
      Number(b.needsReview) - Number(a.needsReview) ||
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      b.createdAt.localeCompare(a.createdAt),
    );

  const select = "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm";

  return (
    <div className="space-y-4 max-w-7xl">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Service Tickets</h1>
          <p className="text-sm text-slate-500">{rows.length} shown · {data.tickets.length} total</p>
        </div>
        <Link href="/tickets/new" className="rounded-md bg-slate-900 text-white text-sm px-4 py-2 hover:bg-slate-700">+ New ticket</Link>
      </header>

      <div className="flex flex-wrap gap-2 bg-white border border-slate-200 rounded-lg p-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer, address, ticket #, technician…"
          className="flex-1 min-w-60 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <select className={select} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Open">All open</option>
          <option value="All">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={select} value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="All">All priorities</option>
          {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select className={select} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="All">All types</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className={select} value={special} onChange={(e) => setSpecial(e.target.value)}>
          <option value="none">No flag filter</option>
          <option value="review">Needs review only</option>
          <option value="overdue">Overdue only</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Ticket</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Technician</th>
              <th className="px-4 py-2">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 align-top">
                  <Link href={`/tickets/${t.id}`} className="block">
                    <span className="font-mono text-xs text-slate-500">{t.id}</span>
                    <span className="block font-medium text-blue-800 hover:underline">{t.subject}</span>
                    <span className="flex gap-1 mt-1">
                      {t.needsReview && <ReviewBadge />}
                      {isOverdue(t, now) && <OverdueBadge />}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 align-top">
                  <div>{t.customer.company}</div>
                  <div className="text-xs text-slate-500">{t.customer.address} · {t.customer.zone}</div>
                </td>
                <td className="px-4 py-3 align-top whitespace-nowrap">{t.category}</td>
                <td className="px-4 py-3 align-top"><PriorityBadge priority={t.priority} /></td>
                <td className="px-4 py-3 align-top"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3 align-top whitespace-nowrap">
                  {techName(t.assignedTechId) ?? <span className="text-slate-400">Unassigned</span>}
                </td>
                <td className="px-4 py-3 align-top whitespace-nowrap text-slate-500">{timeAgo(t.createdAt, now)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No tickets match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense>
      <TicketList />
    </Suspense>
  );
}
