"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { CATEGORIES, PRIORITIES, ZONES, type Category, type Priority, type TicketSource, type Zone } from "@/lib/types";

// The ticket form, shared by "New Ticket" (typed by hand) and
// "From Email" (pre-filled by AI, then checked by a person).

export interface TicketFormValues {
  company: string;
  name: string;
  address: string;
  zone: Zone;
  phone: string;
  email: string;
  subject: string;
  description: string;
  category: Category;
  priority: Priority;
  source: TicketSource;
  needsReview: boolean;
  reviewReason: string;
}

export const EMPTY_FORM: TicketFormValues = {
  company: "", name: "", address: "", zone: "Central", phone: "", email: "",
  subject: "", description: "",
  category: "Security Cameras", priority: "Medium", source: "Phone",
  needsReview: false, reviewReason: "",
};

export default function TicketForm({ initial = EMPTY_FORM, extraNote }: { initial?: TicketFormValues; extraNote?: string }) {
  const { createTicket, addNote } = useStore();
  const router = useRouter();
  const [form, setForm] = useState<TicketFormValues>(initial);
  const set = (k: keyof TicketFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Critical tickets are always flagged so a person looks at them.
    const needsReview = form.needsReview || form.priority === "Critical";
    const t = createTicket({
      customer: { company: form.company, name: form.name, address: form.address, zone: form.zone, phone: form.phone, email: form.email },
      subject: form.subject,
      description: form.description,
      category: form.category,
      priority: form.priority,
      source: form.source,
      needsReview,
      reviewReason: needsReview ? form.reviewReason || (form.priority === "Critical" ? "Marked Critical when created." : "Flagged by staff when created.") : undefined,
    });
    if (extraNote) addNote(t.id, extraNote);
    router.push(`/tickets/${t.id}`);
  };

  const input = "mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white";
  const label = "block text-sm text-slate-700";

  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
      <fieldset className="grid sm:grid-cols-2 gap-4">
        <legend className="text-sm font-semibold mb-2">Customer</legend>
        <label className={label}>Company *<input required className={input} value={form.company} onChange={set("company")} /></label>
        <label className={label}>Contact name *<input required className={input} value={form.name} onChange={set("name")} /></label>
        <label className={label}>Site address *<input required className={input} value={form.address} onChange={set("address")} /></label>
        <label className={label}>Zone
          <select className={input} value={form.zone} onChange={set("zone")}>{ZONES.map((z) => <option key={z}>{z}</option>)}</select>
        </label>
        <label className={label}>Phone<input className={input} value={form.phone} onChange={set("phone")} /></label>
        <label className={label}>Email<input type="email" className={input} value={form.email} onChange={set("email")} /></label>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold mb-2">Problem</legend>
        <label className={label}>Short summary *<input required className={input} value={form.subject} onChange={set("subject")} placeholder="e.g. Front door card reader not working" /></label>
        <label className={label}>Details *<textarea required rows={6} className={input} value={form.description} onChange={set("description")} /></label>
        <div className="grid sm:grid-cols-3 gap-4">
          <label className={label}>Type
            <select className={input} value={form.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label className={label}>Priority
            <select className={input} value={form.priority} onChange={set("priority")}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>
          </label>
          <label className={label}>Received via
            <select className={input} value={form.source} onChange={set("source")}>
              <option>Phone</option><option>Email</option><option>Manual</option>
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.needsReview} onChange={set("needsReview")} />
          Flag for manager review
        </label>
        {form.needsReview && (
          <label className={label}>Reason for review<input className={input} value={form.reviewReason} onChange={set("reviewReason")} /></label>
        )}
      </fieldset>

      <button className="rounded-md bg-slate-900 text-white text-sm px-4 py-2 hover:bg-slate-700">Create ticket</button>
    </form>
  );
}
