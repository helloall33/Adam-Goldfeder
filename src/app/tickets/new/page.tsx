import Link from "next/link";
import TicketForm from "@/components/TicketForm";

// Manual ticket form (e.g. for phone calls).

export default function NewTicketPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">New Service Ticket</h1>
        <Link href="/tickets/from-email" className="text-sm text-blue-700 hover:underline">✨ Have an email? Let AI fill this in →</Link>
      </div>
      <TicketForm />
    </div>
  );
}
