import React, { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, BarChart2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAppStore } from "../../store/useAppStore";
import type { SportSession } from "../../types";
import { addDays, weekSunday, DAY_NAMES, todayISO } from "../../utils/dates";
import { Avatar } from "../components/shared";

const TODAY = todayISO();

export default function WeeklyView() {
  const { selectedDate, season, staff, setSelectedDate, setView } = useAppStore() as any;
  const [weekStart, setWeekStart] = useState(() => weekSunday(selectedDate));
  const [weekSessions, setWeekSessions] = useState<SportSession[]>([]);

  const weekDays = useMemo(
    () => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  // Fetch sessions for the visible week from Supabase
  useEffect(() => {
    if (!season) return;
    const firstDay = weekDays[0];
    const lastDay  = weekDays[weekDays.length - 1];
    supabase
      .from("sport_sessions")
      .select("*")
      .eq("season_id", season.id)
      .gte("date", firstDay)
      .lte("date", lastDay)
      .then(({ data }) => setWeekSessions((data ?? []) as SportSession[]));
  }, [season, weekStart]);

  const countByDay = useMemo(() => {
    const m: Record<string, number> = {};
    weekDays.forEach(d => { m[d] = weekSessions.filter(s => s.date === d).length; });
    return m;
  }, [weekDays, weekSessions]);

  const tableData = useMemo(() => {
    const t: Record<string, Record<string, number>> = {};
    staff.forEach((m: any) => {
      t[m.id] = {};
      weekDays.forEach(d => { t[m.id][d] = weekSessions.filter(s => s.date === d && s.staff_id === m.id).length; });
    });
    return t;
  }, [weekDays, weekSessions, staff]);

  const maxCount = Math.max(1, ...weekDays.map(d => countByDay[d] || 0));
  const fills = ["", "bg-primary/10", "bg-primary/25", "bg-primary/45", "bg-primary/70"];

  const monthLabel = useMemo(() => {
    const a = new Date(weekStart + "T00:00:00");
    const b = new Date(addDays(weekStart, 5) + "T00:00:00");
    return a.getMonth() === b.getMonth()
      ? a.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : `${a.toLocaleDateString("en-US", { month: "short" })} – ${b.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
  }, [weekStart]);

  const handleDayClick = (d: string) => {
    setSelectedDate(d);
    setView("schedule");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 rounded-xl hover:bg-muted"><ChevronLeft size={18} /></button>
        <span className="font-bold text-lg">{monthLabel}</span>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 rounded-xl hover:bg-muted"><ChevronRight size={18} /></button>
      </div>

      <div className="grid grid-cols-6 gap-2 mb-8">
        {weekDays.map(day => {
          const n = new Date(day + "T00:00:00");
          const cnt = countByDay[day] || 0;
          const intensity = cnt === 0 ? 0 : Math.min(4, Math.round((cnt / maxCount) * 4));
          const isSel = day === selectedDate;
          const isToday = day === TODAY;
          return (
            <button key={day} onClick={() => handleDayClick(day)}
              className={`relative rounded-2xl border p-2.5 text-center transition-all hover:scale-105 hover:shadow-md ${isSel ? "border-primary shadow-sm ring-2 ring-primary/20" : isToday ? "border-primary/40" : "border-border"} bg-white ${cnt > 0 ? fills[intensity] : ""}`}>
              <div className={`text-xs font-semibold mb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                {DAY_NAMES[n.getDay()]}
              </div>
              <div className={`text-xl font-bold ${isToday ? "text-primary" : intensity > 2 ? "text-primary-foreground" : "text-foreground"}`}>
                {n.getDate()}
              </div>
              <div className={`text-xs font-mono mt-1 ${cnt > 0 ? "text-primary/70" : "text-muted-foreground/30"}`}>
                {cnt > 0 ? cnt : "—"}
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3.5 border-b border-border flex items-center gap-2">
          <BarChart2 size={14} className="text-muted-foreground" />
          <span className="font-semibold text-sm">Weekly Staff Workload</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Staff</th>
                {weekDays.map(d => (
                  <th key={d} className={`text-center px-2 py-3 text-xs font-semibold uppercase tracking-wide ${d === TODAY ? "text-primary" : "text-muted-foreground"}`}>
                    {DAY_NAMES[new Date(d + "T00:00:00").getDay()]}
                  </th>
                ))}
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((m: any, i: number) => {
                const total = weekDays.reduce((s, d) => s + (tableData[m.id]?.[d] || 0), 0);
                return (
                  <tr key={m.id} className={`border-b border-border/50 last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar initials={m.initials} color={m.color} size="sm" />
                        <span className="text-xs font-medium">{m.name.split(" ")[0]}</span>
                      </div>
                    </td>
                    {weekDays.map(d => {
                      const c = tableData[m.id]?.[d] || 0;
                      return (
                        <td key={d} className="text-center px-2 py-3">
                          {c > 0 ? (
                            <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-semibold ${c >= 4 ? "bg-accent text-white" : "bg-muted text-foreground"}`}>{c}</span>
                          ) : (
                            <span className="text-muted-foreground/30 text-xs">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center px-4 py-3">
                      <span className="font-mono text-sm font-bold">{total}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
