// report.ts: everything behind the Insights page's "Generate Report" button.
//   1. asks the backend for the raw numbers (/report)
//   2. lays them out as a plain black-on-white Arial page (HTML)
//   3. turns that into a PDF and opens the share sheet (or the print dialog on web)
import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { BASE } from "./api";

type Flow = "none" | "light" | "medium" | "heavy";
export type ReportData = {
  logged_days: number; first_log: string | null; last_log: string | null;
  avg_period: number | null; avg_cycle: number | null;
  period_count: number; cycle_count: number;
  periods: { start: string; end: string; length: number; flows: (Flow | "")[] }[];   // most recent first; one entry per calendar day, "" = nothing logged
  cycles: { start: string; next_start: string; length: number }[];            // most recent first
  symptoms: { name: string; days: number; percent: number }[];                // most frequent first
  flow: { level: Flow; days: number; percent: number; percent_of_bleeding: number | null }[];
  flow_bleeding_days: number;
  extras: { label: string; value: boolean | null }[];                         // null = profile not filled in
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const FLOW_SHORT: Record<string, string> = { light: "L", medium: "M", heavy: "H", "": "" };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Keep stray characters in data from breaking the page
const esc = (s: unknown) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

// "2026-10-17" -> "Oct 17, 2026" (split by hand so timezones can't shift the day)
const day = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };
const days = (n: number | null) => (n === null ? "Not enough data" : `${n} days`);

