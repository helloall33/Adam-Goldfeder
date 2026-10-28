"use client";

// ─────────────────────────────────────────────────────────────
// THE DATA STORE — the one place where tickets and technicians are kept.
//
// Right now data is saved in the web browser's local storage,
// so each computer has its own copy and "Reset demo data" restores the
// sample data. In a later stage we can swap this file to save to a real
// database or Google Sheets — the pages won't need to change.
//
// After every change, the Autopilot (lib/automation.ts) runs once.
// ─────────────────────────────────────────────────────────────

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createSeedTickets, SEED_NEXT_TICKET_NUMBER } from "@/data/tickets";
import { seedTechnicians } from "@/data/technicians";
import { AUTOPILOT, DEFAULT_SETTINGS, canAutomate, runAutopilot, undoAction } from "./automation";
import { dueDateFor } from "./sla";
import type { AppData, AutomationSettings, Category, Customer, DutyStatus, Priority, Ticket, TicketSource, TicketStatus } from "./types";

const STORAGE_KEY = "sherlock-ops-data-v3"; // bump the number when the data shape changes — forces fresh demo data
const CURRENT_USER = "Office Staff"; // placeholder until we add logins
const AUTOPILOT_EVERY_MS = 60_000; // also re-check once a minute (e.g. for jobs that just became overdue)

function freshData(): AppData {
  return runAutopilot({
    tickets: createSeedTickets(),
    technicians: seedTechnicians,
    nextTicketNumber: SEED_NEXT_TICKET_NUMBER,
    automation: { settings: DEFAULT_SETTINGS, log: [] },
  });
}

export interface NewTicketInput {
  customer: Customer;
  subject: string;
  description: string;
  category: Category;
  priority: Priority;
  source: TicketSource;
  needsReview: boolean;
  reviewReason?: string;
}

interface Store {
  data: AppData;
  updateStatus: (ticketId: string, status: TicketStatus) => void;
  assignTechnician: (ticketId: string, techId: string | undefined) => void;
  setPriority: (ticketId: string, priority: Priority) => void;
  addNote: (ticketId: string, text: string) => void;
  markReviewed: (ticketId: string) => void;
  /** byAutopilot = created automatically (e.g. from an email) rather than by a person. */
  createTicket: (input: NewTicketInput, opts?: { byAutopilot?: boolean; note?: string }) => Ticket;
  setTechDuty: (techId: string, duty: DutyStatus) => void;
  setAutomation: (settings: Partial<AutomationSettings>) => void;
  undoAutomation: (logId: string) => void;
  resetDemoData: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);

  // Load saved data once when the app opens.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setData(saved ? runAutopilot(JSON.parse(saved) as AppData) : freshData());
    } catch {
      setData(freshData());
    }
  }, []);

  // Save every time something changes.
  useEffect(() => {
    if (!data) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage unavailable (e.g. private window) — app still works for this visit */
    }
  }, [data]);

  /** Every change goes through here, so the Autopilot runs after it. */
  const update = useCallback((change: (d: AppData) => AppData) => {
    setData((d) => d && runAutopilot(change(d)));
  }, []);

  // Let the Autopilot check in regularly while the app is open.
  useEffect(() => {
    const timer = setInterval(() => update((d) => d), AUTOPILOT_EVERY_MS);
    return () => clearInterval(timer);
  }, [update]);

  /** Helper: change one ticket and record what happened in its history. */
  const editTicket = useCallback(
    (id: string, change: (t: Ticket) => Partial<Ticket>, note?: string, author = CURRENT_USER) =>
      update((d) => ({
        ...d,
        tickets: d.tickets.map((t) => {
          if (t.id !== id) return t;
          const updated = { ...t, ...change(t) };
          if (note) updated.notes = [...t.notes, { at: new Date().toISOString(), author, text: note }];
          return updated;
        }),
      })),
    [update],
  );

  if (!data) {
    return <div className="p-10 text-sm text-slate-500">Loading…</div>;
  }

  const techName = (id?: string) => data.technicians.find((t) => t.id === id)?.name ?? "Unassigned";

  const store: Store = {
    data,
    updateStatus: (id, status) =>
      editTicket(
        id,
        () => ({ status, completedAt: status === "Completed" ? new Date().toISOString() : undefined }),
        `Status changed to ${status}`,
      ),
    // A person choosing a technician overrides the Autopilot for this ticket.
    assignTechnician: (id, techId) =>
      editTicket(
        id,
        (t) => ({ assignedTechId: techId, manualOnly: true, status: techId && t.status === "Pending" ? "Assigned" : t.status }),
        techId ? `Assigned to ${techName(techId)}` : "Technician removed",
      ),
    setPriority: (id, priority) =>
      editTicket(id, (t) => ({ priority, dueAt: dueDateFor(priority, new Date(t.createdAt)) }), `Priority set to ${priority}`),
    addNote: (id, text) => editTicket(id, () => ({}), text),
    markReviewed: (id) => editTicket(id, () => ({ needsReview: false }), "Reviewed by a person and cleared"),
    createTicket: (input, opts = {}) => {
      const now = new Date();
      const at = now.toISOString();
      const author = opts.byAutopilot ? AUTOPILOT : CURRENT_USER;
      const ticket: Ticket = {
        ...input,
        id: `SR-${data.nextTicketNumber}`,
        createdAt: at,
        dueAt: dueDateFor(input.priority, now),
        status: "Pending",
        notes: [
          { at, author, text: `Ticket created (${input.source})` },
          ...(opts.note ? [{ at, author, text: opts.note }] : []),
        ],
      };
      update((d) => ({
        ...d,
        tickets: [ticket, ...d.tickets],
        nextTicketNumber: d.nextTicketNumber + 1,
        automation: opts.byAutopilot
          ? { ...d.automation, log: [{ id: `C${ticket.id}`, at, kind: "create", ticketId: ticket.id, text: `Created ${ticket.id} from email: ${ticket.subject}` }, ...d.automation.log] }
          : d.automation,
      }));
      return ticket;
    },
    setTechDuty: (techId, duty) =>
      update((d) => {
        const name = techName(techId);
        const at = new Date().toISOString();
        return {
          ...d,
          technicians: d.technicians.map((t) => (t.id === techId ? { ...t, duty } : t)),
          // If a tech is out: the Autopilot reassigns routine jobs on its next pass.
          // Jobs it isn't allowed to handle are flagged for a person.
          tickets:
            duty === "On Duty"
              ? d.tickets
              : d.tickets.map((t) => {
                  if (t.assignedTechId !== techId || t.status === "Completed") return t;
                  const notes = [...t.notes, { at, author: name, text: `Technician marked "${duty}"` }];
                  return d.automation.settings.autoReassign && canAutomate(t)
                    ? { ...t, notes }
                    : { ...t, notes, needsReview: true, reviewReason: `${name} is now "${duty}". Reassign this job?` };
                }),
        };
      }),
    setAutomation: (settings) =>
      update((d) => ({ ...d, automation: { ...d.automation, settings: { ...d.automation.settings, ...settings } } })),
    undoAutomation: (logId) => update((d) => undoAction(d, logId)),
    resetDemoData: () => setData(freshData()),
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/** Use this inside any page to read or change data. */
export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error("useStore must be used inside <StoreProvider>");
  return s;
}
