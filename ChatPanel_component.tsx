import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Plus,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { api } from "./client_api";
import type { ChatMessage, RetrievalResult, TranscriptListItem } from "./types_frontend";
import { UploadDialog, type UploadDraft } from "./UploadDialog_component";
import { Badge, LoadingDots } from "./ui_component";

const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".m4a", ".flac", ".ogg"]);

function titleFromFilename(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
}

const SUGGESTED_PROMPTS = [
  "What were the key decisions across all meetings?",
  "List all action items and who owns them",
  "Summarize the pilot results and ROI",
  "What blockers were mentioned in engineering standups?",
  "What is the MVP scope and timeline?",
];

interface ChatPanelProps {
  transcripts: TranscriptListItem[];
  selectedTranscriptId: string | null;
  onUploaded: () => void;
}

function uid() {
  return crypto.randomUUID();
}

function SourceCard({ source, index }: { source: RetrievalResult; index: number }) {
  const [open, setOpen] = useState(false);
  if (!source) return null;
  return (
    <div className="rounded-lg border border-white/[0.06] bg-surface-950/60">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs"
      >
        <span className="text-ink-300">
          Source {index + 1} · <span className="text-accent/80">{source.transcript_id}</span>
          <span className="ml-2 text-ink-400">score {(source.score * 100).toFixed(0)}%</span>
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-ink-400" /> : <ChevronDown className="h-3.5 w-3.5 text-ink-400" />}
      </button>
      {open && (
        <p className="border-t border-white/[0.04] px-3 py-2 text-xs leading-relaxed text-ink-400">
          {source.text}
        </p>
      )}
    </div>
  );
}

export function ChatPanel({ transcripts, selectedTranscriptId, onUploaded }: ChatPanelProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadDraft, setUploadDraft] = useState<UploadDraft | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "assistant",
      content:
        "Hi! I'm your NoteFlow_edge_pro assistant. Ask me anything about your indexed meeting transcripts — decisions, action items, timelines, or participant responsibilities.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<"all" | "selected">("all");
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (selectedTranscriptId) setScope("selected");
  }, [selectedTranscriptId]);

  const sendMessage = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const transcriptId = scope === "selected" ? selectedTranscriptId : null;
      const response = await api.query(question, transcriptId);
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: response.answer,
        sources: response.sources,
        model: response.model,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: `Sorry, I couldn't process that request. ${err instanceof Error ? err.message : "Unknown error"}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const selectedTitle = transcripts.find((t) => t.id === selectedTranscriptId)?.title;

  const openUpload = (draft: UploadDraft | null = null) => {
    setUploadDraft(draft);
    setUploadOpen(true);
  };

  const closeUpload = () => {
    setUploadOpen(false);
    setUploadDraft(null);
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";
    const title = titleFromFilename(file.name);

    if (AUDIO_EXTENSIONS.has(ext)) {
      openUpload({ mode: "audio", file, title });
      return;
    }

    const text = await file.text();
    openUpload({ mode: "text", text, title });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <UploadDialog
        open={uploadOpen}
        onClose={closeUpload}
        onUploaded={onUploaded}
        draft={uploadDraft}
      />

      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
            <Bot className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-ink-100">Meeting Assistant</h2>
            <p className="text-xs text-ink-400">
              {transcripts.length === 0
                ? "Add a transcript to start asking questions"
                : "Search across indexed meetings with source citations"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openUpload()}
            className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-surface-800/60 px-3 py-2 text-xs font-medium text-ink-200 transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
          >
            <Plus className="h-3.5 w-3.5" />
            Add meeting
          </button>

          <div className="hidden h-6 w-px bg-white/[0.08] sm:block" />

          <div className="flex items-center gap-1 rounded-lg bg-surface-800/60 p-1">
            <button
              type="button"
              onClick={() => setScope("all")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                scope === "all" ? "bg-surface-700 text-ink-100 shadow-sm" : "text-ink-400 hover:text-ink-200"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setScope("selected")}
              disabled={!selectedTranscriptId}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-40 ${
                scope === "selected" ? "bg-surface-700 text-ink-100 shadow-sm" : "text-ink-400 hover:text-ink-200"
              }`}
            >
              Selected
            </button>
          </div>
        </div>
      </div>

      {scope === "selected" && selectedTitle && (
        <div className="shrink-0 border-b border-white/[0.04] bg-surface-800/30 px-6 py-2">
          <p className="text-xs text-ink-400">
            Scoped to: <span className="text-accent">{selectedTitle}</span>
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex animate-slide-up gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  msg.role === "user"
                    ? "bg-surface-700 text-ink-200"
                    : "bg-accent/10 text-accent ring-1 ring-accent/20"
                }`}
              >
                {msg.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              </div>

              <div className={`max-w-[85%] space-y-2 ${msg.role === "user" ? "items-end" : ""}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-accent/15 text-ink-100 ring-1 ring-accent/20"
                      : "glass text-ink-200 shadow-panel"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {msg.role === "assistant" && msg.model && (
                  <div className="flex items-center gap-2 px-1">
                    <Badge variant="default">{msg.model}</Badge>
                    {msg.sources && msg.sources.length > 0 && (
                      <Badge variant="accent">{msg.sources.length} sources</Badge>
                    )}
                  </div>
                )}

                {msg.sources && msg.sources.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {msg.sources.map((src, i) => (
                      <SourceCard key={src.chunk_id} source={src} index={i} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="glass rounded-2xl px-4 py-2 shadow-panel">
                <LoadingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {messages.length <= 1 && transcripts.length === 0 && (
        <div className="shrink-0 border-t border-white/[0.04] px-6 py-5">
          <div className="mx-auto max-w-3xl rounded-xl border border-dashed border-white/[0.08] bg-surface-800/30 px-6 py-8 text-center">
            <p className="text-sm font-medium text-ink-200">No meetings indexed yet</p>
            <p className="mt-1 text-xs text-ink-400">
              Upload a transcript or audio recording to enable Q&amp;A
            </p>
            <button
              type="button"
              onClick={() => openUpload()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface-950 transition-all hover:bg-accent-glow"
            >
              <Plus className="h-4 w-4" />
              Add your first meeting
            </button>
          </div>
        </div>
      )}

      {messages.length <= 1 && transcripts.length > 0 && (
        <div className="shrink-0 border-t border-white/[0.04] px-6 py-4">
          <p className="mb-3 text-xs font-medium text-ink-400">Try asking</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                disabled={loading}
                className="rounded-lg border border-white/[0.06] bg-surface-800/60 px-3 py-1.5 text-left text-xs text-ink-300 transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-accent disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-white/[0.06] bg-surface-900/80 px-6 py-4 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-3">
          <div className="relative flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.text,.mp3,.wav,.m4a,.flac,.ogg"
              className="hidden"
              onChange={handleFileAttach}
            />
            <button
              type="button"
              onClick={handleAttachClick}
              className="absolute bottom-2.5 left-2 flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-surface-700/80 hover:text-accent"
              aria-label="Attach transcript or audio"
              title="Attach transcript or audio"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              rows={1}
              placeholder="Ask about decisions, action items, timelines..."
              className="max-h-32 min-h-[48px] w-full resize-none rounded-xl border border-white/[0.08] bg-surface-800/80 py-3 pl-11 pr-4 text-sm text-ink-100 placeholder:text-ink-400 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-surface-950 transition-all hover:bg-accent-glow disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-ink-400">
          Enter to send · Shift+Enter for new line · Attach icon to upload meetings
        </p>
      </form>
    </div>
  );
}
