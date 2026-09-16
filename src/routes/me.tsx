import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/dashboard/AppShell";
import {
  Info,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  PiggyBank,
  Users,
  Scissors,
  Crown,
  UserRound,
} from "lucide-react";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "My Profile — Pawline" },
      {
        name: "description",
        content:
          "Your hours, estimated pay and leave — or, for owners, profit, payroll and margin at a glance.",
      },
      { property: "og:title", content: "My Profile — Pawline" },
      {
        property: "og:description",
        content: "Personal view for groomers and an owner view with profit and payroll.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MePage,
});

type View = "owner" | "employee";

function MePage() {
  const [view, setView] = useState<View>("owner");

  return (
    <AppShell
      title="My Profile"
      subtitle="This month"
      role={view === "owner" ? "Admin" : "Employee"}
      actions={<ViewSwitch view={view} onChange={setView} />}
    >
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 pb-6 lg:pb-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="sm:hidden">
            <ViewSwitch view={view} onChange={setView} />
          </div>
          {view === "owner" ? <OwnerView /> : <EmployeeView />}
        </div>
      </div>
    </AppShell>
  );
}

function ViewSwitch({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Profile view"
      className="inline-flex p-1 rounded-2xl bg-secondary/60 ring-1 ring-black/5"
    >
      {(
        [
          { id: "owner" as const, label: "Owner", Icon: Crown },
          { id: "employee" as const, label: "Groomer", Icon: UserRound },
        ]
      ).map(({ id, label, Icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={view === id}
          onClick={() => onChange(id)}
          className={
            "h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors " +
            (view === id
              ? "bg-card text-ink shadow-sm ring-1 ring-black/5"
              : "text-ink-muted hover:text-ink")
          }
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------- OWNER ---------------------------- */

const MONTHS = [
  { m: "Apr", rev: 14200, cost: 9800 },
  { m: "May", rev: 15600, cost: 10200 },
  { m: "Jun", rev: 17100, cost: 11050 },
  { m: "Jul", rev: 18450, cost: 11400 },
  { m: "Aug", rev: 16980, cost: 11120 },
  { m: "Sep", rev: 19240, cost: 11860 },
];

function OwnerView() {
  const peak = Math.max(...MONTHS.map((x) => x.rev));
  const cur = MONTHS[MONTHS.length - 1];
  const prev = MONTHS[MONTHS.length - 2];
  const profit = cur.rev - cur.cost;
  const prevProfit = prev.rev - prev.cost;
  const delta = ((profit - prevProfit) / prevProfit) * 100;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-8">
        <div className="flex items-center gap-5">
          <div className="size-20 rounded-3xl bg-gradient-to-br from-primary/50 to-accent/30 ring-1 ring-black/5 flex items-center justify-center text-2xl font-bold text-ink">
            AS
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-ink tracking-tight">Alex Sterling</h2>
            <p className="text-sm text-ink-muted mt-1">Owner · Trusted Dog Groomers</p>
          </div>
        </div>
      </div>

      <div className="bg-ink text-background rounded-3xl p-6 sm:p-8 shadow-lg shadow-ink/10">
        <div className="flex items-center gap-2 opacity-70 text-[10px] uppercase tracking-widest font-bold">
          <PiggyBank className="size-3.5" />
          Net profit — September
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <p className="text-5xl font-mono font-medium leading-none">
            €{profit.toLocaleString()}
          </p>
          <span
            className={
              "inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg " +
              (delta >= 0 ? "bg-primary/25 text-background" : "bg-destructive/30 text-background")
            }
          >
            {delta >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)}% vs Aug
          </span>
        </div>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-5">
          <DarkStat label="Revenue" value={`€${cur.rev.toLocaleString()}`} />
          <DarkStat label="Costs" value={`€${cur.cost.toLocaleString()}`} />
          <DarkStat label="Margin" value={`${((profit / cur.rev) * 100).toFixed(0)}%`} />
          <DarkStat label="Owner draw" value="€2,400" />
        </div>
      </div>

      <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-ink-muted">
          Revenue vs profit — last 6 months
        </h3>
        <div className="mt-6 flex items-end gap-3 sm:gap-5 h-44">
          {MONTHS.map((x) => {
            const p = x.rev - x.cost;
            return (
              <div key={x.m} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                <div className="w-full flex-1 flex items-end gap-1">
                  <div
                    className="flex-1 rounded-t-lg bg-secondary"
                    style={{ height: `${(x.rev / peak) * 100}%` }}
                    title={`Revenue €${x.rev.toLocaleString()}`}
                  />
                  <div
                    className="flex-1 rounded-t-lg bg-primary"
                    style={{ height: `${(p / peak) * 100}%` }}
                    title={`Profit €${p.toLocaleString()}`}
                  />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-ink-muted">{x.m}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-5 text-[11px] text-ink-muted">
          <span className="flex items-center gap-1.5">
            <i className="size-2.5 rounded-sm bg-secondary" /> Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <i className="size-2.5 rounded-sm bg-primary" /> Profit
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <OwnerMetric Icon={Wallet} label="Payroll this month" value="€7,980" hint="3 groomers · 512h" />
        <OwnerMetric Icon={Receipt} label="Supplies & rent" value="€3,880" hint="Stock €1,340" />
        <OwnerMetric Icon={Scissors} label="Grooms completed" value="248" hint="Avg ticket €77.60" />
      </div>

      <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-ink-muted mb-4">
          Where the money came from
        </h3>
        <ul className="space-y-4">
          {[
            { label: "Grooming services", amount: 15420, share: 80 },
            { label: "Retail & products", amount: 2360, share: 12 },
            { label: "Add-ons (nails, teeth)", amount: 1460, share: 8 },
          ].map((s) => (
            <li key={s.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-ink">{s.label}</span>
                <span className="font-mono text-ink">€{s.amount.toLocaleString()}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-secondary/70 overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${s.share}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="size-4 text-ink-muted" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-ink-muted">
            Team contribution
          </h3>
        </div>
        <ul className="divide-y divide-border">
          {[
            { n: "Alex Sterling", g: 96, rev: 7420, cost: 0 },
            { n: "Maria Rossi", g: 88, rev: 6810, cost: 2660 },
            { n: "Jonas Vella", g: 64, rev: 5010, cost: 1980 },
          ].map((w) => (
            <li key={w.n} className="flex items-center justify-between py-3 gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-ink text-sm truncate">{w.n}</p>
                <p className="text-xs text-ink-muted">{w.g} grooms · wages €{w.cost.toLocaleString()}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-ink">€{w.rev.toLocaleString()}</p>
                <p className="text-[10px] uppercase tracking-widest text-ink-muted">Revenue</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DarkStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest opacity-60">{label}</p>
      <p className="text-2xl font-mono font-medium mt-1">{value}</p>
    </div>
  );
}

function OwnerMetric({
  Icon,
  label,
  value,
  hint,
}: {
  Icon: typeof Wallet;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-5">
      <div className="flex items-center gap-2 text-ink-muted">
        <Icon className="size-4" />
        <p className="text-[10px] uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-3xl font-mono font-medium text-ink mt-2 leading-none">{value}</p>
      <p className="text-[11px] text-ink-muted mt-2">{hint}</p>
    </div>
  );
}

/* --------------------------- EMPLOYEE --------------------------- */

function EmployeeView() {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-8">
        <div className="flex items-center gap-5">
          <div className="size-20 rounded-3xl bg-gradient-to-br from-primary/40 to-accent/30 ring-1 ring-black/5 flex items-center justify-center text-2xl font-bold text-ink">
            MR
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-ink tracking-tight">Maria Rossi</h2>
            <p className="text-sm text-ink-muted mt-1">Groomer · with Pawline since Sep 2024</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Hours this week" value="26.5" hint="of 32h scheduled" />
        <MetricCard label="Hours this month" value="112.0" hint="Sep 1 – 24" />
        <MetricCard label="Hours this year" value="1,204" hint="2026 YTD" />
      </div>

      <div className="bg-ink text-background rounded-3xl p-6 shadow-lg shadow-ink/10">
        <div className="flex items-center gap-2 opacity-70 text-[10px] uppercase tracking-widest font-bold">
          <Info className="size-3.5" />
          Estimated earnings — not a payslip
        </div>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <DarkStat label="This week" value="€318.00" />
          <DarkStat label="This month" value="€1,344.00" />
          <DarkStat label="Year to date" value="€14,448" />
        </div>
      </div>

      <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-ink-muted">Time off</h3>
          <button className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5">
            <Plus className="size-3.5" /> Request leave
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <MiniStat label="Balance" value="14.5d" />
          <MiniStat label="Used YTD" value="7.5d" />
          <MiniStat label="Pending" value="2.0d" tone="accent" />
        </div>
        <ul className="divide-y divide-border">
          {[
            { d: "Nov 5–6", type: "Annual leave", status: "Pending" },
            { d: "Oct 12", type: "Sick day", status: "Approved" },
            { d: "Sep 20–22", type: "Annual leave", status: "Approved" },
          ].map((l) => (
            <li key={l.d} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-semibold text-ink">{l.d}</p>
                <p className="text-xs text-ink-muted">{l.type}</p>
              </div>
              <span
                className={
                  "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md " +
                  (l.status === "Pending" ? "bg-accent/12 text-accent" : "bg-primary/12 text-primary")
                }
              >
                {l.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-5">
      <p className="text-[10px] uppercase tracking-widest text-ink-muted">{label}</p>
      <p className="text-3xl font-mono font-medium text-ink mt-2 leading-none">{value}</p>
      <p className="text-[11px] text-ink-muted mt-2">{hint}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "accent";
}) {
  return (
    <div className={"rounded-2xl p-4 " + (tone === "accent" ? "bg-accent/10" : "bg-secondary/50")}>
      <p className="text-[10px] uppercase tracking-widest text-ink-muted">{label}</p>
      <p className={"text-xl font-mono mt-1 " + (tone === "accent" ? "text-accent font-bold" : "text-ink")}>
        {value}
      </p>
    </div>
  );
}
