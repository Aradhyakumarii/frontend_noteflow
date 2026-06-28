import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, Sparkles } from "lucide-react";
import { api } from "./client_api";
import { ChatPanel } from "./ChatPanel_component";
import { SummaryPanel } from "./SummaryPanel_component";
import { TranscriptList } from "./TranscriptList_component";
import { StatsBar, TabButton } from "./ui_component";
import type { PipelineStats, TranscriptListItem } from "./types_frontend";

type View = "chat" | "summary";

export default function App() {
  const [view, setView] = useState<View>("chat");
  const [transcripts, setTranscripts] = useState<TranscriptListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  const refresh = useCallback(async () => {
    setLoadingList(true);
    try {
      await api.health();
      setApiOnline(true);
      const [listRes, statsRes] = await Promise.all([api.listTranscripts(), api.stats()]);
      setTranscripts(listRes.transcripts);
      setStats(statsRes);
      setSelectedId((prev) => prev ?? listRes.transcripts[0]?.id ?? null);
    } catch {
      setApiOnline(false);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sortedTranscripts = useMemo(
    () => [...transcripts].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")),
    [transcripts],
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-950">
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34,211,238,0.15), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(6,182,212,0.08), transparent)",
        }}
      />

      <StatsBar stats={stats} apiOnline={apiOnline} />

      <div className="relative flex flex-1 overflow-hidden">
        <TranscriptList
          transcripts={sortedTranscripts}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setView("summary");
          }}
          loading={loadingList}
        />

        <main className="flex flex-1 flex-col overflow-hidden">
          <nav className="flex shrink-0 items-center gap-1 border-b border-white/[0.06] bg-surface-900/40 px-4 py-2">
            <TabButton
              active={view === "chat"}
              onClick={() => setView("chat")}
              icon={MessageSquare}
              label="Assistant"
            />
            <TabButton
              active={view === "summary"}
              onClick={() => setView("summary")}
              icon={Sparkles}
              label="Summary"
            />
          </nav>

          {view === "chat" && (
            <ChatPanel
              transcripts={sortedTranscripts}
              selectedTranscriptId={selectedId}
              onUploaded={refresh}
            />
          )}
          {view === "summary" && (
            <SummaryPanel transcriptId={selectedId} onSummaryGenerated={refresh} />
          )}
        </main>
      </div>
    </div>
  );
}
