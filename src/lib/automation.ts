// ─────────────────────────────────────────────────────────────
// AUTOPILOT — routine work the app does by itself.
//
// It assigns technicians, reassigns jobs when a tech is out, and
// escalates overdue jobs. Anything risky is ALWAYS left for a person
// (see canAutomate). Every action is logged and can be undone.
// ─────────────────────────────────────────────────────────────

import { suggestTechnicians } from "./recommend";
import { isOverdue } from "./sla";
import { PRIORITIES, type AppData, type AutomationKind, type AutomationLogEntry, type AutomationSettings, type Ticket } from "./types";

export const AUTOPILOT = "🤖 Autopilot";

export const DEFAULT_SETTINGS: AutomationSettings = {
  autoCreateFromEmail: true,
  autoAssign: true,
  autoReassign: true,
  autoEscalate: true,
};

/** Estimated minutes of office work each automatic action saves. Adjust to real numbers. */
export const MINUTES_SAVED: Record<AutomationKind, number> = {
  create: 5, // reading an email and typing up the ticket
  assign: 4, // checking skills, locations and workloads, then calling the tech
  reassign: 6, // finding a replacement and calling them
  escalate: 2, // noticing the job is late and raising it
};

/**
 * Safety rule: the Autopilot never touches these — a person decides.
 * Critical jobs, fire / life-safety systems, and anything flagged for review.
 */
export function canAutomate(t: Ticket): boolean {
  return t.priority !== "Critical" && t.category !== "Fire Alarm" && !t.needsReview && !t.manualOnly;
}

export function minutesSaved(log: AutomationLogEntry[]): number {
  return log.filter((e) => !e.undone).reduce((sum, e) => sum + MINUTES_SAVED[e.kind], 0);
}

let counter = 0;
const newId = () => `A${Date.now().toString(36)}${(counter++).toString(36)}`;

/** Fields we remember so an action can be undone. */
const snapshot = (t: Ticket): Partial<Ticket> => ({
  assignedTechId: t.assignedTechId, status: t.status, priority: t.priority,
  needsReview: t.needsReview, reviewReason: t.reviewReason,
});

/**
 * One pass of the Autopilot over all tickets. Returns updated data
 * (unchanged object if there was nothing to do).
 */
export function runAutopilot(data: AppData): AppData {
  const { settings } = data.automation;
  const now = new Date();
  const at = now.toISOString();
  const tickets = [...data.tickets];
  const log: AutomationLogEntry[] = [];
  const techName = (id?: string) => data.technicians.find((x) => x.id === id)?.name ?? "Unassigned";

  // Helper: change ticket i, add a note, and log it.
  const act = (i: number, kind: AutomationKind, change: Partial<Ticket>, text: string) => {
    const t = tickets[i];
    log.push({ id: newId(), at, kind, ticketId: t.id, text, before: snapshot(t) });
    tickets[i] = { ...t, ...change, notes: [...t.notes, { at, author: AUTOPILOT, text }] };
  };
  // Helper: hand a ticket to a person when the Autopilot can't handle it.
  const escalateToPerson = (i: number, reason: string) => {
    const t = tickets[i];
    tickets[i] = { ...t, needsReview: true, reviewReason: reason, notes: [...t.notes, { at, author: AUTOPILOT, text: reason }] };
  };
  // Suggestions use the tickets as they are *now*, so workloads stay balanced.
  const bestTechFor = (t: Ticket) => suggestTechnicians(t, { ...data, tickets }, 1)[0]?.tech;

  tickets.forEach((t, i) => {
    if (t.status === "Completed" || !canAutomate(t)) return;
    const assigned = data.technicians.find((x) => x.id === t.assignedTechId);

    // 1. Reassign jobs whose technician is off today / on leave.
    if (settings.autoReassign && assigned && assigned.duty !== "On Duty") {
      const tech = bestTechFor(t);
      if (tech) {
        act(i, "reassign", { assignedTechId: tech.id, status: "Assigned" },
          `Reassigned from ${assigned.name} (${assigned.duty}) to ${tech.name}`);
      } else {
        escalateToPerson(i, `${assigned.name} is ${assigned.duty} and no other qualified technician is available.`);
      }
      return;
    }

    // 2. Assign new jobs.
    if (settings.autoAssign && t.status === "Pending" && !t.assignedTechId) {
      const tech = bestTechFor(t);
      if (tech) {
        act(i, "assign", { assignedTechId: tech.id, status: "Assigned" },
          `Assigned to ${tech.name} (${tech.zone} zone, skilled in ${t.category})`);
      } else {
        escalateToPerson(i, "No available technician with the right skills. Please assign manually.");
      }
      return;
    }

    // 3. Escalate overdue jobs: raise priority one level and send to a person.
    if (settings.autoEscalate && isOverdue(t, now)) {
      const higher = PRIORITIES[Math.max(0, PRIORITIES.indexOf(t.priority) - 1)];
      act(i, "escalate", { priority: higher, needsReview: true, reviewReason: `Overdue — escalated from ${t.priority} to ${higher}.` },
        `Overdue: priority raised ${t.priority} → ${higher} and flagged for a person (assigned: ${techName(t.assignedTechId)})`);
    }
  });

  const changed = log.length > 0 || tickets.some((t, i) => t !== data.tickets[i]);
  if (!changed) return data;
  return { ...data, tickets, automation: { ...data.automation, log: [...log.reverse(), ...data.automation.log].slice(0, 300) } };
}

/** Puts a ticket back the way it was before an Autopilot action. */
export function undoAction(data: AppData, logId: string): AppData {
  const entry = data.automation.log.find((e) => e.id === logId);
  if (!entry || entry.undone || !entry.before) return data;
  const at = new Date().toISOString();
  return {
    ...data,
    tickets: data.tickets.map((t) =>
      t.id === entry.ticketId
        ? { ...t, ...entry.before, manualOnly: true, notes: [...t.notes, { at, author: "Office Staff", text: `Undid Autopilot action: ${entry.text}` }] }
        : t,
    ),
    automation: { ...data.automation, log: data.automation.log.map((e) => (e.id === logId ? { ...e, undone: true } : e)) },
  };
}
