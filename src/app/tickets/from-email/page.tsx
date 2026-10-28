"use client";

// ─────────────────────────────────────────────────────────────
// EMAIL → TICKET. Paste a customer email, AI fills in the ticket,
// a person checks it and clicks "Create ticket".
// (Stage 3 will pull emails straight from Gmail instead of pasting.)
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import TicketForm, { EMPTY_FORM, type TicketFormValues } from "@/components/TicketForm";
import { SAMPLE_EMAILS } from "@/data/sampleEmails";
import type { ExtractedTicket } from "@/lib/ai";

export default function FromEmailPage() {
  const [emailText, setEmailText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ExtractedTicket | null>(null);
  const [formKey, setFormKey] = useState(0); // forces the form to refresh with new AI results

  const readEmail = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/parse-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
      setResult(body.ticket);
      setFormKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

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
        <p className="text-sm text-slate-500">Paste a customer email. AI reads it and fills in the ticket, then you check it and click Create.</p>
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
          {result && formValues && (
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
