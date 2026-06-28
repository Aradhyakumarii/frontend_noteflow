import {
  Activity,
  Bot,
  CheckCircle2,
  Database,
  FileText,
  Layers,
  MessageSquare,
  Mic,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import type { PipelineStats } from "./types_frontend";

interface StatsBarProps {
  stats: PipelineStats | null;
  apiOnline: boolean;
}

const statItems = [
  { key: "stored_transcripts" as const, label: "Transcripts", icon: FileText },
  { key: "vector_count" as const, label: "Vectors", icon: Database },
  { key: "gpt_model" as const, label: "LLM", icon: Sparkles },
  { key: "whisper_model" as const, label: "Whisper", icon: Mic },
];

export function StatsBar({ stats, apiOnline }: StatsBarProps) {
  return (
    <header className="glass flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-cyan-500/10 shadow-glow">
          <Layers className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="font-display text-lg font-semibold tracking-tight">
            NoteFlow<span className="text-gradient">_edge_pro</span>
          </h1>
          <p className="text-xs text-ink-400">Meeting intelligence platform</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
            apiOnline
              ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
              : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          {apiOnline ? "API Online" : "API Offline"}
        </div>

        {stats && (
          <div className="hidden items-center gap-2 lg:flex">
            {statItems.map(({ key, label, icon: Icon }) => (
              <div
                key={key}
                className="flex items-center gap-2 rounded-lg bg-surface-800/60 px-3 py-1.5 text-xs text-ink-300"
              >
                <Icon className="h-3.5 w-3.5 text-accent/70" />
                <span className="text-ink-400">{label}</span>
                <span className="font-medium text-ink-100">
                  {typeof stats[key] === "number" ? stats[key] : stats[key]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

export function EmptyState({
  icon: Icon = MessageSquare,
  title,
  description,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center animate-fade-in">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-800 ring-1 ring-white/[0.06]">
        <Icon className="h-7 w-7 text-accent/60" />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink-100">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-400">{description}</p>
    </div>
  );
}

export function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-accent/70 animate-pulse-dot"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "accent";
}) {
  const styles = {
    default: "bg-surface-700 text-ink-300",
    success: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
    accent: "bg-accent/10 text-accent ring-1 ring-accent/20",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}

export function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
        active
          ? "bg-accent/10 text-accent shadow-glow ring-1 ring-accent/20"
          : "text-ink-400 hover:bg-surface-800 hover:text-ink-200"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export { Bot, CheckCircle2, Upload, Zap };
