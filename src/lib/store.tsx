"use client";

// ─────────────────────────────────────────────────────────────
// THE DATA STORE — the one place where tickets and technicians are kept.
//
// Right now (Stage 1) data is saved in the web browser's local storage,
// so each computer has its own copy and "Reset demo data" restores the
// sample data. In a later stage we can swap this file to save to a real
// database or Google Sheets — the pages won't need to change.
// ─────────────────────────────────────────────────────────────

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createSeedTickets, SEED_NEXT_TICKET_NUMBER } from "@/data/tickets";
import { seedTechnicians } from "@/data/technicians";
import { dueDateFor } from "./sla";
import type { AppData, Category, Customer, DutyStatus, Priority, Ticket, TicketSource, TicketStatus } from "./types";

const STORAGE_KEY = "sherlock-ops-data-v2"; // bump the number when the data shape changes — forces fresh demo data
const CURRENT_USER = "Office Staff"; // placeholder until we add logins

function freshData(): AppData {
  return {
    tickets: createSeedTickets(),
    technicians: seedTechnicians,
    nextTicketNumber: SEED_NEXT_TICKET_NUMBER,
  };
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
  createTicket: (input: NewTicketInput) => Ticket;
  setTechDuty: (techId: string, duty: DutyStatus) => void;
  resetDemoData: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);

  // Load saved data once when the app opens.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setData(saved ? (JSON.parse(saved) as AppData) : freshData());
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

  /** Helper: change one ticket and record what happened in its history. */
  const editTicket = useCallback((id: string, change: (t: Ticket) => Partial<Ticket>, note?: string) => {
    setData((d) =>
      d && {
        ...d,
        tickets: d.tickets.map((t) => {
          if (t.id !== id) return t;
          const updated = { ...t, ...change(t) };
          if (note) updated.notes = [...t.notes, { at: new Date().toISOString(), author: CURRENT_USER, text: note }];
          return updated;
        }),
      },
    );
  }, []);

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
    assignTechnician: (id, techId) =>
      editTicket(
        id,
        (t) => ({ assignedTechId: techId, status: techId && t.status === "Pending" ? "Assigned" : t.status }),
        techId ? `Assigned to ${techName(techId)}` : "Technician removed",
      ),
    setPriority: (id, priority) =>
      editTicket(id, (t) => ({ priority, dueAt: dueDateFor(priority, new Date(t.createdAt)) }), `Priority set to ${priority}`),
    addNote: (id, text) => editTicket(id, () => ({}), text),
    markReviewed: (id) => editTicket(id, () => ({ needsReview: false }), "Reviewed by a person and cleared"),
    createTicket: (input) => {
      const now = new Date();
      const ticket: Ticket = {
        ...input,
        id: `SR-${data.nextTicketNumber}`,
        createdAt: now.toISOString(),
        dueAt: dueDateFor(input.priority, now),
        status: "Pending",
        notes: [{ at: now.toISOString(), author: CURRENT_USER, text: `Ticket created (${input.source})` }],
      };
      setData((d) => d && { ...d, tickets: [ticket, ...d.tickets], nextTicketNumber: d.nextTicketNumber + 1 });
      return ticket;
    },
    setTechDuty: (techId, duty) =>
      setData((d) => {
        if (!d) return d;
        const name = techName(techId);
        const at = new Date().toISOString();
        return {
          ...d,
          technicians: d.technicians.map((t) => (t.id === techId ? { ...t, duty } : t)),
          // If a tech is out, flag their unfinished jobs so the office can reassign them.
          // (We never reassign automatically — a person decides.)
          tickets:
            duty === "On Duty"
              ? d.tickets
              : d.tickets.map((t) =>
                  t.assignedTechId === techId && t.status !== "Completed"
                    ? {
                        ...t,
                        needsReview: true,
                        reviewReason: `${name} is now "${duty}". Reassign this job?`,
                        notes: [...t.notes, { at, author: name, text: `Technician marked "${duty}"` }],
                      }
                    : t,
                ),
        };
      }),
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
