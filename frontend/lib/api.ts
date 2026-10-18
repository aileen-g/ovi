// iOS simulator: localhost works. Real phone: use your Mac's Wi-Fi IP (System Settings > Wi-Fi > Details).
export const BASE = "http://localhost:8000";

export type Log = { flow: string; mood: string | null; symptoms: string[]; notes: string };
export type PhaseName = "menstrual" | "follicular" | "ovulation" | "luteal";
export type PhaseData = {
  days: Record<string, PhaseName>;   // "2026-10-17" -> which phase that day is in
  cycle_length: number;
  period_length: number;
  ovulation_day: number;
  estimated: boolean;                // true until 2+ periods are logged (uses a typical 28-day cycle)
};
const j = (r: Response) => r.json();

export const api = {
  logs: (): Promise<Record<string, Log>> => fetch(`${BASE}/logs`).then(j),
  save: (day: string, log: Log) =>
    fetch(`${BASE}/logs/${day}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(log) }),
  history: () => fetch(`${BASE}/history`).then(j),
  insights: () => fetch(`${BASE}/insights`).then(j),
  phases: (): Promise<PhaseData> => fetch(`${BASE}/phases`).then(j),
};

// Local date as YYYY-MM-DD (toISOString would shift by timezone)
export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const C = { bg: "#EAF4F7", card: "#FFFFFF", brown: "#5C3A36", pink: "#F4C6C6", yellow: "#F5E6A0", grey: "#8A8A8A" };

// Phase colours for the calendar highlight. Pastel + a little see-through. Change them here and the
// calendar and legend both update. (Menstrual is the same pink as C.pink, the old period circles.)
export const PHASES: Record<PhaseName, { label: string; color: string }> = {
  menstrual:  { label: "Menstrual",  color: "rgba(244, 198, 198, 0.85)" }, // pink
  follicular: { label: "Follicular", color: "rgba(190, 232, 205, 0.85)" }, // mint green
  ovulation:  { label: "Ovulation",  color: "rgba(214, 196, 245, 0.85)" }, // lavender
  luteal:     { label: "Luteal",     color: "rgba(255, 215, 170, 0.85)" }, // apricot
};
export const PHASE_ORDER: PhaseName[] = ["menstrual", "follicular", "ovulation", "luteal"];