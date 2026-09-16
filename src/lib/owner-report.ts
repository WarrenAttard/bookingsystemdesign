/** Owner analytics data + range aggregation + CSV / PDF export helpers. */

export type MonthRow = {
  /** first day of the month, ISO */
  date: string;
  label: string;
  revenue: number;
  payroll: number;
  supplies: number;
  rent: number;
  grooms: number;
  /** revenue split */
  services: number;
  retail: number;
  addons: number;
  /** per-groomer revenue */
  team: { name: string; grooms: number; revenue: number; wages: number }[];
};

const mk = (
  date: string,
  label: string,
  revenue: number,
  payroll: number,
  supplies: number,
  grooms: number,
): MonthRow => ({
  date,
  label,
  revenue,
  payroll,
  supplies,
  rent: 1800,
  grooms,
  services: Math.round(revenue * 0.8),
  retail: Math.round(revenue * 0.12),
  addons: revenue - Math.round(revenue * 0.8) - Math.round(revenue * 0.12),
  team: [
    { name: "Alex Sterling", grooms: Math.round(grooms * 0.39), revenue: Math.round(revenue * 0.39), wages: 0 },
    { name: "Maria Rossi", grooms: Math.round(grooms * 0.35), revenue: Math.round(revenue * 0.35), wages: Math.round(payroll * 0.55) },
    { name: "Jonas Vella", grooms: Math.round(grooms * 0.26), revenue: Math.round(revenue * 0.26), wages: Math.round(payroll * 0.45) },
  ],
});

export const MONTHLY: MonthRow[] = [
  mk("2025-10-01", "Oct 25", 13150, 6980, 1180, 172),
  mk("2025-11-01", "Nov 25", 13980, 7100, 1240, 181),
  mk("2025-12-01", "Dec 25", 16420, 7860, 1520, 208),
  mk("2026-01-01", "Jan 26", 12240, 6640, 1080, 158),
  mk("2026-02-01", "Feb 26", 12980, 6720, 1120, 166),
  mk("2026-03-01", "Mar 26", 14310, 7020, 1260, 184),
  mk("2026-04-01", "Apr 26", 14200, 7080, 1290, 186),
  mk("2026-05-01", "May 26", 15600, 7340, 1380, 199),
  mk("2026-06-01", "Jun 26", 17100, 7720, 1490, 220),
  mk("2026-07-01", "Jul 26", 18450, 7980, 1580, 238),
  mk("2026-08-01", "Aug 26", 16980, 7810, 1460, 219),
  mk("2026-09-01", "Sep 26", 19240, 7980, 1340, 248),
];

export type Totals = {
  rows: MonthRow[];
  revenue: number;
  payroll: number;
  supplies: number;
  rent: number;
  costs: number;
  profit: number;
  margin: number;
  grooms: number;
  avgTicket: number;
  services: number;
  retail: number;
  addons: number;
  team: { name: string; grooms: number; revenue: number; wages: number }[];
};

export function aggregate(rows: MonthRow[]): Totals {
  const sum = (f: (r: MonthRow) => number) => rows.reduce((t, r) => t + f(r), 0);
  const revenue = sum((r) => r.revenue);
  const payroll = sum((r) => r.payroll);
  const supplies = sum((r) => r.supplies);
  const rent = sum((r) => r.rent);
  const costs = payroll + supplies + rent;
  const grooms = sum((r) => r.grooms);
  const names = ["Alex Sterling", "Maria Rossi", "Jonas Vella"];
  return {
    rows,
    revenue,
    payroll,
    supplies,
    rent,
    costs,
    profit: revenue - costs,
    margin: revenue ? ((revenue - costs) / revenue) * 100 : 0,
    grooms,
    avgTicket: grooms ? revenue / grooms : 0,
    services: sum((r) => r.services),
    retail: sum((r) => r.retail),
    addons: sum((r) => r.addons),
    team: names.map((name) => ({
      name,
      grooms: sum((r) => r.team.find((t) => t.name === name)?.grooms ?? 0),
      revenue: sum((r) => r.team.find((t) => t.name === name)?.revenue ?? 0),
      wages: sum((r) => r.team.find((t) => t.name === name)?.wages ?? 0),
    })),
  };
}

export function inRange(from: Date, to: Date): MonthRow[] {
  return MONTHLY.filter((r) => {
    const d = new Date(r.date + "T00:00:00");
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return end >= from && d <= to;
  });
}

export const money = (n: number) =>
  "€" + Math.round(n).toLocaleString("en-IE", { maximumFractionDigits: 0 });

