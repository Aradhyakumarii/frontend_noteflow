import { AlertCircle, FileUp, Loader2, Mic, Type, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "./client_api";

export interface UploadDraft {
  mode: "text" | "audio";
  title?: string;
  text?: string;
  file?: File;
}

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
  draft?: UploadDraft | null;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
}

export function UploadDialog({ open, onClose, onUploaded, draft }: UploadDialogProps) {
  const [mode, setMode] = useState<"text" | "audio">("text");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setText("");
    setFile(null);
    setError(null);
    setMode("text");
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    if (draft) {
      setMode(draft.mode);
      setTitle(draft.title ?? "");
      setText(draft.text ?? "");
      setFile(draft.file ?? null);
      setError(null);
    } else {
      reset();
    }
  }, [open, draft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "text") {
        if (!title.trim() || !text.trim()) {
          throw new Error("Title and transcript text are required");
        }
        const id = slugify(title) || `meeting_${Date.now()}`;
        await api.ingestText(id, title.trim(), text.trim());
      } else {
        if (!file) throw new Error("Select an audio file");
        await api.ingestAudio(file, title.trim() || undefined);
      }
      reset();
      onUploaded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close upload dialog"
        className="absolute inset-0 bg-surface-950/70 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-dialog-title"
        className="relative z-10 w-full max-w-lg animate-slide-up rounded-2xl border border-white/[0.08] bg-surface-900 shadow-panel ring-1 ring-white/[0.04]"
      >
        <div className="flex items-start justify-between border-b border-white/[0.06] px-6 py-5">
          <div>
            <h2 id="upload-dialog-title" className="font-display text-base font-semibold text-ink-100">
              Add meeting transcript
            </h2>
            <p className="mt-1 text-xs text-ink-400">
              Text or audio — transcribed, chunked, and indexed for search
            </p>
          </div>
          <button
            type="button"
            onClick={() => !loading && onClose()}
            disabled={loading}
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-surface-800 hover:text-ink-200 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="flex rounded-lg bg-surface-800/60 p-1">
            <button
              type="button"
              onClick={() => setMode("text")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                mode === "text"
                  ? "bg-surface-700 text-ink-100 shadow-sm"
                  : "text-ink-400 hover:text-ink-200"
              }`}
            >
              <Type className="h-3.5 w-3.5" />
              Text
            </button>
            <button
              type="button"
              onClick={() => setMode("audio")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                mode === "audio"
                  ? "bg-surface-700 text-ink-100 shadow-sm"
                  : "text-ink-400 hover:text-ink-200"
              }`}
            >
              <Mic className="h-3.5 w-3.5" />
              Audio
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-300">Meeting title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Q1 Product Sync"
              className="w-full rounded-lg border border-white/[0.08] bg-surface-800/60 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-400 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          {mode === "text" ? (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-300">Transcript</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder="Paste meeting notes or transcript..."
                className="w-full rounded-lg border border-white/[0.08] bg-surface-800/60 px-3 py-2.5 text-sm leading-relaxed text-ink-100 placeholder:text-ink-400 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-300">Audio file</label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-surface-800/30 px-6 py-8 transition-colors hover:border-accent/30 hover:bg-accent/5">
                <FileUp className="mb-2 h-7 w-7 text-accent/60" />
                <span className="text-sm text-ink-300">
                  {file ? file.name : "Drop MP3, WAV, M4A, or click to browse"}
                </span>
                <input
                  type="file"
                  accept=".mp3,.wav,.m4a,.flac,.ogg"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-red-500/20">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => !loading && onClose()}
              disabled={loading}
              className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-medium text-ink-300 transition-colors hover:bg-surface-800 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-semibold text-surface-950 transition-all hover:bg-accent-glow disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Indexing...
                </>
              ) : (
                "Index meeting"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
