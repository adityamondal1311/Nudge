export const CATEGORIES = ["IT", "HR", "Finance", "Admin"] as const;
export type Category = (typeof CATEGORIES)[number];

export const URGENCIES = ["Low", "Medium", "High"] as const;
export type Urgency = (typeof URGENCIES)[number];

export const STATUSES = ["Open", "In Progress", "Resolved", "Closed"] as const;
export type Status = (typeof STATUSES)[number];

export const TERMINAL_STATUSES_LIST: string[] = ["Resolved", "Closed"];

export interface StatusHistoryEntry {
  status: string;
  timestamp: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  category: string;
  category_confidence: number | null;
  category_reasoning: string | null;
  urgency: string;
  status: string;
  raised_by: string;
  assigned_agent: string | null;
  resolution_notes: string | null;
  status_history: StatusHistoryEntry[];
  created_at: string;
  updated_at: string;
}

export interface SimilarTicketResult {
  id: number;
  title: string;
  category: string;
  resolution_notes: string;
  similarity: number;
}

export interface CategorizeResponse {
  category: string;
  confidence: number;
  reasoning: string;
}

export interface TicketCreatePayload {
  title: string;
  description: string;
  urgency: string;
  raised_by: string;
  category: string;
  category_confidence: number;
  category_reasoning: string;
}
