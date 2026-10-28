// Small helpers for showing dates nicely.

export function timeAgo(iso: string, now = new Date()): string {
  const mins = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  const future = mins < 0;
  const m = Math.abs(mins);
  let s: string;
  if (m < 60) s = `${m}m`;
  else if (m < 60 * 24) s = `${Math.round(m / 60)}h`;
  else s = `${Math.round(m / 60 / 24)}d`;
  return future ? `in ${s}` : `${s} ago`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
