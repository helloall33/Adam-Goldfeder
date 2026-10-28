import type { Priority, TicketStatus } from "@/lib/types";

// Colored labels. Colors always come with text, never color alone.

const priorityStyles: Record<Priority, string> = {
  Critical: "bg-red-100 text-red-800 ring-red-200",
  High: "bg-orange-100 text-orange-800 ring-orange-200",
  Medium: "bg-amber-50 text-amber-800 ring-amber-200",
  Low: "bg-slate-100 text-slate-700 ring-slate-200",
};

const statusStyles: Record<TicketStatus, string> = {
  Pending: "bg-slate-100 text-slate-700 ring-slate-200",
  Assigned: "bg-blue-50 text-blue-800 ring-blue-200",
  "In Progress": "bg-violet-50 text-violet-800 ring-violet-200",
  Completed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
};

const base = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap";

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`${base} ${priorityStyles[priority]}`}>{priority === "Critical" && "⚠ "}{priority}</span>;
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`${base} ${statusStyles[status]}`}>{status === "Completed" && "✓ "}{status}</span>;
}

export function OverdueBadge() {
  return <span className={`${base} bg-red-600 text-white ring-red-600`}>⏱ Overdue</span>;
}

export function ReviewBadge() {
  return <span className={`${base} bg-yellow-100 text-yellow-900 ring-yellow-300`}>👁 Needs review</span>;
}
