import React from "react";
import { ChevronLeft, ChevronRight, Printer, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "../../store/useAppStore";
import { periodsForDate, fmtShort, fmtLong, fmt12, addDays, isSaturday } from "../../utils/dates";
import { buildWhatsAppText } from "../../utils/export";
import { Avatar } from "../components/shared";

export default function ExportView() {
  const {
    selectedDate, sunThuPeriods, friPeriods, sessions, staff, season,
    setSelectedDate,
  } = useAppStore();

  const periods = periodsForDate(selectedDate, sunThuPeriods, friPeriods);
  const campName   = season?.camp_name   ?? "Camp Sports";
  const seasonName = season?.season_name ?? "";

  const navigate = (dir: 1 | -1) => {
    let n = addDays(selectedDate, dir);
    if (isSaturday(n)) n = addDays(n, dir);
    setSelectedDate(n);
  };

  const filled = periods.filter(p => sessions.some(s => s.period_slot_id === p.id));

  const copyText = () => {
    const text = buildWhatsAppText({ date: selectedDate, periods, sessions, staff, campName, seasonName });
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Copy failed"));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted"><ChevronLeft size={18} /></button>
          <span className="font-semibold text-sm">{fmtShort(selectedDate)}</span>
          <button onClick={() => navigate(1)} className="p-2 rounded-xl hover:bg-muted"><ChevronRight size={18} /></button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => {
              const prev = document.title;
              document.title = `Girls Campus Sports Schedule - ${fmtLong(selectedDate)}`;
              window.print();
              document.title = prev;
            }}
            className="flex items-center gap-1.5 text-sm bg-white border border-border px-3 py-2 rounded-xl hover:bg-muted transition-colors font-medium">
            <Printer size={14} />Print
          </button>
          <button onClick={copyText}
            className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-2 rounded-xl hover:bg-primary/90 font-semibold">
            <Copy size={14} />Copy for WhatsApp
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="bg-primary px-6 py-5 flex items-start justify-between">
          <div>
            <p className="text-primary-foreground/70 text-xs font-semibold uppercase tracking-wider mb-1">Sports Schedule</p>
            <h1 className="text-primary-foreground text-2xl font-bold"
              style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.01em" }}>
              {fmtLong(selectedDate)}
            </h1>
          </div>
          <div className="text-right">
            <div className="text-primary-foreground/70 text-xs">{campName}</div>
            <div className="text-primary-foreground/70 text-xs mt-0.5">{seasonName}</div>
          </div>
        </div>

        <div className="p-6">
          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 italic">No sessions scheduled.</p>
          ) : (
            <div className="space-y-5">
              {filled.map(p => {
                const ps = sessions.filter(s => s.period_slot_id === p.id);
                return (
                  <div key={p.id}>
                    <div className="flex items-center gap-3 mb-2.5">
                      <span className="text-xs font-mono font-semibold text-primary bg-secondary px-2 py-0.5 rounded">
                        {fmt12(p.start_time)} – {fmt12(p.end_time)}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="space-y-2 pl-1">
                      {ps.map(s => {
                        const m = staff.find(x => x.id === s.staff_id);
                        return (
                          <div key={s.id} className="flex items-center gap-3">
                            <Avatar initials={m?.initials || "?"} color={m?.color || "#999"} size="sm" />
                            <span className="font-semibold text-sm w-28 truncate">{m?.name}</span>
                            <span className="text-sm text-muted-foreground">— {s.sport} @ {s.location}</span>
                            <span className="text-xs text-muted-foreground ml-auto">({s.age_group})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>{sessions.length} session{sessions.length !== 1 ? "s" : ""} · {filled.length} periods</span>
            <span>Generated {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
