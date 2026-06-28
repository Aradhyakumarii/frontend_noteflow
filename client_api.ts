import type {
  MeetingSummary,
  PipelineStats,
  QueryResponse,
  Transcript,
  TranscriptListItem,
} from "./types_frontend";

const BASE = "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string; version: string }>("/health"),

  stats: () => request<PipelineStats>("/stats"),

  listTranscripts: () =>
    request<{ transcripts: TranscriptListItem[] }>("/transcripts"),

  getTranscript: (id: string) => request<Transcript>(`/transcripts/${id}`),

  getSummary: (id: string) => request<MeetingSummary>(`/transcripts/${id}/summary`),

  summarize: (id: string) =>
    request<MeetingSummary>(`/summarize/${id}`, { method: "POST" }),

  query: (question: string, transcriptId?: string | null, topK = 5) =>
    request<QueryResponse>("/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        transcript_id: transcriptId ?? null,
        top_k: topK,
      }),
    }),

  ingestText: (id: string, title: string, text: string) =>
    request<{ status: string; transcript_id: string; title: string }>("/ingest/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title, text }),
    }),

  ingestAudio: async (file: File, title?: string) => {
    const form = new FormData();
    form.append("file", file);
    const qs = title ? `?title=${encodeURIComponent(title)}` : "";
    const res = await fetch(`${BASE}/ingest/audio${qs}`, { method: "POST", body: form });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{
      status: string;
      transcript_id: string;
      title: string;
      duration_seconds: number | null;
    }>;
  },
};
