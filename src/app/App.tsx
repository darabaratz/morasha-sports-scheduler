import React from "react";
import { hasCredentials } from "../lib/supabase";
import {
  Calendar, Users, BarChart2, Share2, Settings, Activity, Shield, User, ChevronDown, X,
  CheckCircle, AlertTriangle, Lock, Plus,
} from "lucide-react";
import { Toaster } from "sonner";
import { useAppStore } from "../store/useAppStore";
import { useSeason } from "../hooks/useSeason";
import { useSessions } from "../hooks/useSessions";
import { useSetup } from "../hooks/useSetup";
import ScheduleView from "./views/ScheduleView";
import StaffView    from "./views/StaffView";
import WeeklyView   from "./views/WeeklyView";
import ExportView   from "./views/ExportView";
import SetupView    from "./views/SetupView";
import type { View, Role } from "../types";

const NAV: { id: View; icon: any; label: string }[] = [
  { id: "schedule", icon: Calendar,  label: "Schedule" },
  { id: "staff",    icon: Users,     label: "Staff" },
  { id: "weekly",   icon: BarChart2, label: "Weekly" },
  { id: "export",   icon: Share2,    label: "Export" },
  { id: "setup",    icon: Settings,  label: "Setup" },
];

export default function App() {
  useSeason();
  useSessions();

  const {
    role, view, season, allSeasons, seasonLoading, isReadOnly,
    viewSeasonId, switchSeason, setRole, setView,
  } = useAppStore();

  const [roleModal,    setRoleModal]    = React.useState(false);
  const [seasonMenu,   setSeasonMenu]   = React.useState(false);
  const [newSeasonModal, setNewSeasonModal] = React.useState(false);

  // Default to Setup tab when no season exists
  React.useEffect(() => {
    if (!seasonLoading && !season && view !== "setup") setView("setup");
  }, [seasonLoading, season]);

  if (seasonLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
            <Activity size={20} className="text-primary animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-border shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center flex-shrink-0">
              <Activity size={14} className="text-white" />
            </div>
            <span className="text-xl uppercase"
              style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.06em" }}>
              {season?.camp_name ?? "Sports Scheduler"}
            </span>

            {/* Season switcher badge */}
            {season && (
              <div className="relative">
                <button
                  onClick={() => setSeasonMenu(v => !v)}
                  className="hidden sm:flex items-center gap-1 text-xs font-medium bg-secondary text-primary px-2 py-0.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors">
                  {season.season_name}
                  <ChevronDown size={11} />
                </button>

                {seasonMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSeasonMenu(false)} />
                    <div className="absolute left-0 top-7 z-50 bg-white rounded-2xl border border-border shadow-xl w-64 overflow-hidden">
                      <div className="px-3 py-2.5 border-b border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Seasons</p>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {allSeasons.map(s => (
                          <button key={s.id}
                            onClick={() => { switchSeason(s.is_active ? null : s.id); setSeasonMenu(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors ${season.id === s.id ? "bg-secondary/60" : ""}`}>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{s.season_name}</div>
                              <div className="text-xs text-muted-foreground truncate">{s.camp_name}</div>
                            </div>
                            {s.is_active
                              ? <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">Active</span>
                              : <Lock size={11} className="text-muted-foreground flex-shrink-0" />
                            }
                            {season.id === s.id && <CheckCircle size={13} className="text-primary flex-shrink-0" />}
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-border p-2">
                        <button
                          onClick={() => { setSeasonMenu(false); setNewSeasonModal(true); }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-primary hover:bg-secondary transition-colors">
                          <Plus size={14} />New Season
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <button onClick={() => setRoleModal(true)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors">
            {role === "admin" ? <Shield size={13} className="text-accent" /> : <User size={13} />}
            <span className="font-medium">{role === "admin" ? "Admin" : "Daniella"}</span>
            <ChevronDown size={12} />
          </button>
        </div>
      </header>

      {/* Nav tabs */}
      <nav className="sticky top-14 z-30 bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-4 flex">
          {NAV.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setView(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 transition-colors ${
                view === id
                  ? id === "setup" ? "border-accent text-accent font-semibold" : "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Read-only banner for past seasons */}
      {isReadOnly && (
        <div className="max-w-3xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-800">
            <Lock size={14} className="flex-shrink-0" />
            <span>You're viewing a past season — <strong>{season?.season_name}</strong>. This is read-only.</span>
            <button
              onClick={() => switchSeason(null)}
              className="ml-auto text-xs font-semibold text-primary hover:underline flex-shrink-0">
              Back to active
            </button>
          </div>
        </div>
      )}

      {/* No-credentials banner */}
      {!hasCredentials && (
        <div className="max-w-3xl mx-auto px-4 pt-4">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <span>Supabase not connected. Add credentials to your <code className="bg-amber-100 px-1 rounded font-mono text-xs">.env</code> file and restart.</span>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-6 pb-16">
        {view === "schedule" && (season
          ? <ScheduleView />
          : <NoSeasonPlaceholder onGoToSetup={() => setView("setup")} label="Schedule" />
        )}
        {view === "staff" && (season
          ? <StaffView />
          : <NoSeasonPlaceholder onGoToSetup={() => setView("setup")} label="Staff" />
        )}
        {view === "weekly" && (season
          ? <WeeklyView />
          : <NoSeasonPlaceholder onGoToSetup={() => setView("setup")} label="Weekly View" />
        )}
        {view === "export" && (season
          ? <ExportView />
          : <NoSeasonPlaceholder onGoToSetup={() => setView("setup")} label="Export" />
        )}
        {view === "setup" && <SetupView />}
      </main>

      {/* Role switcher modal */}
      {roleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={e => { if (e.target === e.currentTarget) setRoleModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Switch Role</h3>
              <button onClick={() => setRoleModal(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
            </div>
            <div className="space-y-2">
              {([
                { id: "scheduler" as Role, label: "Daniella (Scheduler)", sub: "Daily scheduling · restrictions · export", icon: User,   border: "border-primary", accent: "bg-primary/5",  check: "text-primary" },
                { id: "admin"     as Role, label: "Admin (Talia)",        sub: "Season setup · staff roster · templates",  icon: Shield, border: "border-accent",  accent: "bg-accent/5",   check: "text-accent" },
              ]).map(opt => (
                <button key={opt.id}
                  onClick={() => { setRole(opt.id); setRoleModal(false); if (opt.id === "scheduler" && view === "setup") setView("schedule"); }}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${role === opt.id ? `${opt.border} ${opt.accent}` : "border-border hover:bg-muted/40"}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${role === opt.id ? opt.accent : "bg-muted"}`}>
                    <opt.icon size={16} className={role === opt.id ? opt.check : "text-muted-foreground"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{opt.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{opt.sub}</div>
                  </div>
                  {role === opt.id && <CheckCircle size={16} className={opt.check} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New season modal */}
      {newSeasonModal && (
        <NewSeasonModal onClose={() => setNewSeasonModal(false)} />
      )}
    </div>
  );
}

function NewSeasonModal({ onClose }: { onClose: () => void }) {
  const { season } = useAppStore();
  const setup = useSetup();
  const [campName,    setCampName]    = React.useState(season?.camp_name ?? "");
  const [seasonName,  setSeasonName]  = React.useState("");
  const [saving,      setSaving]      = React.useState(false);

  const canSave = campName.trim().length > 0 && seasonName.trim().length > 0;

  const handleCreate = async () => {
    if (!canSave) return;
    setSaving(true);
    await setup.createSeason(campName.trim(), seasonName.trim());
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold text-base">New Season</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors"><X size={15} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
            The current season will be archived and set to read-only. You'll need to re-configure staff, periods, and sports for the new season.
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Camp / Programme Name</label>
            <input value={campName} onChange={e => setCampName(e.target.value)}
              placeholder="e.g. Camp Sports"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Season Name</label>
            <input value={seasonName} onChange={e => setSeasonName(e.target.value)}
              placeholder="e.g. Summer 2027"
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 btn-outline">Cancel</button>
          <button onClick={handleCreate} disabled={!canSave || saving}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${canSave && !saving ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
            {saving ? "Creating…" : "Create Season"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NoSeasonPlaceholder({ onGoToSetup, label }: { onGoToSetup: () => void; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-4">
        <Settings size={22} className="text-primary" />
      </div>
      <h2 className="font-bold text-lg mb-1">{label} isn't ready yet</h2>
      <p className="text-sm text-muted-foreground mb-5 max-w-xs">
        Set up your season first — add your camp name, staff, periods, and sports.
      </p>
      <button onClick={onGoToSetup}
        className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
        Go to Setup
      </button>
    </div>
  );
}
