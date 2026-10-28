"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { isOverdue } from "@/lib/sla";
import { timeAgo } from "@/lib/format";
import { openJobCount, isBusyNow } from "@/lib/recommend";
import { minutesSaved } from "@/lib/automation";
import { CATEGORIES, STATUSES } from "@/lib/types";
import StatCard from "@/components/StatCard";
import { OverdueBadge, PriorityBadge, ReviewBadge, StatusBadge } from "@/components/Badges";

const DAY = 24 * 3600_000;

export default function DashboardPage() {
  const { data, undoAutomation } = useStore();
  const now = new Date();
  const { tickets, technicians } = data;

  const open = tickets.filter((t) => t.status !== "Completed");
  const overdue = open.filter((t) => isOverdue(t, now));
  const review = tickets.filter((t) => t.needsReview);
  const newToday = tickets.filter((t) => now.getTime() - new Date(t.createdAt).getTime() < DAY);
  const completed7d = tickets.filter(
    (t) => t.completedAt && now.getTime() - new Date(t.completedAt).getTime() < 7 * DAY,
  );
  const completedToday = completed7d.filter((t) => now.getTime() - new Date(t.completedAt!).getTime() < DAY);
  const avgHours = completed7d.length
    ? completed7d.reduce((s, t) => s + (new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime()), 0) /
      completed7d.length / 3600_000
    : 0;
  const onDuty = technicians.filter((t) => t.duty === "On Duty");
  const busy = onDuty.filter((t) => isBusyNow(t.id, tickets));

  const attention = [...new Map([...review, ...overdue].map((t) => [t.id, t])).values()];
  const autoLog = data.automation.log;
  const hoursSaved = (minutesSaved(autoLog) / 60).toFixed(1);

  const byCategory = CATEGORIES.map((c) => ({ c, n: open.filter((t) => t.category === c).length })).filter((x) => x.n > 0);
  const maxCat = Math.max(1, ...byCategory.map((x) => x.n));

  const workload = onDuty
    .map((t) => ({ t, n: openJobCount(t.id, tickets) }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 8);
  const maxLoad = Math.max(1, ...workload.map((x) => x.n));

  return (
    <div className="space-y-6 max-w-7xl">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operations Dashboard</h1>
          <p className="text-sm text-slate-500">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/tickets/new" className="rounded-md bg-slate-900 text-white text-sm px-4 py-2 hover:bg-slate-700">
          + New ticket
        </Link>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 2xl:grid-cols-7 gap-3">
        <StatCard label="Open tickets" value={open.length} href="/tickets" />
        <StatCard label="Needs a person" value={review.length} tone={review.length ? "warn" : "default"} href="/tickets?filter=review" hint="Human decision required" />
        <StatCard label="Overdue" value={overdue.length} tone={overdue.length ? "alert" : "default"} href="/tickets?filter=overdue" />
        <StatCard label="New (24h)" value={newToday.length} />
        <StatCard label="Completed (24h)" value={completedToday.length} hint={`${completed7d.length} in last 7 days`} />
        <StatCard label="Avg. time to complete" value={`${avgHours.toFixed(1)}h`} hint="Last 7 days" />
        <StatCard label="🤖 Hours saved" value={`${hoursSaved}h`} hint={`${autoLog.filter((e) => !e.undone).length} automatic actions`} href="/automation" />
      </section>

      {/* Pipeline: how many tickets are in each stage */}
      <section className="bg-white rounded-lg border border-slate-200 p-4">
        <h2 className="text-sm font-semibold mb-3">Job pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATUSES.map((s) => (
            <Link key={s} href={`/tickets?status=${encodeURIComponent(s)}`} className="rounded-md border border-slate-200 p-3 hover:bg-slate-50">
              <StatusBadge status={s} />
              <div className="mt-2 text-2xl font-semibold tabular-nums">{tickets.filter((t) => t.status === s).length}</div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Needs attention list */}
        <section className="lg:col-span-2 bg-white rounded-lg border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-sm font-semibold">Needs a person</h2>
            <span className="text-xs text-slate-500">Everything else is handled by the Autopilot</span>
          </div>
          {attention.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Nothing needs a person right now. 🎉</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {attention.map((t) => (
                <li key={t.id}>
                  <Link href={`/tickets/${t.id}`} className="flex flex-wrap items-center gap-2 px-4 py-3 hover:bg-slate-50">
                    <span className="font-mono text-xs text-slate-500 w-16">{t.id}</span>
                    <span className="flex-1 min-w-48">
                      <span className="text-sm font-medium">{t.subject}</span>
                      <span className="block text-xs text-slate-500">{t.customer.company} · {timeAgo(t.createdAt, now)}</span>
                    </span>
                    <PriorityBadge priority={t.priority} />
                    {t.needsReview && <ReviewBadge />}
                    {isOverdue(t, now) && <OverdueBadge />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Technicians summary */}
        <section className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex justify-between items-baseline mb-3">
            <h2 className="text-sm font-semibold">Technician workload</h2>
            <Link href="/technicians" className="text-xs text-blue-700 hover:underline">All technicians →</Link>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            {onDuty.length} on duty · {busy.length} on a job now · {onDuty.length - busy.length} free
          </p>
          <ul className="space-y-2">
            {workload.map(({ t, n }) => (
              <li key={t.id} className="text-sm" title={`${t.name}: ${n} open job(s)`}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span>{t.name}</span>
                  <span className="tabular-nums text-slate-500">{n} open</span>
                </div>
                <div className="h-2 bg-slate-100 rounded">
                  <div className="h-2 bg-blue-600 rounded" style={{ width: `${(n / maxLoad) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="bg-white rounded-lg border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-sm font-semibold">🤖 Autopilot activity</h2>
          <Link href="/automation" className="text-xs text-blue-700 hover:underline">Settings & full log →</Link>
        </div>
        {autoLog.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No automatic actions yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {autoLog.slice(0, 6).map((e) => (
              <li key={e.id} className={`flex flex-wrap items-center gap-2 px-4 py-2 text-sm ${e.undone ? "opacity-50 line-through" : ""}`}>
                <Link href={`/tickets/${e.ticketId}`} className="font-mono text-xs text-blue-700 hover:underline w-16">{e.ticketId}</Link>
                <span className="flex-1 min-w-48">{e.text}</span>
                <span className="text-xs text-slate-400">{timeAgo(e.at, now)}</span>
                {!e.undone && e.before && (
                  <button onClick={() => undoAutomation(e.id)} className="text-xs rounded border border-slate-300 px-2 py-0.5 hover:bg-slate-50">Undo</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-lg border border-slate-200 p-4">
        <h2 className="text-sm font-semibold mb-3">Open tickets by type</h2>
        <ul className="space-y-2">
          {byCategory.map(({ c, n }) => (
            <li key={c} className="grid grid-cols-[10rem_1fr_2rem] items-center gap-3 text-sm" title={`${c}: ${n} open`}>
              <span className="text-slate-600 truncate">{c}</span>
              <div className="h-3 bg-slate-100 rounded">
                <div className="h-3 bg-blue-600 rounded" style={{ width: `${(n / maxCat) * 100}%` }} />
              </div>
              <span className="tabular-nums text-right">{n}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
