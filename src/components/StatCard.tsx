import Link from "next/link";

export default function StatCard({
  label, value, hint, href, tone = "default",
}: { label: string; value: string | number; hint?: string; href?: string; tone?: "default" | "alert" | "warn" }) {
  const toneCls = tone === "alert" ? "border-l-red-500" : tone === "warn" ? "border-l-yellow-400" : "border-l-slate-300";
  const body = (
    <div className={`bg-white rounded-lg border border-slate-200 border-l-4 ${toneCls} p-4 h-full hover:shadow-sm transition`}>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-slate-900 tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
