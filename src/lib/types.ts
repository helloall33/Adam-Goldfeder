// ─────────────────────────────────────────────────────────────
// The "shape" of every piece of data in the app.
// If you want to add a new field (e.g. "Contract number" on a ticket),
// add it here first, then use it in the pages.
// ─────────────────────────────────────────────────────────────

export const STATUSES = ["Pending", "Assigned", "In Progress", "Completed"] as const;
export type TicketStatus = (typeof STATUSES)[number];

export const PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const CATEGORIES = [
  "Security Cameras",
  "Burglar Alarm",
  "Access Control",
  "Fire Alarm",
  "Intercom",
  "Alarm Communicator",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type TicketSource = "Email" | "Phone" | "Manual";

// Service areas. Each customer site and each technician belongs to one.
export const ZONES = ["North", "South", "East", "West", "Central"] as const;
export type Zone = (typeof ZONES)[number];

export interface Customer {
  name: string; // contact person
  company: string;
  address: string;
  zone: Zone; // service area the site is in
  phone: string;
  email: string;
}

export interface TicketNote {
  at: string; // ISO date/time
  author: string;
  text: string;
}

export interface Ticket {
  id: string; // e.g. "SR-1042"
  createdAt: string; // ISO date/time
  dueAt: string; // ISO date/time — based on priority (see lib/sla.ts)
  completedAt?: string;
  status: TicketStatus;
  priority: Priority;
  category: Category;
  customer: Customer;
  subject: string;
  description: string;
  assignedTechId?: string;
  /** True when a person must look at this ticket before work proceeds. */
  needsReview: boolean;
  reviewReason?: string;
  source: TicketSource;
  notes: TicketNote[];
  /** Set when a person overrides the Autopilot — it then leaves this ticket alone. */
  manualOnly?: boolean;
}

export const DUTY_STATUSES = ["On Duty", "Off Today", "On Leave"] as const;
export type DutyStatus = (typeof DUTY_STATUSES)[number];

export interface Technician {
  id: string; // e.g. "T01"
  name: string;
  phone: string;
  zone: Zone; // service area they usually cover
  skills: Category[];
  certifications: string[];
  duty: DutyStatus;
  vanNumber?: number; // 5 company vans; most techs use their own vehicle
  yearsExperience: number;
}

// ── Autopilot (automation) ──
export interface AutomationSettings {
  autoCreateFromEmail: boolean;
  autoAssign: boolean;
  autoReassign: boolean;
  autoEscalate: boolean;
}

export type AutomationKind = "create" | "assign" | "reassign" | "escalate";

export interface AutomationLogEntry {
  id: string;
  at: string;
  kind: AutomationKind;
  ticketId: string;
  text: string;
  /** The ticket's previous values, so a person can undo the action. */
  before?: Partial<Ticket>;
  undone?: boolean;
}

/** Everything the app stores. */
export interface AppData {
  tickets: Ticket[];
  technicians: Technician[];
  nextTicketNumber: number;
  automation: { settings: AutomationSettings; log: AutomationLogEntry[] };
}
