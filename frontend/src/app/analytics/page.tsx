"use client";

import { useEffect, useState } from "react";
import { listTickets } from "@/lib/api";
import { CATEGORIES, STATUSES, TERMINAL_STATUSES_LIST, type Ticket } from "@/lib/types";

function formatDuration(hours: number): string {
  if (hours < 24) return `${hours.toFixed(1)} hrs`;
  return `${(hours / 24).toFixed(1)} days`;
}

export default function AnalyticsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTickets()
      .then(setTickets)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load tickets"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <p className="text-sm text-slate-500">Loading analytics...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <p className="text-sm text-red-600">{error}</p>
      </main>
    );
  }

  const total = tickets.length;

  const byCategory = CATEGORIES.map((category) => {
    const count = tickets.filter((t) => t.category === category).length;
    return { category, count, pct: total ? (count / total) * 100 : 0 };
  }).sort((a, b) => b.count - a.count);

  const byStatus = STATUSES.map((status) => ({
    status,
    count: tickets.filter((t) => t.status === status).length,
  }));

  const resolvedDurationsHours = tickets
    .filter((t) => TERMINAL_STATUSES_LIST.includes(t.status))
    .map((t) => {
      const resolvedEntry = [...t.status_history]
        .reverse()
        .find((h) => TERMINAL_STATUSES_LIST.includes(h.status));
      if (!resolvedEntry) return null;
      const createdAt = new Date(t.created_at).getTime();
      const resolvedAt = new Date(resolvedEntry.timestamp).getTime();
      return (resolvedAt - createdAt) / (1000 * 60 * 60);
    })
    .filter((h): h is number => h !== null && h >= 0);

  const avgResolutionHours =
    resolvedDurationsHours.length > 0
      ? resolvedDurationsHours.reduce((a, b) => a + b, 0) / resolvedDurationsHours.length
      : null;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
      <p className="mt-1 text-sm text-slate-500">{total} tickets total.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Avg. Resolution Time
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {avgResolutionHours !== null ? formatDuration(avgResolutionHours) : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Across {resolvedDurationsHours.length} resolved/closed tickets
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Open + In Progress
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {byStatus.find((s) => s.status === "Open")!.count +
              byStatus.find((s) => s.status === "In Progress")!.count}
          </p>
          <p className="mt-1 text-xs text-slate-400">Currently active tickets</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Top Category
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {byCategory[0]?.category ?? "—"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {byCategory[0] ? `${byCategory[0].pct.toFixed(0)}% of all tickets` : ""}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-700">
            Tickets by Category (% of total)
          </h2>
          <div className="mt-3 space-y-2">
            {byCategory.map(({ category, count, pct }) => (
              <div key={category}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{category}</span>
                  <span className="text-slate-500">
                    {count} ({pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-700">Tickets by Status</h2>
          <div className="mt-3 space-y-2">
            {byStatus.map(({ status, count }) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{status}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
