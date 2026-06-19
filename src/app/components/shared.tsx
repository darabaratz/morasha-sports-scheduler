import React from "react";
import { AlertTriangle, Lock, Info } from "lucide-react";

export function Avatar({
  initials, color, size = "md",
}: {
  initials: string; color: string; size?: "sm" | "md" | "lg";
}) {
  const sz =
    size === "sm" ? "w-6 h-6 text-[10px]"
    : size === "lg" ? "w-11 h-11 text-base"
    : "w-8 h-8 text-xs";
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

export function Overlay({
  children, onClose,
}: {
  children: React.ReactNode; onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-lg flex justify-center">{children}</div>
    </div>
  );
}

export function Badge({
  color, children,
}: {
  color: "purple" | "orange" | "red" | "green" | "blue";
  children: React.ReactNode;
}) {
  const s = {
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    red:    "bg-red-50 text-red-700 border-red-200",
    green:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue:   "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${s[color]}`}>
      {children}
    </span>
  );
}

export function Field({
  label, children,
}: {
  label: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

export function Alert({
  type, children,
}: {
  type: "hard" | "soft" | "info"; children: React.ReactNode;
}) {
  const Icon = type === "hard" ? Lock : type === "soft" ? AlertTriangle : Info;
  const s = {
    hard: "bg-red-50 border-red-200 text-red-700",
    soft: "bg-amber-50 border-amber-200 text-amber-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  };
  const i = {
    hard: "text-red-500",
    soft: "text-amber-500",
    info: "text-blue-500",
  };
  return (
    <div className={`flex items-start gap-2.5 p-3 border rounded-xl text-xs leading-relaxed ${s[type]}`}>
      <Icon size={13} className={`mt-0.5 flex-shrink-0 ${i[type]}`} />
      <span>{children}</span>
    </div>
  );
}

export const CHIP_PALETTE = [
  "bg-amber-50 text-amber-800 border-amber-200",
  "bg-pink-50 text-pink-800 border-pink-200",
  "bg-orange-50 text-orange-800 border-orange-200",
  "bg-yellow-50 text-yellow-800 border-yellow-200",
  "bg-sky-50 text-sky-800 border-sky-200",
  "bg-red-50 text-red-800 border-red-200",
  "bg-emerald-50 text-emerald-800 border-emerald-200",
  "bg-indigo-50 text-indigo-800 border-indigo-200",
  "bg-green-50 text-green-800 border-green-200",
  "bg-purple-50 text-purple-800 border-purple-200",
];

export const AVATAR_PALETTE = [
  "#1A4731", "#92400E", "#1E40AF", "#065F46",
  "#374151", "#B45309", "#0E7490", "#7C2D12",
  "#9D174D", "#1B5E3B", "#1E3A5F", "#6B3A2A",
];

export function sportChipClass(sport: string, sportNames: string[]): string {
  const idx = sportNames.indexOf(sport);
  return CHIP_PALETTE[(idx >= 0 ? idx : 0) % CHIP_PALETTE.length];
}

export function makeInitials(name: string): string {
  const p = name.trim().split(/\s+/);
  return p.length >= 2
    ? (p[0][0] + p[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}
