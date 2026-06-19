import React, { useMemo, useState } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Edit2, Trash2, AlertTriangle, Copy, X, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "../../store/useAppStore";
import { useSessions } from "../../hooks/useSessions";
import {
  addDays, isSaturday, periodsForDate, fmt12, fmtShort, fmtLong, todayISO, tomorrowISO,
} from "../../utils/dates";
import type { SportSession, PeriodSlot, StaffWithRestrictions } from "../../types";
import { Avatar, CHIP_PALETTE, sportChipClass } from "../components/shared";
import AddSessionModal from "../components/AddSessionModal";
import CopyScheduleModal from "../components/CopyScheduleModal";
import AutoGenerateModal from "../components/AutoGenerateModal";

const TODAY    = todayISO();
const TOMORROW = tomorrowISO();

export default function ScheduleView() {
  const {
    selectedDate, sunThuPeriods, friPeriods, sessions, staff, sports, locations, venueRules,
    season, setSelectedDate,
  } = useAppStore();
  const { addSession, deleteSession } = useSessions();

  const [addModal,      setAddModal]      = useState<{ periodId: string; edit: SportSession | null } | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<SportSession | null>(null);
  const [copyModal,     setCopyModal]     = useState(false);
  const [autoGenModal,  setAutoGenModal]  = useState(false);

  const isPast = selectedDate < TODAY;
  const isSat  = isSaturday(selectedDate);
  const periods = useMemo(
    () => periodsForDate(selectedDate, sunThuPeriods, friPeriods),
    [selectedDate, sunThuPeriods, friPeriods],
  );
  const filled = periods.filter(p => sessions.some(s => s.period_slot_id === p.id)).length;

  const workload = useMemo(() => {
    const m: Record<string, number> = {};
    sessions.forEach(s => { m[s.staff_id] = (m[s.staff_id] || 0) + 1; });
    return m;
  }, [sessions]);
  const avgWorkload = useMemo(() => {
    const v = Object.values(workload);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  }, [workload]);

  const navigate = (dir: 1 | -1) => {
    let n = addDays(selectedDate, dir);
    if (isSaturday(n)) n = addDays(n, dir);
    setSelectedDate(n);
  };

  const sportNames    = sports.map(s => s.name);
  const locationNames = locations.map(l => l.name);

  const handleApplyGenerated = async (generated: SportSession[], mode: "replace" | "gaps") => {
    setAutoGenModal(false);
    if (mode === "replace") {
      // Delete all existing sessions for this date first
      const toDelete = sessions.filter(s => s.date === selectedDate);
      await Promise.all(toDelete.map(s => deleteSession(s.id)));
    }
    // Insert all generated sessions
    let count = 0;
    for (const s of generated) {
      try {
        await addSession({
          ...s,
          season_id: season?.id ?? "",
        });
        count++;
      } catch {
        // continue — individual failures shouldn't stop the rest
      }
    }
    toast.success(`${count} session${count !== 1 ? "s" : ""} applied`);
  };

  return (
    <div>
      {/* Date nav */}
      <div className="flex items-center justify-between mb-1">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors"><ChevronLeft size={18} /></button>
        <div className="text-center">
          <div className="font-bold text-lg leading-tight">{fmtLong(selectedDate)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {selectedDate === TODAY ? "Today" : selectedDate === TOMORROW ? "Tomorrow" : isPast ? "Past — read only" : "Upcoming"}
            {!isSat && ` · ${filled}/${periods.length} periods filled`}
          </div>
        </div>
        <button onClick={() => navigate(1)} className="p-2 rounded-xl hover:bg-muted transition-colors"><ChevronRight size={18} /></button>
      </div>

      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex gap-1.5">
          {[{ d: TODAY, l: "Today" }, { d: TOMORROW, l: "Tomorrow" }].map(({ d, l }) => (
            <button key={d} onClick={() => setSelectedDate(d)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${selectedDate === d ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
              {l}
            </button>
          ))}
        </div>
        {!isPast && (
          <div className="flex gap-2">
            <button onClick={() => setCopyModal(true)}
              className="flex items-center gap-1.5 text-sm font-medium bg-white border border-border px-3 py-1.5 rounded-xl hover:bg-secondary hover:border-primary/30 transition-colors shadow-sm">
              <Copy size={13} />Copy
            </button>
            <button onClick={() => setAutoGenModal(true)}
              className="flex items-center gap-1.5 text-sm font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
              <Sparkles size={13} />Auto-generate
            </button>
          </div>
        )}
      </div>

      {/* Workload strip */}
      {!isSat && (
        <div className="sticky top-[104px] z-20 -mx-4 px-4 py-2 bg-background/95 backdrop-blur-sm border-y border-border mb-5">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex-shrink-0 mr-1">Load</span>
            {staff.map(m => {
              const c = workload[m.id] || 0;
              const high = c >= avgWorkload + 2 && c > 0;
              return (
                <span key={m.id} className={`flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${high ? "bg-amber-100 text-amber-800" : c > 0 ? "bg-secondary text-foreground" : "bg-muted/50 text-muted-foreground"}`}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ backgroundColor: m.color }}>{m.initials[0]}</span>
                  <span>{m.name.split(" ")[0]}</span>
                  <span className={`font-mono font-bold tabular-nums ${high ? "text-amber-700" : "text-primary"}`}>{c}</span>
                  {high && <AlertTriangle size={10} className="text-amber-500" />}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Body */}
      {isSat ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-5xl mb-4">🏕️</div>
          <div className="font-semibold text-xl">Saturday — Day Off</div>
        </div>
      ) : (
        <div className="space-y-3">
          {periods.map(p => {
            const periodSessions = sessions.filter(s => s.period_slot_id === p.id);
            const target = p.age_groups.reduce((acc, ag) => acc + (p.age_sessions?.[ag] ?? 1), 0);
            return (
              <PeriodRow key={p.id} period={p} sessions={periodSessions}
                staff={staff} sportNames={sportNames} readOnly={isPast}
                target={target}
                onAdd={() => setAddModal({ periodId: p.id, edit: null })}
                onEdit={s => setAddModal({ periodId: s.period_slot_id, edit: s })}
                onDelete={s => setDeleteTarget(s)}
              />
            );
          })}
        </div>
      )}

      {/* Modals */}
      {addModal && (
        <AddSessionModal
          periodId={addModal.periodId}
          edit={addModal.edit}
          date={selectedDate}
          periods={periods}
          staff={staff}
          sportNames={sportNames}
          locationNames={locationNames}
          venueRules={venueRules}
          sessions={sessions}
          onClose={() => setAddModal(null)}
        />
      )}

      {copyModal && (
        <CopyScheduleModal
          targetDate={selectedDate}
          periodIds={new Set(periods.map(p => p.id))}
          onClose={() => setCopyModal(false)}
        />
      )}

      {autoGenModal && (
        <AutoGenerateModal
          date={selectedDate}
          periods={periods}
          onClose={() => setAutoGenModal(false)}
          onApply={handleApplyGenerated}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-lg mb-1">Remove session?</h3>
            <p className="text-sm text-muted-foreground mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 btn-outline">Cancel</button>
              <button
                onClick={async () => { await deleteSession(deleteTarget.id); setDeleteTarget(null); }}
                className="flex-1 btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PeriodRow({ period, sessions, staff, sportNames, readOnly, target, onAdd, onEdit, onDelete }: {
  period: PeriodSlot;
  sessions: SportSession[];
  staff: StaffWithRestrictions[];
  sportNames: string[];
  readOnly: boolean;
  target: number;
  onAdd: () => void;
  onEdit: (s: SportSession) => void;
  onDelete: (s: SportSession) => void;
}) {
  const filled = sessions.length;
  const isComplete = filled >= target && target > 0;
  const isPartial  = filled > 0 && !isComplete;

  return (
    <div className={`bg-white rounded-2xl border ${sessions.length === 0 && !readOnly ? "border-dashed border-border/70" : "border-border"}`}>
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50">
        <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
          {fmt12(period.start_time)}–{fmt12(period.end_time)}
        </span>
        <div className="flex gap-1 flex-wrap flex-1">
          {period.age_groups.map(ag => (
            <span key={ag} className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-medium">{ag}</span>
          ))}
        </div>
        {/* Fill status badge */}
        {!readOnly && target > 0 && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
            isComplete ? "bg-emerald-100 text-emerald-700" :
            isPartial  ? "bg-amber-100 text-amber-700" :
                         "bg-muted text-muted-foreground"
          }`}>
            {filled}/{target}
          </span>
        )}
        {!readOnly && (
          <button onClick={onAdd} className="flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground px-2.5 py-1.5 rounded-lg hover:bg-primary/90 active:scale-95 transition-all flex-shrink-0">
            <Plus size={11} />Add
          </button>
        )}
      </div>
      {sessions.length > 0 && (
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sessions.map(s => {
            const m = staff.find(x => x.id === s.staff_id);
            return (
              <div key={s.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-white group hover:border-border/80 transition-colors">
                <Avatar initials={m?.initials || "?"} color={m?.color || "#999"} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate leading-tight">{m?.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${sportChipClass(s.sport, sportNames)}`}>{s.sport}</span>
                    <span className="text-xs text-muted-foreground truncate">· {s.location}</span>
                  </div>
                </div>
                {!readOnly && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => onEdit(s)} className="p-1 rounded hover:bg-muted transition-colors" title="Edit"><Edit2 size={11} /></button>
                    <button onClick={() => onDelete(s)} className="p-1 rounded hover:bg-red-50 text-red-500 transition-colors" title="Delete"><Trash2 size={11} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {sessions.length === 0 && !readOnly && (
        <div className="px-4 py-3 text-xs text-muted-foreground/60 italic">No sessions yet — tap Add</div>
      )}
    </div>
  );
}
