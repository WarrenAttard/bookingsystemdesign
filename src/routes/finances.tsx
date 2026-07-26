import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";
import { Download, Info, Plus } from "lucide-react";

export const Route = createFileRoute("/finances")({
  head: () => ({
    meta: [
      { title: "Finances — Pawline" },
      { name: "description", content: "Operational estimate: income, expenses and profit for the shop." },
      { property: "og:title", content: "Finances — Pawline" },
      { property: "og:description", content: "Not formal accounting — an operational P&L for the period." },
    ],
  }),
  component: FinancesPage,
});

function FinancesPage() {
  return (
    <AppShell
      title="Finances"
      subtitle="October 2026"
      actions={
        <button className="h-10 px-5 rounded-2xl bg-accent text-accent-foreground text-sm font-bold flex items-center gap-2 shadow-sm">
          <Download className="size-4" /> Export PDF
        </button>
      }
    >
      <div className="flex-1 overflow-y-auto px-10 pb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1 bg-card ring-1 ring-black/5 rounded-2xl p-1">
            {["Week", "Month", "Quarter", "Year", "Custom"].map((p, i) => (
              <button
                key={p}
                className={
                  "px-4 h-9 rounded-xl text-xs font-semibold " +
                  (i === 1 ? "bg-ink text-background" : "text-ink-muted hover:text-ink")
                }
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-full font-bold uppercase tracking-widest">
            <Info className="size-3.5" /> Operational estimate — not formal accounting
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <BigStat label="Income" value="€28,412" hint="+8% vs Sep" tone="primary" />
          <BigStat label="Expenses" value="€19,204" hint="wages · rent · supplies" />
          <BigStat label="Est. Profit" value="€9,208" hint="32% margin" tone="accent" />
        </div>

        <div className="grid grid-cols-[1.4fr_1fr] gap-6">
          <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-ink-muted">Income by source</h3>
              <span className="text-xs text-ink-muted">242 checkouts · 68 product sales</span>
            </div>
            <div className="space-y-4">
              <SourceRow label="Grooming — Full grooms" value="€18,240" pct={64} />
              <SourceRow label="Grooming — Add-ons (nails, deshed…)" value="€6,120" pct={22} />
              <SourceRow label="Retail product sales" value="€2,842" pct={10} />
              <SourceRow label="Special orders" value="€1,210" pct={4} />
            </div>
          </div>

          <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-ink-muted">Expenses</h3>
              <button className="text-xs font-bold text-primary flex items-center gap-1"><Plus className="size-3.5" /> Add</button>
            </div>
            <ul className="divide-y divide-border">
              {[
                { l: "Wages (est.)", v: "€11,420", note: "3 workers, punched hours" },
                { l: "Rent", v: "€2,400", note: "recurring" },
                { l: "Supplies restock", v: "€3,120", note: "Oat shampoo, blades…" },
                { l: "Utilities", v: "€712", note: "recurring" },
                { l: "Loan repayment", v: "€1,152", note: "recurring" },
                { l: "Van maintenance", v: "€400", note: "one-off · Oct 12" },
              ].map((e) => (
                <li key={e.l} className="flex items-start justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{e.l}</p>
                    <p className="text-[11px] text-ink-muted">{e.note}</p>
                  </div>
                  <span className="font-mono text-sm text-ink">{e.v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-[11px] text-ink-muted italic mt-6 max-w-2xl">
          Wage figures are calculated from accepted punches, minus unpaid breaks, at each worker's effective hourly rate — for operational planning only. Send the exported PDF to your accountant for formal reporting.
        </p>
      </div>
    </AppShell>
  );
}

function BigStat({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: "primary" | "accent" }) {
  const bg = tone === "primary" ? "bg-primary text-primary-foreground" : tone === "accent" ? "bg-ink text-background" : "bg-card text-ink ring-1 ring-black/5";
  return (
    <div className={"rounded-3xl p-6 shadow-sm " + bg}>
      <p className={"text-[10px] uppercase tracking-widest " + (tone ? "opacity-70" : "text-ink-muted")}>{label}</p>
      <p className="text-4xl font-mono font-medium mt-3 leading-none">{value}</p>
      <p className={"text-[11px] mt-3 " + (tone ? "opacity-60" : "text-ink-muted")}>{hint}</p>
    </div>
  );
}

function SourceRow({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-ink">{label}</span>
        <span className="font-mono text-ink">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
