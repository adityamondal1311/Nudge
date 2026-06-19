"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { categorizeTicket, createTicket, getSimilarTickets } from "@/lib/api";
import { CATEGORIES, URGENCIES, type SimilarTicketResult } from "@/lib/types";

export default function NewTicketPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<string>("Medium");
  const [raisedBy, setRaisedBy] = useState("");

  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState<string | null>(null);
  const [similarResults, setSimilarResults] = useState<SimilarTicketResult[] | null>(null);

  const [category, setCategory] = useState<string | null>(null);
  const [categoryConfidence, setCategoryConfidence] = useState<number | null>(null);
  const [categoryReasoning, setCategoryReasoning] = useState<string | null>(null);
  const [categorizing, setCategorizing] = useState(false);
  const [categorizeError, setCategorizeError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canFindSimilar = title.trim().length > 0 && description.trim().length > 0;
  const canSubmit = canFindSimilar && raisedBy.trim().length > 0;

  async function handleFindSimilar() {
    setSimilarLoading(true);
    setSimilarError(null);
    try {
      const results = await getSimilarTickets(title, description);
      setSimilarResults(results);
    } catch (err) {
      setSimilarError(err instanceof Error ? err.message : "Failed to find similar tickets");
    } finally {
      setSimilarLoading(false);
    }
  }

  async function handleStartSubmit() {
    setCategorizing(true);
    setCategorizeError(null);
    try {
      const result = await categorizeTicket(title, description);
      setCategory(result.category);
      setCategoryConfidence(result.confidence);
      setCategoryReasoning(result.reasoning);
    } catch (err) {
      setCategorizeError(err instanceof Error ? err.message : "Failed to categorize ticket");
    } finally {
      setCategorizing(false);
    }
  }

  async function handleConfirmSubmit() {
    if (category === null || categoryConfidence === null || categoryReasoning === null) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const ticket = await createTicket({
        title,
        description,
        urgency,
        raised_by: raisedBy,
        category,
        category_confidence: categoryConfidence,
        category_reasoning: categoryReasoning,
      });
      router.push(`/tickets/${ticket.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create ticket");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Raise a Ticket</h1>
      <p className="mt-1 text-sm text-slate-500">
        IT, HR, Finance, and Admin support requests in one place.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Title</label>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Can't connect to VPN from home"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Urgency</label>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
            >
              {URGENCIES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Your name / email</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              value={raisedBy}
              onChange={(e) => setRaisedBy(e.target.value)}
              placeholder="jane@thenudge.org"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={!canFindSimilar || similarLoading}
          onClick={handleFindSimilar}
          className="w-full rounded-md bg-indigo-600 px-4 py-3 text-base font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {similarLoading ? "Searching..." : "✨ Find Similar Resolved Issues"}
        </button>

        {similarError && <p className="text-sm text-red-600">{similarError}</p>}

        {similarResults !== null && (
          <div className="rounded-xl border-2 border-indigo-300 bg-indigo-50 p-5 shadow-lg shadow-indigo-100 ring-1 ring-indigo-100">
            {similarResults.length > 0 ? (
              <>
                <p className="text-base font-semibold text-indigo-950">
                  We found {similarResults.length} previously resolved ticket
                  {similarResults.length > 1 ? "s" : ""} that may solve your issue.
                </p>
                <div className="mt-3 space-y-3">
                  {similarResults.map((r) => (
                    <div key={r.id} className="rounded-md bg-white p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">{r.title}</span>
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          {(r.similarity * 100).toFixed(0)}% match
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        {r.category}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{r.resolution_notes}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-600">
                No closely matching resolved tickets found. Feel free to submit a new one below.
              </p>
            )}
          </div>
        )}

        <div className="border-t border-slate-200 pt-4">
          {category === null ? (
            <button
              type="button"
              disabled={!canSubmit || categorizing}
              onClick={handleStartSubmit}
              className="w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
            >
              {categorizing ? "Categorizing..." : "Continue to Submit →"}
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Category</label>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Suggested: {category} — {categoryReasoning}
                </p>
              </div>

              {submitError && <p className="text-sm text-red-600">{submitError}</p>}

              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSubmit}
                className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? "Submitting..." : "Confirm & Create Ticket"}
              </button>
            </div>
          )}
          {categorizeError && <p className="mt-2 text-sm text-red-600">{categorizeError}</p>}
        </div>
      </div>
    </main>
  );
}
