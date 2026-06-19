import { useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAppStore } from "../store/useAppStore";
import type { SportSession } from "../types";
import { toast } from "sonner";

export function useSessions() {
  const {
    selectedDate, season,
    setSessions, upsertSession, removeSession,
    setSessionsLoading,
  } = useAppStore();

  // Load sessions whenever the selected date or season changes
  useEffect(() => {
    if (!season) return;
    async function load() {
      setSessionsLoading(true);
      const { data, error } = await supabase
        .from("sport_sessions")
        .select("*")
        .eq("season_id", season!.id)
        .eq("date", selectedDate);
      if (error) {
        toast.error("Could not load sessions");
      } else {
        setSessions((data ?? []) as SportSession[]);
      }
      setSessionsLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, season?.id]);

  const addSession = useCallback(async (
    partial: Omit<SportSession, "id" | "season_id">,
  ): Promise<SportSession | null> => {
    if (!season) return null;
    const row = { ...partial, season_id: season.id };
    const { data, error } = await supabase
      .from("sport_sessions")
      .insert(row)
      .select()
      .single();
    if (error) { toast.error("Could not save session"); return null; }
    const session = data as SportSession;
    upsertSession(session);
    toast.success("Session added");
    return session;
  }, [season, upsertSession]);

  const updateSession = useCallback(async (
    id: string,
    partial: Partial<SportSession>,
  ): Promise<SportSession | null> => {
    const { data, error } = await supabase
      .from("sport_sessions")
      .update(partial)
      .eq("id", id)
      .select()
      .single();
    if (error) { toast.error("Could not update session"); return null; }
    const session = data as SportSession;
    upsertSession(session);
    toast.success("Session updated");
    return session;
  }, [upsertSession]);

  const deleteSession = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("sport_sessions").delete().eq("id", id);
    if (error) { toast.error("Could not delete session"); return false; }
    removeSession(id);
    toast.success("Session removed");
    return true;
  }, [removeSession]);

  const copyFromDate = useCallback(async (
    srcDate: string,
    periodIds: Set<string>,
  ): Promise<void> => {
    if (!season) return;
    const { data, error } = await supabase
      .from("sport_sessions")
      .select("*")
      .eq("season_id", season.id)
      .eq("date", srcDate);
    if (error || !data?.length) { toast.error("No sessions on that date"); return; }

    const eligible = (data as SportSession[]).filter(s => periodIds.has(s.period_slot_id));
    if (!eligible.length) { toast.error("No matching periods to copy"); return; }

    const rows = eligible.map(({ id: _id, ...s }) => ({
      ...s,
      date: selectedDate,
    }));

    const { data: inserted, error: ie } = await supabase
      .from("sport_sessions")
      .insert(rows)
      .select();
    if (ie) { toast.error("Could not copy sessions"); return; }
    (inserted as SportSession[]).forEach(s => upsertSession(s));
    toast.success(`Copied ${inserted!.length} sessions from ${srcDate}`);
  }, [season, selectedDate, upsertSession]);

  return { addSession, updateSession, deleteSession, copyFromDate };
}
