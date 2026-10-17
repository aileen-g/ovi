// iOS simulator: localhost works. Real phone: use your Mac's Wi-Fi IP (System Settings > Wi-Fi > Details).
export const BASE = "http://localhost:8000";

export type Log = { flow: string; mood: string | null; symptoms: string[]; notes: string };
const j = (r: Response) => r.json();

export const api = {
  logs: (): Promise<Record<string, Log>> => fetch(`${BASE}/logs`).then(j),
  save: (day: string, log: Log) =>
    fetch(`${BASE}/logs/${day}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(log) }),
  insights: () => fetch(`${BASE}/insights`).then(j),
  analysis: () => fetch(`${BASE}/analysis`).then(j),
};

// Local date as YYYY-MM-DD (toISOString would shift by timezone)
export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const C = { bg: "#DFF3FF", card: "#FFFFFF", brown: "#5C3A36", pink: "#F4C6C6", yellow: "#F5E6A0", grey: "#8A8A8A" };
