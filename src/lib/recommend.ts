import type { AppData, Technician, Ticket } from "./types";

// Simple, rule-based technician suggestions (no AI yet).
// A technician ranks higher if they: have the right skill, are on duty,
// work in the same zone as the customer, and have fewer open jobs.

export function openJobCount(techId: string, tickets: Ticket[]): number {
  return tickets.filter((t) => t.assignedTechId === techId && t.status !== "Completed").length;
}

export function isBusyNow(techId: string, tickets: Ticket[]): boolean {
  return tickets.some((t) => t.assignedTechId === techId && t.status === "In Progress");
}

export interface Suggestion {
  tech: Technician;
  openJobs: number;
  sameZone: boolean;
  reasons: string[];
}

// How much each factor counts. Lower score = better match.
const WEIGHTS = {
  perOpenJob: 2,
  busyRightNow: 1,
  differentZone: 3, // being in the customer's area matters most
};

export function suggestTechnicians(ticket: Ticket, data: AppData, limit = 3): Suggestion[] {
  return data.technicians
    .filter((tech) => tech.duty === "On Duty" && tech.skills.includes(ticket.category))
    .map((tech) => {
      const openJobs = openJobCount(tech.id, data.tickets);
      const busy = isBusyNow(tech.id, data.tickets);
      const sameZone = tech.zone === ticket.customer.zone;
      const reasons = [`Skilled in ${ticket.category}`];
      reasons.push(sameZone ? `📍 Works the ${tech.zone} zone (same area)` : `${tech.zone} zone (customer is ${ticket.customer.zone})`);
      reasons.push(openJobs === 0 ? "No open jobs" : `${openJobs} open job${openJobs > 1 ? "s" : ""}`);
      if (!busy) reasons.push("Not on a job right now");
      if (tech.vanNumber) reasons.push(`Has van #${tech.vanNumber}`);
      const score =
        openJobs * WEIGHTS.perOpenJob +
        (busy ? WEIGHTS.busyRightNow : 0) +
        (sameZone ? 0 : WEIGHTS.differentZone) -
        tech.yearsExperience / 100; // tie-breaker: more experience
      return { tech, openJobs, sameZone, reasons, score };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}
