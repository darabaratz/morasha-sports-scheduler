import type { SportSession, StaffWithRestrictions, VenueRulesMap, Location } from "../types";

export function getValidLocations(
  sport: string,
  allLocations: string[],
  venueRules: VenueRulesMap,
): string[] {
  const allowed = venueRules[sport];
  if (allowed && allowed.length > 0) {
    return allLocations.filter(l => allowed.includes(l));
  }
  // No venue rule → any location not claimed by any sport
  const claimed = new Set(Object.values(venueRules).flat());
  return allLocations.filter(l => !claimed.has(l));
}

export interface HardBlock {
  reason: string;
}

export interface SoftWarning {
  reason: string;
}

export function checkHardBlocks(params: {
  staffId: string;
  sport: string;
  location: string;
  date: string;
  periodSlotId: string;
  editingId?: string;
  periodSessions: SportSession[];
  staff: StaffWithRestrictions[];
}): HardBlock | null {
  const { staffId, sport, location, date, editingId, periodSessions, staff } = params;
  const member = staff.find(m => m.id === staffId);

  if (member?.restrictions.unavailableDates.includes(date)) {
    return { reason: `${member.name} is marked unavailable on this date.` };
  }

  const others = periodSessions.filter(s => s.id !== editingId);

  if (staffId && others.some(s => s.staff_id === staffId)) {
    return { reason: `${member?.name ?? "This staff member"} is already assigned in this period.` };
  }

  // Only block the location if a *different* sport is using it — same sport allows co-staff
  if (location && others.some(s => s.location === location && s.sport !== sport)) {
    return { reason: `${location} is already booked for a different sport this period.` };
  }

  return null;
}

export function checkSoftWarnings(params: {
  staffId: string;
  sport: string;
  ageGroup: string;
  staff: StaffWithRestrictions[];
}): SoftWarning[] {
  const { staffId, sport, ageGroup, staff } = params;
  const member = staff.find(m => m.id === staffId);
  if (!member) return [];
  const warnings: SoftWarning[] = [];

  if (
    ageGroup &&
    member.restrictions.ageGroups !== "all" &&
    !(member.restrictions.ageGroups as string[]).includes(ageGroup)
  ) {
    warnings.push({
      reason: `Age group restriction: ${member.name} is only approved for ${(member.restrictions.ageGroups as string[]).join(", ")}.`,
    });
  }

  if (
    sport &&
    member.restrictions.sports !== "all" &&
    !(member.restrictions.sports as string[]).includes(sport)
  ) {
    warnings.push({
      reason: `Sport restriction: ${member.name} is not listed for ${sport}.`,
    });
  }

  return warnings;
}
