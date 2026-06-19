"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { listTickets, updateStatus } from "@/lib/api";
import { CATEGORIES, STATUSES, type Ticket } from "@/lib/types";

interface PendingResolution {
  ticketId: number;
  targetStatus: string;
}

const TERMINAL_STATUSES = new Set(["Resolved", "Closed"]);

export default function AgentBoardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const [pending, setPending] = useState<PendingResolution | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTickets();
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const visibleTickets =
    categoryFilter === "All" ? tickets : tickets.filter((t) => t.category === categoryFilter);

  function startStatusChange(ticket: Ticket, newStatus: string) {
    setActionError(null);
    if (TERMINAL_STATUSES.has(newStatus)) {
      setPending({ ticketId: ticket.id, targetStatus: newStatus });
      setNotesDraft(ticket.resolution_notes ?? "");
      return;
    }
    void applyStatusChange(ticket.id, newStatus);
  }

  async function applyStatusChange(ticketId: number, newStatus: string, notes?: string) {
    setSubmitting(true);
    setActionError(null);
    try {
      await updateStatus(ticketId, newStatus, notes);
      setPending(null);
      setNotesDraft("");
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSubmitting(false);
    }
  }

  function cancelPending() {
    setPending(null);
    setNotesDraft("");
    setActionError(null);
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Agent Board</h1>
          <p className="mt-1 text-sm text-slate-500">All tickets, grouped by status.</p>
        </div>
        <Link href="/new" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          + Raise a Ticket
        </Link>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-slate-700">Department</label>
        <select
          className="ml-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="All">All</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-4 text-sm text-slate-500">Loading tickets...</p>}

      {!loading && !error && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          {STATUSES.map((status) => {
            const columnTickets = visibleTickets.filter((t) => t.status === status);
            return (
              <div key={status} className="rounded-lg bg-slate-100 p-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-slate-700">{status}</h2>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {columnTickets.length}
                  </span>
                </div>

                <div className="mt-3 space-y-3">
                  {columnTickets.map((ticket) => (
                    <div key={ticket.id} className="rounded-md bg-white p-3 shadow-sm">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-indigo-600"
                      >
                        {ticket.title}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-medium uppercase tracking-wide">
                          {ticket.category}
                        </span>
                        <span>·</span>
                        <span>{ticket.urgency}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{ticket.raised_by}</p>

                      {pending?.ticketId === ticket.id ? (
                        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2">
                          <label className="text-xs font-medium text-amber-900">
                            Resolution notes (required to move to {pending.targetStatus})
                          </label>
                          <textarea
                            autoFocus
                            className="mt-1 w-full rounded-md border border-amber-300 px-2 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
                            rows={3}
                            value={notesDraft}
                            onChange={(e) => setNotesDraft(e.target.value)}
                            placeholder="What was done to resolve this ticket?"
                          />
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              disabled={notesDraft.trim().length === 0 || submitting}
                              onClick={() =>
                                applyStatusChange(ticket.id, pending.targetStatus, notesDraft)
                              }
                              className="flex-1 rounded-md bg-amber-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              {submitting ? "Saving..." : "Confirm"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelPending}
                              disabled={submitting}
                              className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <select
                          className="mt-3 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-slate-500 focus:outline-none"
                          value={ticket.status}
                          onChange={(e) => startStatusChange(ticket, e.target.value)}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      )}

                      {actionError && pending?.ticketId === ticket.id && (
                        <p className="mt-1 text-xs text-red-600">{actionError}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
