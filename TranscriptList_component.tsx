import { Calendar, CheckCircle2, FileText, Search } from "lucide-react";
import type { TranscriptListItem } from "./types_frontend";
import { Badge } from "./ui_component";

interface TranscriptListProps {
  transcripts: TranscriptListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TranscriptList({ transcripts, selectedId, onSelect, loading }: TranscriptListProps) {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-white/[0.06] bg-surface-900/50">
      <div className="border-b border-white/[0.06] px-4 py-4">
        <h2 className="font-display text-sm font-semibold text-ink-100">Meetings</h2>
        <p className="mt-0.5 text-xs text-ink-400">{transcripts.length} indexed</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 animate-pulse rounded-xl bg-surface-800" />
            ))}
          </div>
        ) : transcripts.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-ink-400/50" />
            <p className="text-sm text-ink-400">No meetings yet</p>
            <p className="mt-1 text-xs text-ink-400/70">Use &ldquo;Add meeting&rdquo; in the assistant</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {transcripts.map((t) => {
              const active = selectedId === t.id;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => onSelect(t.id)}
                    className={`group w-full rounded-xl px-3 py-3 text-left transition-all ${
                      active
                        ? "bg-accent/10 ring-1 ring-accent/25 shadow-glow"
                        : "hover:bg-surface-800/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`line-clamp-2 text-sm font-medium leading-snug ${
                          active ? "text-accent-glow" : "text-ink-100 group-hover:text-white"
                        }`}
                      >
                        {t.title}
                      </p>
                      {t.has_summary && (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/80" />
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-400">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(t.created_at)}
                      </span>
                      <span>{t.word_count.toLocaleString()} words</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

export function TranscriptSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Filter meetings..."
        className="w-full rounded-lg border border-white/[0.06] bg-surface-800/60 py-2 pl-9 pr-3 text-sm text-ink-100 placeholder:text-ink-400 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30"
      />
    </div>
  );
}

export function ListBadge({ count }: { count: number }) {
  return <Badge variant="accent">{count} meetings</Badge>;
}
