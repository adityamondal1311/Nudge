"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTicket } from "@/lib/api";
import type { Ticket } from "@/lib/types";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTicket(Number(params.id))
      .then(setTicket)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load ticket"));
  }, [params.id]);

  if (error) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-red-600">{error}</p>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-slate-500">Loading ticket...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{ticket.title}</h1>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {ticket.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500">Ticket #{ticket.id}</p>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="font-medium text-slate-500">Category</dt>
          <dd className="text-slate-900">{ticket.category}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Urgency</dt>
          <dd className="text-slate-900">{ticket.urgency}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Raised by</dt>
          <dd className="text-slate-900">{ticket.raised_by}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Assigned agent</dt>
          <dd className="text-slate-900">{ticket.assigned_agent ?? "Unassigned"}</dd>
        </div>
      </dl>

      {ticket.category_reasoning && (
        <p className="mt-2 text-xs text-slate-400">
          AI category suggestion reasoning: {ticket.category_reasoning}
        </p>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-medium text-slate-500">Description</h2>
        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{ticket.description}</p>
      </div>

      {ticket.resolution_notes && (
        <div className="mt-6 rounded-md bg-emerald-50 p-4">
          <h2 className="text-sm font-medium text-emerald-800">Resolution Notes</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-emerald-900">
            {ticket.resolution_notes}
          </p>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-medium text-slate-500">Activity Log</h2>
        {/* In production this would trigger email/Slack/WhatsApp notifications; here it's just a log. */}
        <ol className="mt-2 space-y-2 border-l border-slate-200 pl-4">
          {ticket.status_history.map((entry, idx) => (
            <li key={idx} className="text-sm">
              <span className="font-medium text-slate-900">{entry.status}</span>
              <span className="ml-2 text-slate-400">
                {new Date(entry.timestamp).toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
