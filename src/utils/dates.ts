import type { DayType, PeriodSlot } from "../types";

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: string, n: number): string {
  const dt = new Date(d + "T00:00:00"); // parse as local midnight
  dt.setDate(dt.getDate() + n);
  return toLocalISO(dt); // return local date, not UTC
}

export function isSaturday(d: string): boolean {
  return new Date(d + "T00:00:00").getDay() === 6;
}

export function dayType(d: string): DayType | null {
  const day = new Date(d + "T00:00:00").getDay();
  if (day === 6) return null;
  if (day === 5) return "fri";
  return "sun_thu";
}

export function weekSunday(d: string): string {
  const dt = new Date(d + "T00:00:00");
  dt.setDate(dt.getDate() - dt.getDay());
  return toLocalISO(dt); // local date, not UTC
}

export function fmt12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM";
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:${String(m || 0).padStart(2, "0")} ${ap}`;
}

export function fmtShort(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

export function fmtLong(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

export function periodsForDate(
  d: string,
  sunThu: PeriodSlot[],
  fri: PeriodSlot[],
): PeriodSlot[] {
  const type = dayType(d);
  if (!type) return [];
  return type === "fri" ? fri : sunThu;
}

export function todayISO(): string {
  return toLocalISO(new Date()); // local date, not UTC
}

export function tomorrowISO(): string {
  return addDays(todayISO(), 1);
}
