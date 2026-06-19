import { useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAppStore } from "../store/useAppStore";
import type { StaffWithRestrictions, StaffRestriction } from "../types";
import { toast } from "sonner";

export function useStaff() {
  const { season, staff, setSeasonData } = useAppStore();

  const saveStaffMember = useCallback(async (member: StaffWithRestrictions): Promise<void> => {
    if (!season) return;

    const isNew = !staff.some(m => m.id === member.id);

    // Upsert the staff row (without restrictions)
    const staffRow = {
      id: member.id,
      season_id: season.id,
      name: member.name,
      initials: member.initials,
      color: member.color,
    };

    const { error } = isNew
      ? await supabase.from("staff").insert(staffRow)
      : await supabase.from("staff").update(staffRow).eq("id", member.id);

    if (error) { toast.error("Could not save staff member"); return; }

    // Update restrictions separately (only on edit, not on new — restrictions come from StaffModal)
    if (!isNew) {
      await syncRestrictions(member);
    } else {
      // New staff member: insert with default restrictions (none)
      // restrictions object is { ageGroups: "all", sports: "all", unavailableDates: [], notes: "" }
    }

    setSeasonData({
      staff: isNew
        ? [...staff, member]
        : staff.map(m => m.id === member.id ? member : m),
    });

    toast.success(isNew ? `${member.name} added` : "Staff updated");
  }, [season, staff, setSeasonData]);

  const saveRestrictions = useCallback(async (member: StaffWithRestrictions): Promise<void> => {
    await syncRestrictions(member);
    const updatedStaff = staff.map(m => m.id === member.id ? member : m);
    setSeasonData({ staff: updatedStaff });
    toast.success("Restrictions saved");
  }, [staff, setSeasonData]);

  const removeStaffMember = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from("staff").delete().eq("id", id);
    if (error) { toast.error("Could not remove staff member"); return; }
    setSeasonData({ staff: staff.filter(m => m.id !== id) });
    toast.success("Staff member removed");
  }, [staff, setSeasonData]);

  return { saveStaffMember, saveRestrictions, removeStaffMember };
}

async function syncRestrictions(member: StaffWithRestrictions) {
  // Delete all existing restrictions for this staff member, then re-insert
  await supabase.from("staff_restrictions").delete().eq("staff_id", member.id);

  const rows: Omit<StaffRestriction, "id">[] = [];

  if (member.restrictions.ageGroups !== "all") {
    rows.push({ staff_id: member.id, type: "age_group", value: JSON.stringify(member.restrictions.ageGroups) });
  }
  if (member.restrictions.sports !== "all") {
    rows.push({ staff_id: member.id, type: "sport", value: JSON.stringify(member.restrictions.sports) });
  }
  member.restrictions.unavailableDates.forEach(d => {
    rows.push({ staff_id: member.id, type: "unavailable_date", value: d });
  });
  if (member.restrictions.notes.trim()) {
    rows.push({ staff_id: member.id, type: "note", value: member.restrictions.notes.trim() });
  }

  if (rows.length) {
    await supabase.from("staff_restrictions").insert(rows);
  }
}
