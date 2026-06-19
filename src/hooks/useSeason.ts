import { useEffect } from "react";
import { supabase, hasCredentials } from "../lib/supabase";
import { useAppStore } from "../store/useAppStore";
import type {
  Season, PeriodSlot, Sport, Location, StaffMember,
  StaffRestriction, VenueRule, StaffWithRestrictions,
} from "../types";
import { toast } from "sonner";

export function useSeason() {
  const { viewSeasonId, setSeasonData, setSeasonLoading, setAllSeasons } = useAppStore();

  useEffect(() => {
    async function load() {
      setSeasonLoading(true);
      if (!hasCredentials) { setSeasonLoading(false); return; }

      try {
        // Always fetch the full list for the switcher
        const { data: allRows, error: ae } = await supabase
          .from("seasons")
          .select("*")
          .order("created_at", { ascending: false });
        if (ae) throw ae;
        const allSeasons = (allRows ?? []) as Season[];
        setAllSeasons(allSeasons);

        // Determine which season to load
        let season: Season | null = null;
        if (viewSeasonId) {
          season = allSeasons.find(s => s.id === viewSeasonId) ?? null;
        } else {
          season = allSeasons.find(s => s.is_active) ?? null;
        }

        if (!season) {
          setSeasonData({ season: null, isReadOnly: false, seasonLoading: false });
          return;
        }

        const isReadOnly = !season.is_active;

        // Parallel fetch of all config tables for this season
        const [
          { data: rawPeriods },
          { data: rawSports },
          { data: rawLocations },
          { data: rawStaff },
          { data: rawVenueRules },
        ] = await Promise.all([
          supabase.from("period_slots").select("*").eq("season_id", season.id).order("sort_order"),
          supabase.from("sports").select("*").eq("season_id", season.id),
          supabase.from("locations").select("*").eq("season_id", season.id),
          supabase.from("staff").select("*").eq("season_id", season.id),
          supabase.from("venue_rules").select("*"),
        ]);

        const periods    = (rawPeriods    ?? []) as PeriodSlot[];
        const sports     = (rawSports     ?? []) as Sport[];
        const locations  = (rawLocations  ?? []) as Location[];
        const staffBase  = (rawStaff      ?? []) as StaffMember[];
        const venueRuleRows = (rawVenueRules ?? []) as VenueRule[];

        // Fetch restrictions separately (needs staff IDs)
        let staffWithRestrictions: StaffWithRestrictions[] = staffBase.map(m => ({
          ...m,
          restrictions: { ageGroups: "all" as const, sports: "all" as const, unavailableDates: [], notes: "" },
        }));

        if (staffBase.length > 0) {
          const { data: rawRestrictions } = await supabase
            .from("staff_restrictions")
            .select("*")
            .in("staff_id", staffBase.map(s => s.id));

          const restrictions = (rawRestrictions ?? []) as StaffRestriction[];
          staffWithRestrictions = staffBase.map(m => {
            const r = restrictions.filter(x => x.staff_id === m.id);
            const agRow     = r.find(x => x.type === "age_group");
            const spRow     = r.find(x => x.type === "sport");
            const noteRow   = r.find(x => x.type === "note");
            const unavailRows = r.filter(x => x.type === "unavailable_date");
            return {
              ...m,
              restrictions: {
                ageGroups: agRow ? JSON.parse(agRow.value) : "all",
                sports:    spRow ? JSON.parse(spRow.value) : "all",
                unavailableDates: unavailRows.map(x => x.value),
                notes: noteRow?.value ?? "",
              },
            };
          });
        }

        // Build venueRules map: sport name → location names
        const venueRules: Record<string, string[]> = {};
        venueRuleRows.forEach(vr => {
          const sport = sports.find(s => s.id === vr.sport_id);
          const loc   = locations.find(l => l.id === vr.location_id);
          if (!sport || !loc) return;
          if (!venueRules[sport.name]) venueRules[sport.name] = [];
          venueRules[sport.name].push(loc.name);
        });

        setSeasonData({
          season,
          isReadOnly,
          sunThuPeriods: periods.filter(p => p.day_type === "sun_thu"),
          friPeriods:    periods.filter(p => p.day_type === "fri"),
          sports,
          locations,
          ageGroups: [...new Set(periods.flatMap(p => p.age_groups))],
          venueRules,
          ageGroupSports: (season as any).age_group_sports ?? {},
          staff: staffWithRestrictions,
          seasonLoading: false,
        });
      } catch (err) {
        console.error("Failed to load season:", err);
        toast.error("Could not load season data");
        setSeasonLoading(false);
      }
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewSeasonId]);
}
