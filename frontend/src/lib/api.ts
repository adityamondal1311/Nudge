import type {
  CategorizeResponse,
  SimilarTicketResult,
  Ticket,
  TicketCreatePayload,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export function getSimilarTickets(title: string, description: string) {
  return request<SimilarTicketResult[]>("/tickets/similar", {
    method: "POST",
    body: JSON.stringify({ title, description }),
  });
}

export function categorizeTicket(title: string, description: string) {
  return request<CategorizeResponse>("/tickets/categorize", {
    method: "POST",
    body: JSON.stringify({ title, description }),
  });
}

export function createTicket(payload: TicketCreatePayload) {
  return request<Ticket>("/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listTickets(params?: { status?: string; category?: string }) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.category) search.set("category", params.category);
  const query = search.toString();
  return request<Ticket[]>(`/tickets${query ? `?${query}` : ""}`);
}

export function getTicket(id: number) {
  return request<Ticket>(`/tickets/${id}`);
}

export function updateStatus(id: number, status: string, resolutionNotes?: string) {
  return request<Ticket>(`/tickets/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, resolution_notes: resolutionNotes }),
  });
}

export function patchTicket(
  id: number,
  payload: { assigned_agent?: string; urgency?: string; resolution_notes?: string }
) {
  return request<Ticket>(`/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
