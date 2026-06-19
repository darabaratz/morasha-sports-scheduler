import type { PeriodSlot, SportSession, StaffWithRestrictions } from "../types";
import { fmt12, fmtLong } from "./dates";

export function buildWhatsAppText(params: {
  date: string;
  periods: PeriodSlot[];
  sessions: SportSession[];
  staff: StaffWithRestrictions[];
  campName: string;
  seasonName: string;
}): string {
  const { date, periods, sessions, staff, campName, seasonName } = params;
  const lines: string[] = [
    `📋 SPORTS SCHEDULE — ${fmtLong(date)}`,
    "",
  ];

  periods.forEach(p => {
    const ps = sessions.filter(s => s.period_slot_id === p.id);
    if (!ps.length) return;
    lines.push(`${fmt12(p.start_time)} – ${fmt12(p.end_time)}`);
    ps.forEach(s => {
      const m = staff.find(x => x.id === s.staff_id);
      lines.push(`  • ${m?.name ?? "Unknown"} — ${s.sport} @ ${s.location} (${s.age_group})`);
    });
    lines.push("");
  });

  lines.push(`${campName} · ${seasonName}`);
  return lines.join("\n");
}
