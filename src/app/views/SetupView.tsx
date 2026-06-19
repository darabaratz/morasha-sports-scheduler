import React, { useState } from "react";
import {
  Shield, Users, Calendar, Dumbbell, MapPin, Plus, X, Edit2, Trash2,
  ChevronUp, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "../../store/useAppStore";
import { useStaff } from "../../hooks/useStaff";
import { useSetup } from "../../hooks/useSetup";
import type { PeriodSlot, StaffWithRestrictions } from "../../types";
import {
  Avatar, Overlay, AVATAR_PALETTE, makeInitials, sportChipClass, Badge,
} from "../components/shared";
import { fmt12 } from "../../utils/dates";

type SetupTab = "roster" | "periods" | "sports" | "locations";

export default function SetupView() {
  const { season, role, isReadOnly } = useAppStore();
  const setup = useSetup();
  const [tab, setTab] = useState<SetupTab>("roster");
  const [campNameLocal,   setCampNameLocal]   = useState(season?.camp_name   ?? "");
  const [seasonNameLocal, setSeasonNameLocal] = useState(season?.season_name ?? "");
  const [metaSaved, setMetaSaved] = useState(false);

  const TABS: { id: SetupTab; label: string; icon: any }[] = [
    { id: "roster",    label: "Staff Roster", icon: Users },
    { id: "periods",   label: "Periods",      icon: Calendar },
    { id: "sports",    label: "Sports",       icon: Dumbbell },
    { id: "locations", label: "Locations",    icon: MapPin },
  ];

  const handleMetaSave = async () => {
    await setup.updateSeasonMeta(campNameLocal, seasonNameLocal);
    setMetaSaved(true);
    setTimeout(() => setMetaSaved(false), 2000);
  };

  return (
    <div>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-0.5">
          <Shield size={16} className="text-accent" />
          <h2 className="font-bold text-xl">Season Setup</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {isReadOnly ? "Viewing a past season — read-only." : "Configure the season. Changes feed into the daily schedule immediately."}
        </p>
      </div>

      {!season && !isReadOnly && (
        <div className="bg-secondary/60 rounded-2xl border border-border p-6 text-center mb-5">
          <p className="text-sm font-semibold mb-1">No active season</p>
          <p className="text-xs text-muted-foreground">Use the "New Season" option in the season switcher (header) to create one.</p>
        </div>
      )}

      {/* Camp name + season */}
      <div className="bg-white rounded-2xl border border-border p-4 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Camp / Programme Name</label>
          <input value={campNameLocal} onChange={e => setCampNameLocal(e.target.value)}
            placeholder="e.g. Camp Sports"
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: "1rem", fontWeight: 600 }} />
          <p className="text-xs text-muted-foreground mt-1.5">Shown in the header.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Season</label>
          <input value={seasonNameLocal} onChange={e => setSeasonNameLocal(e.target.value)}
            placeholder="e.g. Summer 2026"
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          <p className="text-xs text-muted-foreground mt-1.5">Shown in the header badge and exports.</p>
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button onClick={handleMetaSave}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
            {metaSaved ? "✓ Saved" : "Save"}
          </button>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${tab === t.id ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>

      {tab === "roster"    && <RosterTab    readOnly={isReadOnly} />}
      {tab === "periods"   && <PeriodsTab   readOnly={isReadOnly} />}
      {tab === "sports"    && <SportsTab    readOnly={isReadOnly} />}
      {tab === "locations" && <LocationsTab readOnly={isReadOnly} />}
    </div>
  );
}

// ── Roster Tab ────────────────────────────────────────────────────────────────

