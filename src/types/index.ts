export type Role = "scheduler" | "admin";
export type View = "schedule" | "staff" | "weekly" | "export" | "setup";
export type DayType = "sun_thu" | "fri";

export interface Season {
  id: string;
  camp_name: string;
  season_name: string;
  is_active: boolean;
}

export interface PeriodSlot {
  id: string;
  season_id: string;
  day_type: DayType;
  label: string;
  start_time: string; // "HH:MM"
  end_time: string;
  age_groups: string[];
  age_sessions: Record<string, number>; // age group → concurrent sessions count (default 1)
  sort_order: number;
}

export interface Sport {
  id: string;
  season_id: string;
  name: string;
}

export interface Location {
  id: string;
  season_id: string;
  name: string;
}

/** venue_rules: sport_id → location_ids (many-to-many) */
export interface VenueRule {
  sport_id: string;
  location_id: string;
}

export interface StaffMember {
  id: string;
  season_id: string;
  name: string;
  initials: string;
  color: string;
}

export type RestrictionType = "age_group" | "sport" | "unavailable_date" | "note";

export interface StaffRestriction {
  id: string;
  staff_id: string;
  type: RestrictionType;
  /** JSON array for age_group/sport, ISO date string for unavailable_date, plain text for note */
  value: string;
}

/** Convenience shape used in the UI — restrictions merged onto the staff member */
export interface StaffWithRestrictions extends StaffMember {
  restrictions: {
    ageGroups: string[] | "all";
    sports: string[] | "all";
    unavailableDates: string[];
    notes: string;
  };
}

export interface SportSession {
  id: string;
  season_id: string;
  date: string; // YYYY-MM-DD
  period_slot_id: string;
  staff_id: string;
  sport: string;   // denormalized sport name
  location: string; // denormalized location name
  age_group: string;
}

/** Resolved venue rules for the UI: sport name → allowed location names */
export type VenueRulesMap = Record<string, string[]>;
