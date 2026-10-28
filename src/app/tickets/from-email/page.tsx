"use client";

// ─────────────────────────────────────────────────────────────
// EMAIL → TICKET. Paste a customer email, AI fills in the ticket,
// a person checks it and clicks "Create ticket".
// (Stage 3 will pull emails straight from Gmail instead of pasting.)
// ─────────────────────────────────────────────────────────────

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import TicketForm, { EMPTY_FORM, type TicketFormValues } from "@/components/TicketForm";
import { SAMPLE_EMAILS } from "@/data/sampleEmails";
import type { ExtractedTicket } from "@/lib/ai";
import type { Zone } from "@/lib/types";

export default function FromEmailPage() {
  const { data, createTicket } = useStore();
  const [autoCreatedId, setAutoCreatedId] = useState<string | null>(null);
  const [emailText, setEmailText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ExtractedTicket | null>(null);
  const [formKey, setFormKey] = useState(0); // forces the form to refresh with new AI results

  const readEmail = async () => {
    setLoading(true); setError(""); setResult(null); setAutoCreatedId(null);
    try {
      const res = await fetch("/api/parse-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
      const ai: ExtractedTicket = body.ticket;
      if (canAutoCreate(ai)) {
        // Autopilot: routine email → ticket created right away (and auto-assigned).
        const t = createTicket(
          {
            customer: { company: ai.company, name: ai.customerName, address: ai.address, zone: ai.zone as Zone, phone: ai.phone, email: ai.email },
            subject: ai.subject, description: emailText.trim(), category: ai.category, priority: ai.priority,
            source: "Email", needsReview: false,
          },
          { byAutopilot: true, note: `AI read the email: ${ai.priority} priority — ${ai.priorityReason}${ai.missingInfo.length ? ` Missing info: ${ai.missingInfo.join("; ")}.` : ""}` },
        );
        setAutoCreatedId(t.id);
      }
      setResult(ai);
      setFormKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /** Routine emails are created automatically. Anything risky or incomplete goes to a person. */
  function canAutoCreate(ai: ExtractedTicket): boolean {
    return (
      data.automation.settings.autoCreateFromEmail &&
      !ai.needsHumanReview && !ai.possibleEmergency &&
      ai.priority !== "Critical" && ai.category !== "Fire Alarm" &&
      ai.zone !== "Unknown" && Boolean(ai.company && ai.address)
    );
  }
  const autoTicket = autoCreatedId ? data.tickets.find((t) => t.id === autoCreatedId) : undefined;
  const autoTech = data.technicians.find((t) => t.id === autoTicket?.assignedTechId);

  const formValues: TicketFormValues | null = result && {
    ...EMPTY_FORM,
    company: result.company,
    name: result.customerName,
    address: result.address,
    zone: result.zone === "Unknown" ? EMPTY_FORM.zone : result.zone,
    phone: result.phone,
    email: result.email,
    subject: result.subject,
    description: emailText.trim(),
    category: result.category,
    priority: result.priority,
    source: "Email",
    needsReview: result.needsHumanReview || result.possibleEmergency,
    reviewReason: result.reviewReason,
  };

  return (
    <div className="max-w-6xl space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">✨ Email → Ticket</h1>
        <p className="text-sm text-slate-500">Paste a customer email. Routine requests become tickets automatically; anything urgent or unclear is shown to you to check.</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-500">Try a sample:</span>
            {SAMPLE_EMAILS.map((s) => (
              <button key={s.label} onClick={() => { setEmailText(s.text); setResult(null); setError(""); }} className="text-xs rounded-full border border-slate-300 px-2 py-1 hover:bg-slate-50">
                {s.label}
              </button>
            ))}
          </div>
          <textarea
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            rows={16}
            placeholder="Paste the customer's email here…"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
          />
          <button
            onClick={readEmail}
            disabled={loading || emailText.trim().length < 10}
            className="rounded-md bg-blue-700 text-white text-sm px-4 py-2 hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Reading email…" : "✨ Read with AI"}
          </button>
          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</p>}
        </section>

        <section className="space-y-3">
          {!result && !loading && (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              The AI&apos;s ticket will appear here for you to check.
            </div>
          )}
          {loading && <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 animate-pulse">Reading the email…</div>}
          {autoTicket && (
            <div className="rounded-lg border-2 border-emerald-500 bg-emerald-50 p-5 space-y-2 text-sm">
              <p className="text-base font-semibold text-emerald-900">🤖 Done: no one had to touch this.</p>
              <p>
                Ticket <Link href={`/tickets/${autoTicket.id}`} className="font-mono text-blue-700 underline">{autoTicket.id}</Link> created
                ({autoTicket.priority}, {autoTicket.category})
                {autoTech ? <> and assigned to <strong>{autoTech.name}</strong> ({autoTech.zone} zone).</> : "."}
              </p>
              <p className="text-slate-700">{result?.priorityReason}</p>
              {result && result.missingInfo.length > 0 && <p>❓ Still to ask the customer: {result.missingInfo.join("; ")}</p>}
              <Link href={`/tickets/${autoTicket.id}`} className="inline-block rounded-md bg-slate-900 text-white px-3 py-1.5">Open ticket</Link>
            </div>
          )}
          {result && formValues && !autoCreatedId && (
            <>
              {result.possibleEmergency && (
                <div className="rounded-lg border-2 border-red-500 bg-red-50 p-3 text-sm text-red-900">
                  <strong>⚠ Possible emergency.</strong> This app does not contact emergency services.
                  Follow company procedure: contact the monitoring center / call 911 if appropriate.
                </div>
              )}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm space-y-1">
                <p><strong>AI suggestion:</strong> {result.priority} priority, {result.category}. <span className="text-slate-700">{result.priorityReason}</span></p>
                {result.needsHumanReview && <p>👁 Flagged for review: {result.reviewReason}</p>}
                {result.missingInfo.length > 0 && <p>❓ Ask the customer for: {result.missingInfo.join("; ")}</p>}
                <p className="text-xs text-slate-500">Check everything below. You can change any field before creating the ticket.</p>
              </div>
              <TicketForm
                key={formKey}
                initial={formValues}
                extraNote={`AI read the email: ${result.priority} priority — ${result.priorityReason}${result.missingInfo.length ? ` Missing info: ${result.missingInfo.join("; ")}.` : ""}`}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
