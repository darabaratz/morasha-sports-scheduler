import React, { useState } from "react";
import { X } from "lucide-react";
import { useSessions } from "../../hooks/useSessions";
import { useAppStore } from "../../store/useAppStore";
import type { SportSession, PeriodSlot, StaffWithRestrictions, VenueRulesMap } from "../../types";
import { fmt12 } from "../../utils/dates";
import { getValidLocations, checkHardBlocks, checkSoftWarnings } from "../../utils/validation";
import { Field, Alert } from "./shared";

interface Props {
  periodId: string;
  edit: SportSession | null;
  date: string;
  periods: PeriodSlot[];
  staff: StaffWithRestrictions[];
  sportNames: string[];
  locationNames: string[];
  venueRules: VenueRulesMap;
  sessions: SportSession[];
  onClose: () => void;
}

export default function AddSessionModal({
  periodId, edit, date, periods, staff, sportNames, locationNames, venueRules, sessions, onClose,
}: Props) {
  const { addSession, updateSession } = useSessions();
  const period = periods.find(p => p.id === periodId);
  const isEdit = !!edit;

  const [staffId,  setStaffId]  = useState(edit?.staff_id  || "");
  const [sport,    setSport]    = useState(edit?.sport     || "");
  const [location, setLocation] = useState(edit?.location  || "");

  const periodAgeGroups = period?.age_groups ?? [];
  const multiAge = periodAgeGroups.length > 1;
  const [ageGroup, setAgeGroup] = useState(
    edit?.age_group || (periodAgeGroups.length === 1 ? periodAgeGroups[0] : ""),
  );

  const periodSessions = sessions.filter(s => s.date === date && s.period_slot_id === periodId);
  const selectedMember = staff.find(m => m.id === staffId);
  const validLocations = sport ? getValidLocations(sport, locationNames, venueRules) : locationNames;

  const handleSportChange = (v: string) => {
    setSport(v);
    if (v && location && !getValidLocations(v, locationNames, venueRules).includes(location)) {
      setLocation("");
    }
  };

  const hardBlock = checkHardBlocks({
    staffId, sport, location, date, periodSlotId: periodId,
    editingId: edit?.id,
    periodSessions,
    staff,
  });

  const softWarnings = staffId && sport
    ? checkSoftWarnings({ staffId, sport, ageGroup: multiAge ? ageGroup : (periodAgeGroups[0] ?? ""), staff })
    : [];

  const canSave = !!(staffId && sport && location && (!multiAge || ageGroup) && !hardBlock);

  const handleSave = async () => {
    if (!canSave) return;
    const payload = {
      date,
      period_slot_id: periodId,
      staff_id: staffId,
      sport,
      location,
      age_group: multiAge ? ageGroup : (periodAgeGroups[0] ?? ""),
    };
    if (isEdit && edit) {
      await updateSession(edit.id, payload);
    } else {
      await addSession(payload);
    }
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
            <h3 className="font-bold text-base">{isEdit ? "Edit Session" : "Add Session"}</h3>
            {period && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {period.label} · {fmt12(period.start_time)}–{fmt12(period.end_time)}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors"><X size={15} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
          <Field label="Staff Member">
            <select value={staffId} onChange={e => setStaffId(e.target.value)} className="select-field">
              <option value="">Select staff member…</option>
              {staff.map(m => {
                const unav   = m.restrictions.unavailableDates.includes(date);
                const booked = periodSessions.some(s => s.staff_id === m.id && s.id !== edit?.id);
                const rest   = m.restrictions.ageGroups !== "all" || m.restrictions.sports !== "all";
                return (
                  <option key={m.id} value={m.id} disabled={unav || booked}>
                    {m.name}{unav ? " — Day off" : booked ? " — Already booked" : rest ? " ⚠" : ""}
                  </option>
                );
              })}
            </select>
          </Field>

          <Field label="Sport">
            <select value={sport} onChange={e => handleSportChange(e.target.value)} className="select-field">
              <option value="">Select sport…</option>
              {sportNames.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Location">
            {!sport ? (
              <div className="px-3 py-2.5 border border-dashed border-border rounded-xl text-sm text-muted-foreground/60 italic">
                Select a sport first
              </div>
            ) : (
              <select value={location} onChange={e => setLocation(e.target.value)} className="select-field">
                <option value="">Select location…</option>
                {validLocations.map(l => {
                  const taken = periodSessions.some(s => s.location === l && s.sport !== sport && s.id !== edit?.id);
                  return (
                    <option key={l} value={l} disabled={taken}>
                      {l}{taken ? " — In use this period" : ""}
                    </option>
                  );
                })}
              </select>
            )}
          </Field>

          <Field label="Age Group">
            {multiAge ? (
              <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className="select-field">
                <option value="">Select age group…</option>
                {periodAgeGroups.map(ag => <option key={ag} value={ag}>{ag}</option>)}
              </select>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 border border-border/50 rounded-xl bg-muted/30">
                <span className="text-xs font-semibold bg-secondary text-secondary-foreground px-2.5 py-1 rounded-lg">
                  {periodAgeGroups[0]}
                </span>
                <span className="text-xs text-muted-foreground ml-auto italic">Set by period</span>
              </div>
            )}
          </Field>

          {hardBlock && <Alert type="hard">{hardBlock.reason}</Alert>}
          {softWarnings.map((w, i) => <Alert key={i} type="soft">{w.reason} You can override.</Alert>)}
          {selectedMember?.restrictions.notes && (
            <Alert type="info">{selectedMember.restrictions.notes}</Alert>
          )}
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
            {!canSave
              ? (hardBlock ? "Blocked — see above" : "Select staff, sport & location")
              : softWarnings.length
                ? "⚠ Save anyway"
                : isEdit ? "Save Changes" : "Add Session"}
          </button>
        </div>
      </div>
    </div>
  );
}
