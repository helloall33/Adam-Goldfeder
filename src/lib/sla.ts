import type { Priority, Ticket } from "./types";

// How many hours we allow before a ticket counts as OVERDUE.
// Change these numbers to match the company's real service agreements.
export const SLA_HOURS: Record<Priority, number> = {
  Critical: 4,
  High: 24,
  Medium: 72,
  Low: 168, // 7 days
};

export function dueDateFor(priority: Priority, createdAt: Date): string {
  return new Date(createdAt.getTime() + SLA_HOURS[priority] * 3600_000).toISOString();
}

export function isOverdue(t: Ticket, now = new Date()): boolean {
  return t.status !== "Completed" && new Date(t.dueAt) < now;
}
