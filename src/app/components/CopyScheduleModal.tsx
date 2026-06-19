import React, { useState, useMemo } from "react";
import { X, ChevronRight, AlertTriangle } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useSessions } from "../../hooks/useSessions";
import { addDays, fmtShort } from "../../utils/dates";
import { Alert } from "./shared";

interface Props {
  targetDate: string;
  periodIds: Set<string>;
  onClose: () => void;
}

export default function CopyScheduleModal({ targetDate, periodIds, onClose }: Props) {
  const { season, sessions: todaySessions } = useAppStore();
  const { copyFromDate } = useSessions();
  const [customDate, setCustomDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Build list of unique dates (across all loaded sessions + Supabase) that have sessions
  // We only have locally-loaded sessions for the selected date; for recent days we'd need to query.
  // Simple approach: show days from in-memory sessions + let user pick any date.
  const yesterday = addDays(targetDate, -1);
  const lastWeek  = addDays(targetDate, -7);
  const destHasSessions = todaySessions.some(s => s.date === targetDate);

  const handleCopy = async (src: string) => {
    if (!src) return;
    setLoading(true);
    await copyFromDate(src, periodIds);
    setLoading(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-bold text-base">Copy schedule from…</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Copying to {fmtShort(targetDate)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors"><X size={15} /></button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
          {destHasSessions && (
            <Alert type="soft">
              This day already has sessions. Copied sessions will be <strong>added</strong> on top — existing ones won't be removed.
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleCopy(yesterday)}
              disabled={loading}
              className="flex flex-col items-start p-3.5 bg-secondary rounded-xl border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-colors group disabled:opacity-50"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-primary group-hover:text-primary-foreground opacity-70 mb-0.5">Quick copy</span>
              <span className="font-semibold text-sm">Yesterday</span>
              <span className="text-xs text-muted-foreground group-hover:text-primary-foreground/70">{fmtShort(yesterday)}</span>
            </button>
            <button
              onClick={() => handleCopy(lastWeek)}
              disabled={loading}
              className="flex flex-col items-start p-3.5 bg-secondary rounded-xl border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-colors group disabled:opacity-50"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-primary group-hover:text-primary-foreground opacity-70 mb-0.5">Quick copy</span>
              <span className="font-semibold text-sm">Last week</span>
              <span className="text-xs text-muted-foreground group-hover:text-primary-foreground/70">{fmtShort(lastWeek)}</span>
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pick a specific date</p>
            <div className="flex gap-2">
              <input
                type="date"
                value={customDate}
                max={addDays(targetDate, -1)}
                onChange={e => setCustomDate(e.target.value)}
                className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                onClick={() => handleCopy(customDate)}
                disabled={!customDate || loading}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border">
          <button onClick={onClose} className="w-full btn-outline">Cancel</button>
        </div>
      </div>
    </div>
  );
}
