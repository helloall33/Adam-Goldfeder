"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { CATEGORIES, DUTY_STATUSES, type DutyStatus, type Technician, type Ticket } from "@/lib/types";
import { StatusBadge } from "@/components/Badges";

type Availability = "On a job" | "Available" | "Off Today" | "On Leave";

function availabilityOf(tech: Technician, tickets: Ticket[]): Availability {
  if (tech.duty !== "On Duty") return tech.duty;
  return tickets.some((t) => t.assignedTechId === tech.id && t.status === "In Progress") ? "On a job" : "Available";
}

const availStyle: Record<Availability, string> = {
  Available: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  "On a job": "bg-violet-50 text-violet-800 ring-violet-200",
  "Off Today": "bg-slate-100 text-slate-600 ring-slate-200",
  "On Leave": "bg-slate-100 text-slate-600 ring-slate-200",
};

export default function TechniciansPage() {
  const { data, setTechDuty } = useStore();
  const [skill, setSkill] = useState("All");
  const [zone, setZone] = useState("All");
  const [avail, setAvail] = useState("All");

  const zones = [...new Set(data.technicians.map((t) => t.zone))].sort();
  const techs = data.technicians
    .map((tech) => ({
      tech,
      availability: availabilityOf(tech, data.tickets),
      jobs: data.tickets.filter((t) => t.assignedTechId === tech.id && t.status !== "Completed"),
    }))
    .filter(({ tech }) => skill === "All" || tech.skills.includes(skill as Technician["skills"][number]))
    .filter(({ tech }) => zone === "All" || tech.zone === zone)
    .filter(({ availability }) => avail === "All" || availability === avail);

  const counts = (a: Availability) => data.technicians.filter((t) => availabilityOf(t, data.tickets) === a).length;
  const select = "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm";

  return (
    <div className="space-y-4 max-w-7xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Technicians</h1>
        <p className="text-sm text-slate-500">
          {data.technicians.length} technicians · {counts("Available")} available · {counts("On a job")} on a job ·{" "}
          {counts("Off Today") + counts("On Leave")} off · {data.technicians.filter((t) => t.vanNumber).length} company vans assigned
        </p>
      </header>

      <div className="flex flex-wrap gap-2 bg-white border border-slate-200 rounded-lg p-3">
        <select className={select} value={skill} onChange={(e) => setSkill(e.target.value)}>
          <option value="All">All skills</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className={select} value={zone} onChange={(e) => setZone(e.target.value)}>
          <option value="All">All zones</option>
          {zones.map((z) => <option key={z}>{z}</option>)}
        </select>
        <select className={select} value={avail} onChange={(e) => setAvail(e.target.value)}>
          <option value="All">Any availability</option>
          {(["Available", "On a job", "Off Today", "On Leave"] as Availability[]).map((a) => <option key={a}>{a}</option>)}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {techs.map(({ tech, availability, jobs }) => (
          <article key={tech.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between gap-2">
              <div>
                <h2 className="font-semibold">{tech.name}</h2>
                <p className="text-xs text-slate-500">
                  {tech.zone} zone · {tech.yearsExperience} yrs · {tech.phone}
                  {tech.vanNumber && <> · 🚐 Van #{tech.vanNumber}</>}
                </p>
              </div>
              <span className={`self-start inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap ${availStyle[availability]}`}>
                {availability}
              </span>
            </div>

            <div className="flex flex-wrap gap-1">
              {tech.skills.map((s) => <span key={s} className="rounded bg-blue-50 text-blue-800 text-xs px-1.5 py-0.5">{s}</span>)}
            </div>
            <ul className="text-xs text-slate-600 list-disc pl-4">
              {tech.certifications.map((c) => <li key={c}>{c}</li>)}
            </ul>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Open jobs ({jobs.length})</h3>
              {jobs.length === 0 ? (
                <p className="text-xs text-slate-400">None</p>
              ) : (
                <ul className="space-y-1">
                  {jobs.map((j) => (
                    <li key={j.id} className="flex items-center justify-between gap-2 text-xs">
                      <Link href={`/tickets/${j.id}`} className="text-blue-700 hover:underline truncate">{j.id} · {j.customer.company}</Link>
                      <StatusBadge status={j.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <label className="block text-xs text-slate-500">
              Duty status{" "}
              <select value={tech.duty} onChange={(e) => setTechDuty(tech.id, e.target.value as DutyStatus)} className="ml-1 rounded border border-slate-300 px-1 py-0.5 text-xs">
                {DUTY_STATUSES.map((d) => <option key={d}>{d}</option>)}
              </select>
            </label>
          </article>
        ))}
      </div>
    </div>
  );
}
