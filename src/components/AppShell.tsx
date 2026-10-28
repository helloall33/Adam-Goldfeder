"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

// The left-hand menu. To add a new page to the menu, add a line here.
const NAV = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/tickets", label: "Service Tickets", icon: "☰" },
  { href: "/tickets/from-email", label: "Email → Ticket", icon: "✨" },
  { href: "/tickets/new", label: "New Ticket", icon: "+" },
  { href: "/technicians", label: "Technicians", icon: "👷" },
  { href: "/me", label: "Technician View", icon: "📱" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { data, resetDemoData } = useStore();
  const reviewCount = data.tickets.filter((t) => t.needsReview).length;

  const isActive = (href: string) =>
    href === "/" ? path === "/" : href === "/tickets" ? path === "/tickets" || path.startsWith("/tickets/SR") : path.startsWith(href);

  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-slate-900 text-slate-200 md:w-60 md:shrink-0 md:min-h-screen flex md:flex-col">
        <div className="px-5 py-4 md:py-6 border-b border-slate-800 hidden md:block">
          <div className="text-white font-semibold tracking-tight">Sherlock Ops</div>
          <div className="text-xs text-slate-400">Service Operations · Demo</div>
        </div>
        <nav className="flex md:flex-col gap-1 p-2 md:p-3 overflow-x-auto flex-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm whitespace-nowrap ${
                isActive(n.href) ? "bg-slate-800 text-white" : "hover:bg-slate-800/60"
              }`}
            >
              <span className="w-4 text-center">{n.icon}</span>
              {n.label}
              {n.href === "/tickets" && reviewCount > 0 && (
                <span className="ml-auto rounded-full bg-yellow-400 text-slate-900 text-xs px-1.5">{reviewCount}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="hidden md:block p-4 text-xs text-slate-400 border-t border-slate-800 space-y-2">
          <p>Fictional demo data. Not connected to real company systems.</p>
          <button
            onClick={() => confirm("Reset all tickets and technicians to the original demo data?") && resetDemoData()}
            className="underline hover:text-white"
          >
            Reset demo data
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-4 md:p-8 bg-slate-50">{children}</main>
    </div>
  );
}