function RosterTab({ readOnly }: { readOnly: boolean }) {
  const { staff } = useAppStore();
  const { saveStaffMember, removeStaffMember } = useStaff();
  const [editTarget,     setEditTarget]     = useState<StaffWithRestrictions | null>(null);
  const [addingNew,      setAddingNew]      = useState(false);
  const [removeConfirm,  setRemoveConfirm]  = useState<StaffWithRestrictions | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{staff.length} staff members on roster</p>
        {!readOnly && (
          <button onClick={() => setAddingNew(true)}
            className="flex items-center gap-1.5 text-sm font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors">
            <Plus size={14} />Add Staff Member
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {staff.map(m => (
          <div key={m.id} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3">
            <Avatar initials={m.initials} color={m.color} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{m.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{m.initials}</div>
            </div>
            {!readOnly && (
              <div className="flex gap-1.5">
                <button onClick={() => setEditTarget(m)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Edit2 size={13} /></button>
                <button onClick={() => setRemoveConfirm(m)} className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
              </div>
            )}
          </div>
        ))}
      </div>

      {(addingNew || editTarget) && (
        <StaffSetupModal
          member={editTarget}
          existingColors={staff.map(m => m.color)}
          onSave={async (m) => { await saveStaffMember(m); setAddingNew(false); setEditTarget(null); }}
          onClose={() => { setAddingNew(false); setEditTarget(null); }}
        />
      )}
      {removeConfirm && (
        <Overlay onClose={() => setRemoveConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-lg mb-1">Remove {removeConfirm.name}?</h3>
            <p className="text-sm text-muted-foreground mb-6">They will be removed from the roster. Existing scheduled sessions may show as unknown staff.</p>
            <div className="flex gap-3">
              <button onClick={() => setRemoveConfirm(null)} className="flex-1 btn-outline">Cancel</button>
              <button onClick={async () => { await removeStaffMember(removeConfirm.id); setRemoveConfirm(null); }} className="flex-1 btn-danger">Remove</button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function StaffSetupModal({ member, existingColors, onSave, onClose }: {
  member: StaffWithRestrictions | null;
  existingColors: string[];
  onSave: (m: StaffWithRestrictions) => Promise<void>;
  onClose: () => void;
}) {
  const isNew = !member;
  const [name,     setName]     = useState(member?.name     || "");
  const [initials, setInitials] = useState(member?.initials || "");
  const [color,    setColor]    = useState(member?.color    || AVATAR_PALETTE[0]);
  const [autoInit, setAutoInit] = useState(isNew);
  const [saving,   setSaving]   = useState(false);

  const handleNameChange = (v: string) => {
    setName(v);
    if (autoInit) setInitials(makeInitials(v));
  };

  const canSave = name.trim().length > 0 && initials.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    await onSave({
      id: member?.id || crypto.randomUUID(),
      season_id: member?.season_id || "",
      name: name.trim(),
      initials: initials.slice(0, 2).toUpperCase(),
      color,
      restrictions: member?.restrictions || { ageGroups: "all", sports: "all", unavailableDates: [], notes: "" },
    });
    setSaving(false);
  };

  return (
    <Overlay onClose={onClose}>
      <div className="bg-white w-full rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold text-base">{isNew ? "Add Staff Member" : "Edit Staff Member"}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors"><X size={15} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base" style={{ backgroundColor: color }}>
              {initials.slice(0, 2).toUpperCase() || "??"}
            </div>
            <div>
              <div className="font-semibold text-sm">{name || "Staff name"}</div>
              <div className="text-xs text-muted-foreground">{initials.slice(0, 2).toUpperCase() || "—"}</div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide">Full Name</label>
            <input value={name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Maya Cohen"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide">Initials</label>
            <div className="flex items-center gap-2">
              <input value={initials} onChange={e => { setInitials(e.target.value.slice(0, 2)); setAutoInit(false); }}
                placeholder="MC" maxLength={2}
                className="w-20 border border-border rounded-xl px-3 py-2.5 text-sm text-center font-bold uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              <button onClick={() => { setInitials(makeInitials(name)); setAutoInit(true); }} className="text-xs text-primary hover:underline">Auto from name</button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Avatar Color</label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_PALETTE.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 btn-outline">Cancel</button>
          <button onClick={handleSave} disabled={!canSave || saving}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${canSave && !saving ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
            {saving ? "Saving…" : isNew ? "Add to Roster" : "Save Changes"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Periods Tab ───────────────────────────────────────────────────────────────

function PeriodsTab({ readOnly }: { readOnly: boolean }) {
  const { ageGroups, sports, sunThuPeriods, friPeriods, ageGroupSports } = useAppStore();
  const setup = useSetup();
  const [template, setTemplate] = useState<"sun_thu" | "fri">("sun_thu");
  const [editId, setEditId] = useState<string | null>(null);
  const [newAg, setNewAg] = useState("");
  const sportNames = sports.map(s => s.name);

  const periods = template === "sun_thu" ? sunThuPeriods : friPeriods;

  const addAgeGroup = () => {
    const v = newAg.trim();
    if (v && !ageGroups.includes(v)) { setup.addAgeGroup(v); setNewAg(""); }
  };

  const addPeriod = async () => {
    const last = periods[periods.length - 1];
    const newPeriod: PeriodSlot = {
      id: crypto.randomUUID(),
      season_id: "",
      day_type: template,
      label: `Period ${periods.length + 1}`,
      start_time: last?.end_time || "09:00",
      end_time: "00:00",
      age_groups: [],
      age_sessions: {},
      sort_order: periods.length,
    };
    await setup.savePeriod(newPeriod);
    setEditId(newPeriod.id);
  };

  const movePeriod = async (id: string, dir: -1 | 1) => {
    const idx = periods.findIndex(p => p.id === id);
    if (idx + dir < 0 || idx + dir >= periods.length) return;
    const next = [...periods];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    await setup.reorderPeriods(template, next);
  };

  return (
    <div className="space-y-6">
      {/* Age groups */}
      <div className="bg-white rounded-2xl border border-border p-4">
        <h3 className="font-semibold text-sm mb-1">Age Groups</h3>
        <p className="text-xs text-muted-foreground mb-3">These groups are assigned to period slots below.</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {ageGroups.map(ag => (
            <span key={ag} className="flex items-center gap-1.5 text-xs font-semibold bg-secondary text-secondary-foreground px-2.5 py-1.5 rounded-full border border-secondary-foreground/10">
              {ag}
              <button onClick={() => setup.removeAgeGroup(ag)} className="text-muted-foreground hover:text-destructive transition-colors"><X size={11} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newAg} onChange={e => setNewAg(e.target.value)} onKeyDown={e => e.key === "Enter" && addAgeGroup()}
            placeholder="New age group name…"
            className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          <button onClick={addAgeGroup} disabled={!newAg.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40">
            Add
          </button>
        </div>
      </div>

      {/* Age group → sports mapping */}
      <AgeGroupSportsSection
        ageGroups={ageGroups}
        sportNames={sportNames}
        ageGroupSports={ageGroupSports}
        setAgeGroupSports={setup.saveAgeGroupSports}
      />

      {/* Template switcher */}
      <div>
        <div className="flex gap-2 mb-4">
          {([{ id: "sun_thu", l: "Sun – Thu" }, { id: "fri", l: "Friday" }] as const).map(t => (
            <button key={t.id} onClick={() => { setTemplate(t.id); setEditId(null); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${template === t.id ? "bg-primary text-primary-foreground border-primary" : "bg-white text-muted-foreground border-border hover:border-primary/40"}`}>
              {t.l}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {periods.map((p, i) => (
            <PeriodEditRow key={p.id} period={p} index={i} total={periods.length}
              ageGroups={ageGroups}
              isEditing={editId === p.id}
              onEdit={() => setEditId(p.id)}
              onSave={async (updated) => { await setup.savePeriod(updated); setEditId(null); }}
              onCancel={() => setEditId(null)}
              onDelete={() => setup.deletePeriod(p.id)}
              onMoveUp={() => movePeriod(p.id, -1)}
              onMoveDown={() => movePeriod(p.id, 1)}
            />
          ))}
        </div>
        <button onClick={addPeriod} className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
          <Plus size={14} />Add Period
        </button>
      </div>
    </div>
  );
}

function PeriodEditRow({ period, index, total, ageGroups, isEditing, onEdit, onSave, onCancel, onDelete, onMoveUp, onMoveDown }: {
  period: PeriodSlot; index: number; total: number; ageGroups: string[];
  isEditing: boolean; onEdit: () => void;
  onSave: (p: PeriodSlot) => Promise<void>; onCancel: () => void;
  onDelete: () => void; onMoveUp: () => void; onMoveDown: () => void;
}) {
  const [startTime,   setStartTime]   = useState(period.start_time);
  const [endTime,     setEndTime]     = useState(period.end_time);
  const [ags,         setAgs]         = useState<string[]>(period.age_groups);
  const [ageSessions, setAgeSessions] = useState<Record<string, number>>(period.age_sessions ?? {});

  React.useEffect(() => {
    setStartTime(period.start_time);
    setEndTime(period.end_time);
    setAgs(period.age_groups);
    setAgeSessions(period.age_sessions ?? {});
  }, [period]);

  const toggleAg  = (ag: string) => setAgs(prev => prev.includes(ag) ? prev.filter(x => x !== ag) : [...prev, ag]);
  const getCount  = (ag: string) => ageSessions[ag] ?? 1;
  const setCount  = (ag: string, n: number) => setAgeSessions(prev => ({ ...prev, [ag]: Math.max(1, n) }));

  if (!isEditing) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-border">
        <span className="text-xs font-mono text-muted-foreground w-36 flex-shrink-0">{fmt12(period.start_time)} – {fmt12(period.end_time)}</span>
        <div className="flex gap-1 flex-wrap flex-1">
          {period.age_groups.length > 0
            ? period.age_groups.map(ag => {
                const count = period.age_sessions?.[ag] ?? 1;
                return (
                  <span key={ag} className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-medium">
                    {ag}
                    {count > 1 && (
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">×{count}</span>
                    )}
                  </span>
                );
              })
            : <span className="text-xs text-muted-foreground/50 italic">No age groups</span>}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onMoveUp} disabled={index === 0} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30"><ChevronUp size={13} /></button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30"><ChevronDown size={13} /></button>
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Edit2 size={13} /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 size={13} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-primary/25 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        <span className="text-muted-foreground text-sm">–</span>
        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Age Groups & Concurrent Sessions</label>
        <p className="text-xs text-muted-foreground mb-3">Select which groups have sports in this period. Set the number of simultaneous games each group needs (used by auto-generate).</p>
        <div className="space-y-2">
          {ageGroups.map(ag => {
            const on = ags.includes(ag);
            const count = getCount(ag);
            return (
              <div key={ag} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${on ? "border-primary/30 bg-primary/5" : "border-border bg-white opacity-50"}`}>
                <button onClick={() => toggleAg(ag)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-semibold transition-all flex-shrink-0 ${on ? "bg-primary text-primary-foreground border-primary" : "bg-white text-muted-foreground border-border hover:border-primary/40"}`}>
                  {ag}
                </button>
                {on && (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-muted-foreground">Concurrent games:</span>
                    <div className="flex items-center gap-1 bg-white border border-border rounded-lg overflow-hidden">
                      <button onClick={() => setCount(ag, count - 1)} disabled={count <= 1}
                        className="px-2.5 py-1.5 text-sm font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30">−</button>
                      <span className="px-2 text-sm font-bold text-primary tabular-nums min-w-[1.5rem] text-center">{count}</span>
                      <button onClick={() => setCount(ag, count + 1)}
                        className="px-2.5 py-1.5 text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">+</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {ags.length === 0 && <p className="text-xs text-amber-600 mt-2">⚠ No age groups selected — this period won't show groups in the schedule.</p>}
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 btn-outline py-2">Cancel</button>
        <button onClick={() => onSave({ ...period, start_time: startTime, end_time: endTime, age_groups: ags, age_sessions: ageSessions })}
          className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all">
          Save Period
        </button>
      </div>
    </div>
  );
}

// ── Age Group Sports section ──────────────────────────────────────────────────

function AgeGroupSportsSection({ ageGroups, sportNames, ageGroupSports, setAgeGroupSports }: {
  ageGroups: string[];
  sportNames: string[];
  ageGroupSports: Record<string, string[]>;
  setAgeGroupSports: (next: Record<string, string[]>) => void;
}) {
  const toggleSport = (ag: string, sport: string) => {
    const next = { ...ageGroupSports };
    if (!(ag in next)) {
      // absent = all allowed → deselecting one means keep all except this sport
      next[ag] = sportNames.filter(s => s !== sport);
    } else {
      const cur = next[ag];
      const updated = cur.includes(sport) ? cur.filter(s => s !== sport) : [...cur, sport];
      if (updated.length === sportNames.length) { delete next[ag]; }
      else { next[ag] = updated; }
    }
    setAgeGroupSports(next);
  };

  const resetToAll  = (ag: string) => { const n = { ...ageGroupSports }; delete n[ag]; setAgeGroupSports(n); };
  const unselectAll = (ag: string) => setAgeGroupSports({ ...ageGroupSports, [ag]: [] });

  return (
    <div className="bg-white rounded-2xl border border-border p-4">
      <h3 className="font-semibold text-sm mb-1">Age Group Sports</h3>
      <p className="text-xs text-muted-foreground mb-4">Select which sports each age group can play. Used by auto-generate — if left at "all", any sport may be assigned.</p>
      <div className="space-y-4">
        {ageGroups.map(ag => {
          const isAllAllowed = !(ag in ageGroupSports);
          const allowed: string[] = ageGroupSports[ag] ?? [];
          return (
            <div key={ag}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold">{ag}</span>
                <div className="flex gap-3">
                  {!isAllAllowed && (
                    <button onClick={() => resetToAll(ag)} className="text-xs text-primary hover:underline">Select all</button>
                  )}
                  {(isAllAllowed || allowed.length > 0) && (
                    <button onClick={() => unselectAll(ag)} className="text-xs text-muted-foreground hover:text-foreground hover:underline">Unselect all</button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sportNames.map(s => {
                  const on = isAllAllowed || allowed.includes(s);
                  return (
                    <button key={s} onClick={() => toggleSport(ag, s)}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${on ? "bg-primary text-primary-foreground border-primary" : "bg-white text-muted-foreground border-border hover:border-primary/30"}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {isAllAllowed ? "All sports allowed" : allowed.length === 0 ? "No sports selected — click sports above to add them" : `${allowed.length} of ${sportNames.length} sports selected`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Sports Tab ────────────────────────────────────────────────────────────────

function SportsTab({ readOnly }: { readOnly: boolean }) {
  const { sports, locations, venueRules } = useAppStore();
  const setup = useSetup();
  const [newSport, setNewSport] = useState("");
  const sportNames = sports.map(s => s.name);
  const locationNames = locations.map(l => l.name);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select which locations a sport can be played at. Select none to allow any general location.
      </p>
      <div className="space-y-3">
        {sports.map(s => {
          const selected = venueRules[s.name] ?? [];
          return (
            <div key={s.id} className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${sportChipClass(s.name, sportNames)}`}>{s.name}</span>
                <button onClick={() => setup.removeSport(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {locationNames.map(l => {
                  const on = selected.includes(l);
                  return (
                    <button key={l} onClick={() => setup.toggleVenueRule(s.name, l)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${on ? "bg-primary text-primary-foreground border-primary" : "bg-white text-muted-foreground border-border hover:border-primary/40"}`}>
                      {l}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2.5">
                {selected.length === 0
                  ? "Any general (unclaimed) location"
                  : `Restricted to: ${selected.join(", ")}`}
              </p>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 pt-2">
        <input value={newSport} onChange={e => setNewSport(e.target.value)}
          onKeyDown={e => e.key === "Enter" && newSport.trim() && (setup.addSport(newSport.trim()), setNewSport(""))}
          placeholder="New sport name…"
          className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        <button onClick={() => { setup.addSport(newSport.trim()); setNewSport(""); }} disabled={!newSport.trim()}
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors">
          Add Sport
        </button>
      </div>
    </div>
  );
}

// ── Locations Tab ─────────────────────────────────────────────────────────────

function LocationsTab({ readOnly }: { readOnly: boolean }) {
  const { locations, venueRules } = useAppStore();
  const setup = useSetup();
  const [newLoc, setNewLoc] = useState("");

  const usedBySports = (locName: string) =>
    Object.entries(venueRules)
      .filter(([, locs]) => locs.includes(locName))
      .map(([sport]) => sport);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Locations claimed by a sport (in the Sports tab) show here as "Used by". All others are available as general-use venues.</p>
      <div className="space-y-2">
        {locations.map(l => {
          const usedBy = usedBySports(l.name);
          return (
            <div key={l.id} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-border">
              <MapPin size={14} className="text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{l.name}</span>
              {usedBy.length > 0
                ? <Badge color="blue">Used by: {usedBy.join(", ")}</Badge>
                : <Badge color="green">General use</Badge>}
              <button onClick={() => setup.removeLocation(l.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 pt-2">
        <input value={newLoc} onChange={e => setNewLoc(e.target.value)}
          onKeyDown={e => e.key === "Enter" && newLoc.trim() && (setup.addLocation(newLoc.trim()), setNewLoc(""))}
          placeholder="New location name…"
          className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        <button onClick={() => { setup.addLocation(newLoc.trim()); setNewLoc(""); }} disabled={!newLoc.trim()}
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors">
          Add Location
        </button>
      </div>
    </div>
  );
}
