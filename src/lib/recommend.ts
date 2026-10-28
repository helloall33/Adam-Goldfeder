import type { AppData, Technician, Ticket } from "./types";

// Simple, rule-based technician suggestions (no AI yet).
// A technician scores higher if they: have the right skill, are on duty,
// and have fewer open jobs. Later, AI can add location and schedule.

export function openJobCount(techId: string, tickets: Ticket[]): number {
  return tickets.filter((t) => t.assignedTechId === techId && t.status !== "Completed").length;
}

export function isBusyNow(techId: string, tickets: Ticket[]): boolean {
  return tickets.some((t) => t.assignedTechId === techId && t.status === "In Progress");
}

export interface Suggestion {
  tech: Technician;
  openJobs: number;
  reasons: string[];
}

export function suggestTechnicians(ticket: Ticket, data: AppData, limit = 3): Suggestion[] {
  return data.technicians
    .filter((tech) => tech.duty === "On Duty" && tech.skills.includes(ticket.category))
    .map((tech) => {
      const openJobs = openJobCount(tech.id, data.tickets);
      const reasons = [`Skilled in ${ticket.category}`];
      reasons.push(openJobs === 0 ? "No open jobs" : `${openJobs} open job${openJobs > 1 ? "s" : ""}`);
      if (!isBusyNow(tech.id, data.tickets)) reasons.push("Not on a job right now");
      if (tech.vanNumber) reasons.push(`Has van #${tech.vanNumber}`);
      return { tech, openJobs, reasons, score: openJobs * 2 + (isBusyNow(tech.id, data.tickets) ? 1 : 0) - tech.yearsExperience / 100 };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}
