import React, { useMemo, useState } from "react";
import { X, Sparkles, AlertTriangle, CheckCircle } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { autoGenerateSchedule } from "../../utils/autoGenerate";
import { fmtLong, fmt12 } from "../../utils/dates";
import type { PeriodSlot, SportSession, StaffWithRestrictions } from "../../types";
import { Avatar, Alert } from "./shared";

interface Props {
  date: string;
  periods: PeriodSlot[];
  onClose: () => void;
  onApply: (sessions: SportSession[], mode: "replace" | "gaps") => void;
}

export default function AutoGenerateModal({ date, periods, onClose, onApply }: Props) {
  const { staff, sports, locations, venueRules, ageGroupSports, sessions: existingSessions } = useAppStore();
  const sportNames   = sports.map(s => s.name);
  const locationNames = locations.map(l => l.name);

  const hasExisting = existingSessions.some(s => s.date === date);
  const [mode, setMode] = useState<"replace" | "gaps">(hasExisting ? "gaps" : "replace");
  const [previewTab, setPreviewTab] = useState<"schedule" | "workload">("schedule");

  const preview = useMemo(() => autoGenerateSchedule({
    date, periods, staff, sportNames, locationNames, venueRules, ageGroupSports, existingSessions, mode,
  }), [date, mode]);

  const workloadPreview = useMemo(() => {
    const base: Record<string, number> = {};
    if (mode === "gaps") existingSessions.filter(s => s.date === date).forEach(s => { base[s.staff_id] = (base[s.staff_id] || 0) + 1; });
    preview.sessions.forEach(s => { base[s.staff_id] = (base[s.staff_id] || 0) + 1; });
    return base;
  }, [preview, mode]);

  const avgLoad = useMemo(() => {
    const vals = Object.values(workloadPreview);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [workloadPreview]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <h3 className="font-bold text-base">Auto-generate Schedule</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{fmtLong(date)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors"><X size={15} /></button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-5 space-y-4">

            {hasExisting && (
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: "gaps",    label: "Fill empty periods", sub: "Keep existing, add to gaps" },
                  { id: "replace", label: "Replace all",        sub: "Clear and regenerate" },
                ] as const).map(opt => (
                  <button key={opt.id} onClick={() => setMode(opt.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${mode === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{opt.sub}</div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 px-4 py-3 bg-secondary/60 rounded-xl">
              {[
                { value: preview.sessions.length, label: "sessions" },
                { value: periods.length - preview.skipped.length, label: "periods filled" },
                { value: [...new Set(preview.sessions.map(s => s.sport))].length, label: "sports used" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center flex-1">
                  <div className="text-xl font-bold text-primary">{value}</div>
                  <div className="text-[11px] text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>

            {preview.skipped.length > 0 && (
              <Alert type="soft" icon={AlertTriangle}>
                Could not fill {preview.skipped.length} slot{preview.skipped.length > 1 ? "s" : ""} — not enough eligible staff or locations. Fill these manually after applying.
              </Alert>
            )}

            <div>
              <div className="flex gap-1 p-1 bg-muted rounded-xl mb-4">
                {([{ id: "schedule", l: "Schedule Preview" }, { id: "workload", l: "Workload" }] as const).map(t => (
                  <button key={t.id} onClick={() => setPreviewTab(t.id)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${previewTab === t.id ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    {t.l}
                  </button>
                ))}
              </div>

              {previewTab === "schedule" && (
                <div className="space-y-3">
                  {periods.map(period => {
                    const pSessions = preview.sessions.filter(s => s.period_slot_id === period.id);
                    const empty = pSessions.length === 0;
                    return (
                      <div key={period.id} className={`rounded-xl border overflow-hidden ${empty ? "border-dashed border-border/60 opacity-60" : "border-border"}`}>
                        <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 border-b border-border/50">
                          <span className="text-xs font-mono text-muted-foreground">{fmt12(period.start_time)}–{fmt12(period.end_time)}</span>
                          <div className="flex gap-1 flex-wrap flex-1">
                            {period.age_groups.map(ag => (
                              <span key={ag} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-medium">{ag}</span>
                            ))}
                          </div>
                          {empty && <span className="text-[10px] text-muted-foreground italic">unfilled</span>}
                        </div>
                        {pSessions.length > 0 && (
                          <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {pSessions.map(s => {
                              const m = staff.find(x => x.id === s.staff_id);
                              return (
                                <div key={s.id} className="flex items-center gap-2 px-2.5 py-2 bg-white rounded-lg border border-border">
                                  <Avatar initials={m?.initials || "?"} color={m?.color || "#999"} size="sm" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold truncate">{m?.name}</div>
                                    <div className="text-[10px] text-muted-foreground truncate">{s.sport} · {s.location}</div>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{s.age_group}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {previewTab === "workload" && (
                <div className="space-y-2">
                  {staff.map((m: StaffWithRestrictions) => {
                    const c = workloadPreview[m.id] || 0;
                    const high = c >= avgLoad + 2 && c > 0;
                    const max = Math.max(1, ...Object.values(workloadPreview));
                    return (
                      <div key={m.id} className="flex items-center gap-3">
                        <Avatar initials={m.initials} color={m.color} size="sm" />
                        <span className="text-xs font-medium w-20 truncate">{m.name.split(" ")[0]}</span>
                        <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${high ? "bg-accent" : c > 0 ? "bg-primary" : ""}`}
                            style={{ width: `${Math.min(100, (c / max) * 100)}%` }} />
                        </div>
                        <span className={`text-xs font-mono font-bold w-5 text-right tabular-nums ${high ? "text-accent" : "text-muted-foreground"}`}>{c}</span>
                        {high && <AlertTriangle size={12} className="text-accent flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">How this was generated</p>
              <ul className="space-y-1.5">
                {[
                  "No staff member assigned twice in the same period",
                  "Sports only scheduled at their required venues",
                  "Age group sport rules applied where configured in Setup",
                  "Staff sport & age group restrictions respected — soft overrides used only as a last resort",
                  "Least-loaded staff member always picked first to balance workload",
                  "Least-used sports prioritised each period to maximise variety",
                ].map(rule => (
                  <li key={rule} className="flex items-start gap-2 text-xs text-muted-foreground leading-snug">
                    <CheckCircle size={12} className="text-primary mt-0.5 flex-shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-border flex-shrink-0">
          <button onClick={onClose} className="flex-1 btn-outline">Cancel</button>
          <button
            onClick={() => onApply(preview.sessions, mode)}
            disabled={preview.sessions.length === 0}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-40">
            <Sparkles size={14} />Apply {preview.sessions.length} sessions
          </button>
        </div>
      </div>
    </div>
  );
}
