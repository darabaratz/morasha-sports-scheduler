import React, { useState } from "react";
import { X } from "lucide-react";
import { useSessions } from "../../hooks/useSessions";
import type { SportSession, StaffWithRestrictions } from "../../types";
import { checkHardBlocks, checkSoftWarnings } from "../../utils/validation";
import { Field, Alert } from "./shared";

interface Props {
  group: { sport: string; location: string; age_group: string; periodId: string; date: string; existingIds: string[] };
  periodSessions: SportSession[];
  staff: StaffWithRestrictions[];
  onClose: () => void;
}

export default function AddCoStaffModal({ group, periodSessions, staff, onClose }: Props) {
  const { addSession } = useSessions();
  const [staffId, setStaffId] = useState("");

  const hardBlock = staffId ? checkHardBlocks({
    staffId,
    location: group.location,
    date: group.date,
    periodSlotId: group.periodId,
    periodSessions,
    staff,
    skipLocationCheck: true,
  }) : null;

  const softWarnings = staffId
    ? checkSoftWarnings({ staffId, sport: group.sport, ageGroup: group.age_group, staff })
    : [];

  const canSave = !!(staffId && !hardBlock);

  const handleSave = async () => {
    if (!canSave) return;
    await addSession({
      date: group.date,
      period_slot_id: group.periodId,
      staff_id: staffId,
      sport: group.sport,
      location: group.location,
      age_group: group.age_group,
    });
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
            <h3 className="font-bold text-base">Add Co-Staff</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {group.sport} · {group.location} · {group.age_group}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors"><X size={15} /></button>
        </div>

        <div className="p-5 space-y-4">
          <Field label="Staff Member">
            <select value={staffId} onChange={e => setStaffId(e.target.value)} className="select-field">
              <option value="">Select staff member…</option>
              {staff.map(m => {
                const unav = m.restrictions.unavailableDates.includes(group.date);
                const booked = periodSessions.some(s => s.staff_id === m.id);
                const rest = m.restrictions.ageGroups !== "all" || m.restrictions.sports !== "all";
                return (
                  <option key={m.id} value={m.id} disabled={unav || booked}>
                    {m.name}{unav ? " — Day off" : booked ? " — Already booked" : rest ? " ⚠" : ""}
                  </option>
                );
              })}
            </select>
          </Field>

          {hardBlock && <Alert type="hard">{hardBlock.reason}</Alert>}
          {softWarnings.map((w, i) => <Alert key={i} type="soft">{w.reason} You can override.</Alert>)}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 btn-outline">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              !canSave
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : softWarnings.length
                  ? "bg-amber-500 text-white hover:bg-amber-400 active:scale-95 cursor-pointer shadow-md shadow-amber-200 ring-2 ring-amber-300"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 cursor-pointer"
            }`}
          >
            {!canSave ? "Select a staff member" : softWarnings.length ? "⚠ Add anyway" : "Add Staff"}
          </button>
        </div>
      </div>
    </div>
  );
}
