import type { PeriodSlot, SportSession, StaffWithRestrictions } from "../types";

interface GenerateParams {
  date: string;
  periods: PeriodSlot[];
  staff: StaffWithRestrictions[];
  sportNames: string[];
  locationNames: string[];
  venueRules: Record<string, string[]>;
  ageGroupSports: Record<string, string[]>;
  existingSessions: SportSession[];
  mode: "replace" | "gaps";
}

export function autoGenerateSchedule({
  date, periods, staff, sportNames, locationNames, venueRules, ageGroupSports, existingSessions, mode,
}: GenerateParams): { sessions: SportSession[]; skipped: string[] } {
  const result: SportSession[] = [];
  const skipped: string[] = [];

  const workload: Record<string, number> = {};
  staff.forEach(m => { workload[m.id] = 0; });

  const keptSessions = mode === "gaps"
    ? existingSessions.filter(s => s.date === date)
    : [];
  keptSessions.forEach(s => { workload[s.staff_id] = (workload[s.staff_id] || 0) + 1; });

  const sportUsage: Record<string, number> = {};
  sportNames.forEach(s => { sportUsage[s] = 0; });
  keptSessions.forEach(s => { sportUsage[s.sport] = (sportUsage[s.sport] || 0) + 1; });

  const claimedVenues = new Set(Object.values(venueRules).flat());

  const getValidLocs = (sport: string, avail: string[]): string[] => {
    const req = venueRules[sport];
    if (req && req.length > 0) return avail.filter(l => req.includes(l));
    return avail.filter(l => !claimedVenues.has(l));
  };

  const getEligibleStaff = (sport: string, ageGroup: string, excludeIds: Set<string>, strict: boolean) =>
    staff
      .filter(m => {
        if (m.restrictions.unavailableDates.includes(date)) return false;
        if (excludeIds.has(m.id)) return false;
        if (strict) {
          if (m.restrictions.ageGroups !== "all" && !(m.restrictions.ageGroups as string[]).includes(ageGroup)) return false;
          if (m.restrictions.sports !== "all" && !(m.restrictions.sports as string[]).includes(sport)) return false;
        }
        return true;
      })
      .sort((a, b) => (workload[a.id] || 0) - (workload[b.id] || 0));

  for (const period of periods) {
    if (mode === "gaps" && keptSessions.some(s => s.period_slot_id === period.id)) continue;

    const usedStaff = new Set<string>();
    const usedLocs = new Set<string>();

    keptSessions.filter(s => s.period_slot_id === period.id).forEach(s => {
      usedStaff.add(s.staff_id); usedLocs.add(s.location);
    });

    const slots: string[] = [];
    for (const ag of period.age_groups) {
      const count = period.age_sessions?.[ag] ?? 1;
      for (let i = 0; i < count; i++) slots.push(ag);
    }
    if (slots.length === 0) continue;

    for (const ageGroup of slots) {
      const availLocs = locationNames.filter(l => !usedLocs.has(l));
      if (!availLocs.length) { skipped.push(period.label); break; }

      const allowedForGroup = ageGroupSports[ageGroup];
      const candidateSports = allowedForGroup && allowedForGroup.length > 0
        ? sportNames.filter(s => allowedForGroup.includes(s))
        : sportNames;
      const sortedSports = [...candidateSports].sort((a, b) => {
        const d = (sportUsage[a] || 0) - (sportUsage[b] || 0);
        return d !== 0 ? d : Math.random() - 0.5;
      });

      let assigned = false;
      for (const strict of [true, false]) {
        if (assigned) break;
        for (const sport of sortedSports) {
          if (assigned) break;
          const validLocs = getValidLocs(sport, availLocs);
          if (!validLocs.length) continue;
          const eligible = getEligibleStaff(sport, ageGroup, usedStaff, strict);
          if (!eligible.length) continue;

          const m = eligible[0], l = validLocs[0];
          result.push({
            id: crypto.randomUUID(),
            season_id: "",
            date,
            period_slot_id: period.id,
            staff_id: m.id,
            sport,
            location: l,
            age_group: ageGroup,
          });
          usedStaff.add(m.id); usedLocs.add(l);
          workload[m.id] = (workload[m.id] || 0) + 1;
          sportUsage[sport] = (sportUsage[sport] || 0) + 1;
          assigned = true;
        }
      }

      if (!assigned) skipped.push(`${period.label} (${ageGroup})`);
    }
  }

  return { sessions: result, skipped };
}