export const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function download(name: string, mime: string, body: BlobPart) {
  const url = URL.createObjectURL(new Blob([body], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportCSV(t: Totals, from: Date, to: Date) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines: string[] = [];
  lines.push(esc("Pawline — Owner analytics"));
  lines.push([esc("Period"), esc(`${fmtDate(from)} – ${fmtDate(to)}`)].join(","));
  lines.push("");
  lines.push(["Summary", "Value"].map(esc).join(","));
  (
    [
      ["Revenue", t.revenue],
      ["Payroll", t.payroll],
      ["Supplies", t.supplies],
      ["Rent", t.rent],
      ["Total costs", t.costs],
      ["Net profit", t.profit],
      ["Margin %", t.margin.toFixed(1)],
      ["Grooms completed", t.grooms],
      ["Average ticket", t.avgTicket.toFixed(2)],
    ] as [string, number | string][]
  ).forEach(([k, v]) => lines.push([esc(k), esc(v)].join(",")));
  lines.push("");
  lines.push(["Month", "Revenue", "Payroll", "Supplies", "Rent", "Costs", "Profit", "Grooms"].map(esc).join(","));
  t.rows.forEach((r) => {
    const costs = r.payroll + r.supplies + r.rent;
    lines.push(
      [r.label, r.revenue, r.payroll, r.supplies, r.rent, costs, r.revenue - costs, r.grooms].map(esc).join(","),
    );
  });
  lines.push("");
  lines.push(["Income source", "Amount"].map(esc).join(","));
  lines.push([esc("Grooming services"), esc(t.services)].join(","));
  lines.push([esc("Retail & products"), esc(t.retail)].join(","));
  lines.push([esc("Add-ons"), esc(t.addons)].join(","));
  lines.push("");
  lines.push(["Team member", "Grooms", "Revenue", "Wages"].map(esc).join(","));
  t.team.forEach((m) => lines.push([m.name, m.grooms, m.revenue, m.wages].map(esc).join(",")));
  download(`pawline-owner-analytics-${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8", "\uFEFF" + lines.join("\r\n"));
}

/** Opens a print-ready page; the browser's print dialog saves it as PDF. */
export function exportPDF(t: Totals, from: Date, to: Date) {
  const peak = Math.max(1, ...t.rows.map((r) => r.revenue));
  const bars = t.rows
    .map((r) => {
      const costs = r.payroll + r.supplies + r.rent;
      const p = r.revenue - costs;
      return `<div class="col"><div class="bars"><i style="height:${(r.revenue / peak) * 100}%" class="rev"></i><i style="height:${(Math.max(p, 0) / peak) * 100}%" class="pro"></i></div><span>${r.label}</span></div>`;
    })
    .join("");
  const monthRows = t.rows
    .map((r) => {
      const costs = r.payroll + r.supplies + r.rent;
      return `<tr><td>${r.label}</td><td>${money(r.revenue)}</td><td>${money(r.payroll)}</td><td>${money(r.supplies + r.rent)}</td><td>${money(r.revenue - costs)}</td><td>${r.grooms}</td></tr>`;
    })
    .join("");
  const teamRows = t.team
    .map((m) => `<tr><td>${m.name}</td><td>${m.grooms}</td><td>${money(m.revenue)}</td><td>${money(m.wages)}</td></tr>`)
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Pawline owner analytics</title><style>
  *{box-sizing:border-box}
  body{font-family:ui-sans-serif,system-ui,Arial,sans-serif;color:#22201d;margin:32px;background:#fff}
  h1{font-size:22px;margin:0}
  .sub{color:#7a7167;font-size:12px;margin-top:4px}
  .kpis{display:flex;gap:12px;margin:24px 0}
  .kpi{flex:1;border:1px solid #e8e1d8;border-radius:12px;padding:12px}
  .kpi b{display:block;font-size:20px;margin-top:4px}
  .kpi span{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#7a7167}
  h2{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#7a7167;margin:22px 0 8px}
  .chart{display:flex;gap:10px;align-items:flex-end;height:150px;border-bottom:1px solid #e8e1d8;padding-bottom:4px}
  .col{flex:1;display:flex;flex-direction:column;align-items:center;height:100%}
  .bars{flex:1;display:flex;align-items:flex-end;gap:3px;width:100%}
  .bars i{flex:1;border-radius:3px 3px 0 0;display:block}
  .rev{background:#e4d9cb}.pro{background:#e07a2f}
  .col span{font-size:9px;color:#7a7167;margin-top:4px}
  .legend{font-size:10px;color:#7a7167;margin-top:6px}
  .legend i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:4px}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #eee7de}
  th{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#7a7167}
  td:not(:first-child){text-align:right;font-variant-numeric:tabular-nums}
  th:not(:first-child){text-align:right}
  @media print{body{margin:14mm}}
  </style></head><body>
  <h1>Pawline — Owner analytics</h1>
  <div class="sub">Trusted Dog Groomers · ${fmtDate(from)} – ${fmtDate(to)}</div>
  <div class="kpis">
    <div class="kpi"><span>Net profit</span><b>${money(t.profit)}</b></div>
    <div class="kpi"><span>Revenue</span><b>${money(t.revenue)}</b></div>
    <div class="kpi"><span>Costs</span><b>${money(t.costs)}</b></div>
    <div class="kpi"><span>Margin</span><b>${t.margin.toFixed(1)}%</b></div>
  </div>
  <h2>Revenue vs profit</h2>
  <div class="chart">${bars}</div>
  <div class="legend"><i style="background:#e4d9cb"></i>Revenue &nbsp; <i style="background:#e07a2f"></i>Profit</div>
  <h2>Monthly breakdown</h2>
  <table><thead><tr><th>Month</th><th>Revenue</th><th>Payroll</th><th>Supplies &amp; rent</th><th>Profit</th><th>Grooms</th></tr></thead><tbody>${monthRows}</tbody></table>
  <h2>Income sources</h2>
  <table><tbody>
    <tr><td>Grooming services</td><td>${money(t.services)}</td></tr>
    <tr><td>Retail &amp; products</td><td>${money(t.retail)}</td></tr>
    <tr><td>Add-ons</td><td>${money(t.addons)}</td></tr>
  </tbody></table>
  <h2>Team contribution</h2>
  <table><thead><tr><th>Member</th><th>Grooms</th><th>Revenue</th><th>Wages</th></tr></thead><tbody>${teamRows}</tbody></table>
  <script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script>
  </body></html>`;

  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
