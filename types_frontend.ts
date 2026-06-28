export interface TranscriptListItem {
  id: string;
  title: string;
  created_at: string | null;
  duration_seconds: number | null;
  has_summary: boolean;
  word_count: number;
}

export interface Transcript {
  id: string;
  title: string;
  source_file: string;
  created_at: string;
  duration_seconds: number | null;
  full_text: string;
  metadata: Record<string, unknown>;
}

export interface MeetingSummary {
  transcript_id: string;
  title: string;
  executive_summary: string;
  key_decisions: string[];
  action_items: string[];
  participants: string[];
  topics: string[];
  follow_ups: string[];
}

export interface RetrievalResult {
  chunk_id: string;
  transcript_id: string;
  text: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface QueryResponse {
  question: string;
  answer: string;
  sources: RetrievalResult[];
  model: string;
}

export interface PipelineStats {
  stored_transcripts: number;
  indexed_transcripts: number;
  vector_count: number;
  whisper_model: string;
  embedding_model: string;
  gpt_model: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: RetrievalResult[];
  model?: string;
  timestamp: Date;
}
