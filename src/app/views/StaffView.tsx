import React, { useState } from "react";
import { Edit2, X } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useStaff } from "../../hooks/useStaff";
import type { StaffWithRestrictions } from "../../types";
import { Avatar, Badge, AVATAR_PALETTE, makeInitials } from "../components/shared";
import { toast } from "sonner";
import { fmtShort } from "../../utils/dates";

export default function StaffView() {
  const { staff, sports, ageGroups } = useAppStore();
  const { saveRestrictions } = useStaff();
  const [restrictModal, setRestrictModal] = useState<StaffWithRestrictions | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-xl">Staff Roster</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{staff.length} members · restrictions &amp; availability</p>
        </div>
        <p className="text-xs text-muted-foreground text-right hidden sm:block">
          To add/remove staff,<br />use Season Setup (Admin)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {staff.map(m => {
          const hasRest = m.restrictions.ageGroups !== "all" || m.restrictions.sports !== "all" || m.restrictions.unavailableDates.length > 0;
          return (
            <div key={m.id} className="bg-white rounded-2xl border border-border p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <Avatar initials={m.initials} color={m.color} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{m.name}</span>
                    <button onClick={() => setRestrictModal(m)}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium flex-shrink-0 transition-colors">
                      <Edit2 size={11} />Edit
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.restrictions.ageGroups !== "all" && <Badge color="purple">Age restricted</Badge>}
                    {m.restrictions.sports !== "all" && <Badge color="orange">Sport restricted</Badge>}
                    {m.restrictions.unavailableDates.length > 0 && (
                      <Badge color="red">{m.restrictions.unavailableDates.length} day{m.restrictions.unavailableDates.length > 1 ? "s" : ""} off</Badge>
                    )}
                    {!hasRest && <Badge color="green">No restrictions</Badge>}
                  </div>
                  {m.restrictions.notes && (
                    <p className="text-xs text-muted-foreground mt-1.5 italic">"{m.restrictions.notes}"</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {restrictModal && (
        <StaffRestrictionModal
          member={restrictModal}
          sports={sports.map(s => s.name)}
          ageGroups={ageGroups}
          onSave={async (updated) => {
            await saveRestrictions(updated);
            setRestrictModal(null);
          }}
          onClose={() => setRestrictModal(null)}
        />
      )}
    </div>
  );
}

function StaffRestrictionModal({ member, sports, ageGroups, onSave, onClose }: {
  member: StaffWithRestrictions;
  sports: string[];
  ageGroups: string[];
  onSave: (m: StaffWithRestrictions) => Promise<void>;
  onClose: () => void;
}) {
  const [ageGroupsR, setAgeGroupsR] = useState<string[] | "all">(member.restrictions.ageGroups);
  const [sportsR,    setSportsR]    = useState<string[] | "all">(member.restrictions.sports);
  const [unavail,    setUnavail]    = useState<string[]>(member.restrictions.unavailableDates);
  const [notes,      setNotes]      = useState(member.restrictions.notes);
  const [newDate,    setNewDate]    = useState("");
  const [saving,     setSaving]     = useState(false);

  const toggleAg = (ag: string) => {
    if (ageGroupsR === "all") { setAgeGroupsR(ageGroups.filter(g => g !== ag)); return; }
    const next = (ageGroupsR as string[]).includes(ag)
      ? (ageGroupsR as string[]).filter(g => g !== ag)
      : [...(ageGroupsR as string[]), ag];
    setAgeGroupsR(next.length === ageGroups.length ? "all" : next);
  };

  const toggleSp = (s: string) => {
    if (sportsR === "all") { setSportsR(sports.filter(x => x !== s)); return; }
    const next = (sportsR as string[]).includes(s)
      ? (sportsR as string[]).filter(x => x !== s)
      : [...(sportsR as string[]), s];
    setSportsR(next.length === sports.length ? "all" : next);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...member, restrictions: { ageGroups: ageGroupsR, sports: sportsR, unavailableDates: unavail, notes } });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <Avatar initials={member.initials} color={member.color} />
          <div className="flex-1">
            <h3 className="font-bold">{member.name}</h3>
            <p className="text-xs text-muted-foreground">Restrictions &amp; availability</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors"><X size={15} /></button>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto max-h-[62vh]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wide">Allowed Age Groups</label>
              {ageGroupsR !== "all" && <button onClick={() => setAgeGroupsR("all")} className="text-xs text-primary hover:underline">Reset to all</button>}
            </div>
            <div className="flex flex-wrap gap-2">
              {ageGroups.map(ag => {
                const on = ageGroupsR === "all" || (ageGroupsR as string[]).includes(ag);
                return (
                  <button key={ag} onClick={() => toggleAg(ag)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${on ? "bg-primary text-primary-foreground border-primary" : "bg-white text-muted-foreground border-border hover:border-primary/40"}`}>
                    {ag}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wide">Allowed Sports</label>
              {sportsR !== "all" && <button onClick={() => setSportsR("all")} className="text-xs text-primary hover:underline">Reset to all</button>}
            </div>
            <div className="flex flex-wrap gap-2">
              {sports.map(s => {
                const on = sportsR === "all" || (sportsR as string[]).includes(s);
                return (
                  <button key={s} onClick={() => toggleSp(s)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${on ? "bg-primary text-primary-foreground border-primary" : "bg-white text-muted-foreground border-border hover:border-primary/40"}`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-2">Days Off</label>
            <div className="flex gap-2 mb-3">
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              <button
                onClick={() => { if (newDate && !unavail.includes(newDate)) { setUnavail([...unavail, newDate]); setNewDate(""); } }}
                disabled={!newDate}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40">
                Add
              </button>
            </div>
            {unavail.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {[...unavail].sort().map(d => (
                  <span key={d} className="flex items-center gap-1.5 text-xs bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full font-medium">
                    {fmtShort(d)}
                    <button onClick={() => setUnavail(unavail.filter(x => x !== d))} className="hover:text-red-900"><X size={10} /></button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No days off recorded</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-2">Note (shown during assignment)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Cannot supervise Hockey unsupervised" rows={2}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 btn-outline">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-xl py-2.5 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60">
            {saving ? "Saving…" : "Save Restrictions"}
          </button>
        </div>
      </div>
    </div>
  );
}