type Cell = string | number;
function table(head: { t: string; num?: boolean; center?: boolean }[], rows: Cell[][]) {
  const cls = (h: { num?: boolean; center?: boolean }) => (h.num ? "num" : h.center ? "ctr" : "");
  return `<table>
    <tr>${head.map((h) => `<th class="${cls(h)}">${esc(h.t)}</th>`).join("")}</tr>
    ${rows.map((r) => `<tr>${r.map((c, i) => `<td class="${cls(head[i])}">${esc(c)}</td>`).join("")}</tr>`).join("")}
  </table>`;
}
// Two-column "label ... value" block
const facts = (rows: [string, Cell][]) =>
  `<table class="facts">${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num"><b>${esc(v)}</b></td></tr>`).join("")}</table>`;
const empty = (msg: string) => `<p class="empty">${esc(msg)}</p>`;

export function buildReportHtml(d: ReportData, today: Date, androidMargin: boolean) {
  const reportDate = `${MONTHS_LONG[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;
  const maxDays = Math.max(0, ...d.periods.map((p) => p.flows.length));

  const periods = d.periods.length === 0 ? empty("No periods logged yet.") : table(
    [{ t: "Start" }, { t: "End" }, { t: "Length (days)", num: true }],
    d.periods.map((p) => [day(p.start), day(p.end), p.length]),
  );

  const cycles = d.cycles.length === 0 ? empty("Needs at least 2 logged periods.") : table(
    [{ t: "Period start" }, { t: "Next period start" }, { t: "Length (days)", num: true }],
    d.cycles.map((c) => [day(c.start), day(c.next_start), c.length]),
  );

  const symptoms = table(
    [{ t: "#", center: true }, { t: "Symptom" }, { t: "Days logged", num: true }, { t: "% of logged days", num: true }],
    d.symptoms.map((s, i) => [i + 1, s.name, s.days, `${s.percent}%`]),
  );

  const flow = table(
    [{ t: "Flow" }, { t: "Days", num: true }, { t: "% of logged days", num: true }, { t: "% of bleeding days", num: true }],
    d.flow.map((f) => [cap(f.level), f.days, `${f.percent}%`, f.percent_of_bleeding === null ? "–" : `${f.percent_of_bleeding}%`]),
  );

  // One row per period, one column per day of that period
  const flowByDay = d.periods.length === 0 ? "" : `
    <h3>Flow on each day of the period</h3>
    ${table(
      [{ t: "Period start" }, ...Array.from({ length: maxDays }, (_, i) => ({ t: `Day ${i + 1}`, center: true }))],
      d.periods.map((p) => [day(p.start), ...Array.from({ length: maxDays }, (_, i) => FLOW_SHORT[p.flows[i]] ?? "")]),
    )}
    <p class="note">L = light &nbsp; M = medium &nbsp; H = heavy</p>`;

  const extras = table(
    [{ t: "Item" }, { t: "Answer", num: true }],
    d.extras.map((e) => [e.label, e.value === null ? "Not entered" : e.value ? "Yes" : "No"]),
  );

  const range = d.first_log && d.last_log ? `${day(d.first_log)} – ${day(d.last_log)}` : "No entries yet";

  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  ${androidMargin ? "@page { margin: 0.6in; }" : ""}
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; font-size: 13px; line-height: 1.35; margin: 0; }
  h1 { font-size: 26px; margin: 0; }
  h2 { font-size: 16px; margin: 26px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #000; }
  h3 { font-size: 13px; margin: 16px 0 6px; }
  .top { border-bottom: 3px solid #000; margin-top: 0; }
  .top td { border: none; padding: 0 0 10px; vertical-align: bottom; }
  .top .date { font-size: 14px; text-align: right; }
  .meta { margin: 8px 0 0; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { text-align: left; font-size: 12px; padding: 5px 6px; border-bottom: 1.5px solid #000; }
  td { padding: 5px 6px; border-bottom: 1px solid #ccc; }
  .num { text-align: right; } .ctr { text-align: center; }
  .facts td { font-size: 14px; }
  tr, section { page-break-inside: avoid; }
  h2, h3 { page-break-after: avoid; }
  .note { font-size: 11px; margin: 6px 0 0; }
  .empty { margin: 6px 0 0; font-style: italic; }
  .foot { margin-top: 30px; padding-top: 8px; border-top: 1px solid #000; font-size: 11px; }
</style></head><body>
  <table class="top"><tr>
    <td><h1>Cycle Report</h1></td>
    <td class="date"><b>Report date:</b> ${esc(reportDate)}</td>
  </tr></table>
  <p class="meta">Days logged: <b>${d.logged_days}</b> &nbsp;|&nbsp; Logging period: <b>${esc(range)}</b></p>

  <section>
  <h2>Period length</h2>
  ${facts([["Average period length", days(d.avg_period)], ["Periods logged", d.period_count]])}
  <h3>Most recent periods</h3>
  ${periods}
  </section>

  <section>
  <h2>Cycle length</h2>
  ${facts([["Average cycle length", days(d.avg_cycle)], ["Cycles logged", d.cycle_count]])}
  <h3>Most recent cycles</h3>
  ${cycles}
  </section>

  <section>
  <h2>Symptoms</h2>
  <p class="note">Most frequent to least frequent. Based on ${d.logged_days} logged days.</p>
  ${symptoms}
  </section>

  <section>
  <h2>Flow</h2>
  <p class="note">Based on ${d.logged_days} logged days (${d.flow_bleeding_days} with bleeding).</p>
  ${flow}
  ${flowByDay}
  </section>

  <section>
  <h2>Other symptoms &amp; habits</h2>
  <p class="note">Self-reported in the health profile.</p>
  ${extras}
  </section>

  <p class="foot">Self-reported data from the Ovi app. Raw entries only, not a diagnosis.</p>
</body></html>`;
}

// Called by the button. Throws if the backend can't be reached (the screen shows an alert).
export async function generateReport() {
  const res = await fetch(`${BASE}/report`);
  if (!res.ok) throw new Error(`Report request failed (${res.status})`);
  const data: ReportData = await res.json();

  // Android's print engine needs the page margin in the CSS; iOS gets it from the `margins` option below.
  const html = buildReportHtml(data, new Date(), Platform.OS === "android");

  // On web this just opens the browser's print dialog (choose "Save as PDF").
  const { uri } = await Print.printToFileAsync({
    html,
    margins: { top: 40, bottom: 40, left: 44, right: 44 },   // iOS only
  });

  if (Platform.OS !== "web" && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: "Share your Ovi report" });
  }
}
