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

export interface Customer {
  name: string; // contact person
  company: string;
  address: string;
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
}

export const DUTY_STATUSES = ["On Duty", "Off Today", "On Leave"] as const;
export type DutyStatus = (typeof DUTY_STATUSES)[number];

export interface Technician {
  id: string; // e.g. "T01"
  name: string;
  phone: string;
  zone: string; // service area they usually cover
  skills: Category[];
  certifications: string[];
  duty: DutyStatus;
  vanNumber?: number; // 5 company vans; most techs use their own vehicle
  yearsExperience: number;
}

/** Everything the app stores. */
export interface AppData {
  tickets: Ticket[];
  technicians: Technician[];
  nextTicketNumber: number;
}
