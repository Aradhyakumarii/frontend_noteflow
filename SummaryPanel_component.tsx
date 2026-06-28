import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "./client_api";
import type { MeetingSummary, Transcript } from "./types_frontend";
import { Badge, EmptyState } from "./ui_component";

interface SummaryPanelProps {
  transcriptId: string | null;
  onSummaryGenerated?: () => void;
}

function Section({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: string[];
  icon: React.ComponentType<{ className?: string }>;
}) {
  if (!items.length) return null;
  return (
    <div className="glass rounded-xl p-4 shadow-panel">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent/70" />
        <h4 className="text-sm font-semibold text-ink-100">{title}</h4>
        <Badge variant="default">{items.length}</Badge>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-ink-300">
            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent/50" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SummaryPanel({ transcriptId, onSummaryGenerated }: SummaryPanelProps) {
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transcriptId) {
      setTranscript(null);
      setSummary(null);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      api.getTranscript(transcriptId),
      api.getSummary(transcriptId).catch(() => null),
    ])
      .then(([t, s]) => {
        setTranscript(t);
        setSummary(s);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [transcriptId]);

  const generateSummary = async () => {
    if (!transcriptId) return;
    setGenerating(true);
    setError(null);
    try {
      const s = await api.summarize(transcriptId);
      setSummary(s);
      onSummaryGenerated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Summary generation failed");
    } finally {
      setGenerating(false);
    }
  };

  if (!transcriptId) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Select a meeting"
        description="Choose a transcript from the sidebar to view its content and generate a GPT-4 summary."
      />
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent/60" />
      </div>
    );
  }

  if (error && !transcript) {
    return (
      <div className="flex flex-1 items-center justify-center px-8">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div>
          <h2 className="font-display text-base font-semibold">{transcript?.title}</h2>
          <p className="text-xs text-ink-400">{transcript?.id}</p>
        </div>
        <button
          onClick={generateSummary}
          disabled={generating}
          className="flex items-center gap-2 rounded-xl bg-accent/10 px-4 py-2 text-sm font-medium text-accent ring-1 ring-accent/25 transition-all hover:bg-accent/20 disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {summary ? "Regenerate summary" : "Generate summary"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
          {summary ? (
            <>
              <div className="glass rounded-2xl p-5 shadow-panel ring-1 ring-accent/10">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-ink-100">Executive Summary</h3>
                </div>
                <p className="text-sm leading-relaxed text-ink-300">{summary.executive_summary}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Section title="Key Decisions" items={summary.key_decisions} icon={CheckCircle2} />
                <Section title="Action Items" items={summary.action_items} icon={Clock} />
                <Section title="Participants" items={summary.participants} icon={Users} />
                <Section title="Follow-ups" items={summary.follow_ups} icon={ArrowRight} />
              </div>

              {summary.topics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {summary.topics.map((topic) => (
                    <Badge key={topic} variant="accent">
                      {topic}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="glass rounded-2xl p-8 text-center shadow-panel">
              <Sparkles className="mx-auto mb-4 h-10 w-10 text-accent/50" />
              <h3 className="font-display text-lg font-semibold">No summary yet</h3>
              <p className="mt-2 text-sm text-ink-400">
                Generate a structured GPT-4 summary with decisions, action items, and follow-ups.
              </p>
              <button
                onClick={generateSummary}
                disabled={generating}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-surface-950 hover:bg-accent-glow disabled:opacity-50"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate with GPT-4
              </button>
            </div>
          )}

          {transcript && (
            <div className="glass rounded-2xl p-5 shadow-panel">
              <h3 className="mb-3 text-sm font-semibold text-ink-100">Full Transcript</h3>
              <div className="max-h-96 overflow-y-auto rounded-lg bg-surface-950/50 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-400">
                  {transcript.full_text}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
