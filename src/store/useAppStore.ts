import { create } from "zustand";
import type {
  Role, View, Season, PeriodSlot, Sport, Location,
  StaffWithRestrictions, SportSession, VenueRulesMap,
} from "../types";
import { tomorrowISO } from "../utils/dates";

interface AppState {
  // UI
  role: Role;
  view: View;
  selectedDate: string;

  // All seasons (for the switcher)
  allSeasons: Season[];
  // Which season we're currently viewing (null = load the active one)
  viewSeasonId: string | null;

  // Season config (loaded from Supabase for the viewed season)
  season: Season | null;
  sunThuPeriods: PeriodSlot[];
  friPeriods: PeriodSlot[];
  sports: Sport[];
  locations: Location[];
  ageGroups: string[];
  venueRules: VenueRulesMap;
  ageGroupSports: Record<string, string[]>;
  staff: StaffWithRestrictions[];

  // True when viewing a past (inactive) season — UI goes read-only
  isReadOnly: boolean;

  // Sessions for the currently selected date
  sessions: SportSession[];

  // Loading state
  seasonLoading: boolean;
  sessionsLoading: boolean;

  // Actions
  setRole: (r: Role) => void;
  setView: (v: View) => void;
  setSelectedDate: (d: string) => void;
  setAllSeasons: (seasons: Season[]) => void;
  switchSeason: (id: string | null) => void;
  setSeasonData: (data: Partial<AppState>) => void;
  setSessions: (s: SportSession[]) => void;
  upsertSession: (s: SportSession) => void;
  removeSession: (id: string) => void;
  setSeasonLoading: (b: boolean) => void;
  setSessionsLoading: (b: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  role: "scheduler",
  view: "schedule",
  selectedDate: tomorrowISO(),

  allSeasons: [],
  viewSeasonId: null,

  season: null,
  sunThuPeriods: [],
  friPeriods: [],
  sports: [],
  locations: [],
  ageGroups: [],
  venueRules: {},
  ageGroupSports: {},
  staff: [],

  isReadOnly: false,

  sessions: [],

  seasonLoading: true,
  sessionsLoading: false,

  setRole: (role) => set({ role }),
  setView:  (view)  => set({ view }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setAllSeasons: (allSeasons) => set({ allSeasons }),
  switchSeason: (viewSeasonId) => set({ viewSeasonId, sessions: [], seasonLoading: true }),
  setSeasonData: (data) => set(data),
  setSessions: (sessions) => set({ sessions }),
  upsertSession: (s) =>
    set(state => {
      const existing = state.sessions.findIndex(x => x.id === s.id);
      if (existing >= 0) {
        const next = [...state.sessions];
        next[existing] = s;
        return { sessions: next };
      }
      return { sessions: [...state.sessions, s] };
    }),
  removeSession: (id) =>
    set(state => ({ sessions: state.sessions.filter(s => s.id !== id) })),
  setSeasonLoading: (seasonLoading) => set({ seasonLoading }),
  setSessionsLoading: (sessionsLoading) => set({ sessionsLoading }),
}));
