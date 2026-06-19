import { useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAppStore } from "../store/useAppStore";
import type { PeriodSlot, Sport, Location, Season } from "../types";
import { toast } from "sonner";

export function useSetup() {
  const {
    season, sports, locations, venueRules, sunThuPeriods, friPeriods, ageGroups, ageGroupSports,
    allSeasons, setSeasonData, setAllSeasons, switchSeason,
  } = useAppStore();

  // ── Season name/camp name ───────────────────────────────────────────────────

  const updateSeasonMeta = useCallback(async (campName: string, seasonName: string) => {
    if (!season) return;
    const { error } = await supabase
      .from("seasons")
      .update({ camp_name: campName, season_name: seasonName })
      .eq("id", season.id);
    if (error) { toast.error("Could not save"); return; }
    setSeasonData({ season: { ...season, camp_name: campName, season_name: seasonName } });
    toast.success("Saved");
  }, [season, setSeasonData]);

  // ── Period slots ────────────────────────────────────────────────────────────

  const savePeriod = useCallback(async (period: PeriodSlot) => {
    if (!season) return;
    const row = { ...period, season_id: season.id };
    const exists = [...sunThuPeriods, ...friPeriods].some(p => p.id === period.id);
    const { error } = exists
      ? await supabase.from("period_slots").update(row).eq("id", period.id)
      : await supabase.from("period_slots").insert(row);
    if (error) { toast.error("Could not save period"); return; }

    const update = (list: PeriodSlot[]) =>
      exists ? list.map(p => p.id === period.id ? period : p) : [...list, period];

    if (period.day_type === "fri") {
      setSeasonData({ friPeriods: update(friPeriods) });
    } else {
      setSeasonData({ sunThuPeriods: update(sunThuPeriods) });
    }
    toast.success("Period saved");
  }, [season, sunThuPeriods, friPeriods, setSeasonData]);

  const deletePeriod = useCallback(async (id: string) => {
    const { error } = await supabase.from("period_slots").delete().eq("id", id);
    if (error) { toast.error("Could not delete period"); return; }
    const remove = (list: PeriodSlot[]) =>
      list.filter(p => p.id !== id).map((p, i) => ({ ...p, label: `Period ${i + 1}` }));
    setSeasonData({
      sunThuPeriods: remove(sunThuPeriods),
      friPeriods: remove(friPeriods),
    });
    toast.success("Period removed");
  }, [sunThuPeriods, friPeriods, setSeasonData]);

  const reorderPeriods = useCallback(async (
    dayType: "sun_thu" | "fri",
    reordered: PeriodSlot[],
  ) => {
    // Update sort_order in DB for each
    const updates = reordered.map((p, i) =>
      supabase.from("period_slots").update({ sort_order: i, label: `Period ${i + 1}` }).eq("id", p.id),
    );
    await Promise.all(updates);
    const relabeled = reordered.map((p, i) => ({ ...p, sort_order: i, label: `Period ${i + 1}` }));
    if (dayType === "fri") {
      setSeasonData({ friPeriods: relabeled });
    } else {
      setSeasonData({ sunThuPeriods: relabeled });
    }
  }, [setSeasonData]);

  // ── Age groups ──────────────────────────────────────────────────────────────

  const addAgeGroup = useCallback(async (name: string) => {
    if (!season || ageGroups.includes(name)) return;
    const { error } = await supabase
      .from("age_groups")
      .insert({ season_id: season.id, name, sort_order: ageGroups.length });
    if (error) { toast.error("Could not add age group"); return; }
    setSeasonData({ ageGroups: [...ageGroups, name] });
    toast.success(`"${name}" added`);
  }, [season, ageGroups, setSeasonData]);

  const removeAgeGroup = useCallback(async (name: string) => {
    if (!season) return;
    const { error } = await supabase
      .from("age_groups")
      .delete()
      .eq("season_id", season.id)
      .eq("name", name);
    if (error) { toast.error("Could not remove age group"); return; }
    setSeasonData({ ageGroups: ageGroups.filter(g => g !== name) });
    toast.success(`"${name}" removed`);
  }, [season, ageGroups, setSeasonData]);

  // ── Sports ──────────────────────────────────────────────────────────────────

  const addSport = useCallback(async (name: string) => {
    if (!season || sports.some(s => s.name === name)) return;
    const { data, error } = await supabase
      .from("sports")
      .insert({ season_id: season.id, name })
      .select()
      .single();
    if (error) { toast.error("Could not add sport"); return; }
    setSeasonData({ sports: [...sports, data as Sport] });
    toast.success(`"${name}" added`);
  }, [season, sports, setSeasonData]);

  const removeSport = useCallback(async (id: string) => {
    const sport = sports.find(s => s.id === id);
    if (!sport) return;
    await supabase.from("venue_rules").delete().eq("sport_id", id);
    const { error } = await supabase.from("sports").delete().eq("id", id);
    if (error) { toast.error("Could not remove sport"); return; }
    const newRules = { ...venueRules };
    delete newRules[sport.name];
    setSeasonData({ sports: sports.filter(s => s.id !== id), venueRules: newRules });
    toast.success(`"${sport.name}" removed`);
  }, [sports, venueRules, setSeasonData]);

  // ── Locations ───────────────────────────────────────────────────────────────

  const addLocation = useCallback(async (name: string) => {
    if (!season || locations.some(l => l.name === name)) return;
    const { data, error } = await supabase
      .from("locations")
      .insert({ season_id: season.id, name })
      .select()
      .single();
    if (error) { toast.error("Could not add location"); return; }
    setSeasonData({ locations: [...locations, data as Location] });
    toast.success(`"${name}" added`);
  }, [season, locations, setSeasonData]);

  const removeLocation = useCallback(async (id: string) => {
    const loc = locations.find(l => l.id === id);
    if (!loc) return;
    await supabase.from("venue_rules").delete().eq("location_id", id);
    const { error } = await supabase.from("locations").delete().eq("id", id);
    if (error) { toast.error("Could not remove location"); return; }
    const newRules: Record<string, string[]> = {};
    Object.entries(venueRules).forEach(([sport, locs]) => {
      const filtered = locs.filter(l => l !== loc.name);
      if (filtered.length) newRules[sport] = filtered;
    });
    setSeasonData({
      locations: locations.filter(l => l.id !== id),
      venueRules: newRules,
    });
    toast.success(`"${loc.name}" removed`);
  }, [locations, venueRules, setSeasonData]);

  // ── Venue rules ─────────────────────────────────────────────────────────────

  const toggleVenueRule = useCallback(async (sportName: string, locationName: string) => {
    const sport = sports.find(s => s.name === sportName);
    const loc   = locations.find(l => l.name === locationName);
    if (!sport || !loc) return;

    const current = venueRules[sportName] ?? [];
    const isOn = current.includes(locationName);

    if (isOn) {
      await supabase.from("venue_rules")
        .delete()
        .eq("sport_id", sport.id)
        .eq("location_id", loc.id);
      const next = current.filter(l => l !== locationName);
      const newRules = { ...venueRules };
      if (next.length) newRules[sportName] = next; else delete newRules[sportName];
      setSeasonData({ venueRules: newRules });
    } else {
      await supabase.from("venue_rules").insert({ sport_id: sport.id, location_id: loc.id });
      setSeasonData({ venueRules: { ...venueRules, [sportName]: [...current, locationName] } });
    }
  }, [sports, locations, venueRules, setSeasonData]);

  const createSeason = useCallback(async (campName: string, seasonName: string) => {
    // Mark current active season inactive
    if (season) {
      await supabase.from("seasons").update({ is_active: false }).eq("id", season.id);
    }
    // Create new season
    const { data, error } = await supabase
      .from("seasons")
      .insert({ camp_name: campName, season_name: seasonName, is_active: true })
      .select()
      .single();
    if (error) { toast.error("Could not create season"); return; }
    const newSeason = data as Season;
    setAllSeasons([newSeason, ...allSeasons.map(s => ({ ...s, is_active: false }))]);
    switchSeason(null); // null = load the active season (the new one)
    toast.success(`"${seasonName}" created — configure it in Setup`);
  }, [season, allSeasons, setAllSeasons, switchSeason]);

  const saveAgeGroupSports = useCallback(async (next: Record<string, string[]>) => {
    if (!season) return;
    const { error } = await supabase
      .from("seasons")
      .update({ age_group_sports: next })
      .eq("id", season.id);
    if (error) { toast.error("Could not save age group sports"); return; }
    setSeasonData({ ageGroupSports: next });
  }, [season, setSeasonData]);

  return {
    createSeason,
    updateSeasonMeta,
    savePeriod, deletePeriod, reorderPeriods,
    addAgeGroup, removeAgeGroup,
    addSport, removeSport,
    addLocation, removeLocation,
    toggleVenueRule,
    saveAgeGroupSports,
  };
}
