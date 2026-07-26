import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";
import { Info, Plus } from "lucide-react";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "My Profile — Pawline" },
      { name: "description", content: "Your hours, estimated pay, and leave balance." },
      { property: "og:title", content: "My Profile — Pawline" },
      { property: "og:description", content: "Employee self-service view of hours and leave." },
    ],
  }),
  component: MePage,
});

function MePage() {
  return (
    <AppShell title="My Profile" subtitle="This month" role="Employee">
      <div className="flex-1 overflow-y-auto px-10 pb-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-8">
            <div className="flex items-center gap-5">
              <div className="size-20 rounded-3xl bg-gradient-to-br from-primary/40 to-accent/30 ring-1 ring-black/5 flex items-center justify-center text-2xl font-bold text-ink">MR</div>
              <div>
                <h2 className="text-2xl font-semibold text-ink tracking-tight">Maria Rossi</h2>
                <p className="text-sm text-ink-muted mt-1">Groomer · with Pawline since Sep 2024</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <MetricCard label="Hours this week" value="26.5" hint="of 32h scheduled" />
            <MetricCard label="Hours this month" value="112.0" hint="Oct 1 – 24" />
            <MetricCard label="Hours this year" value="1,204" hint="2026 YTD" />
          </div>

          <div className="bg-ink text-background rounded-3xl p-6 shadow-lg shadow-ink/10">
            <div className="flex items-center gap-2 opacity-70 text-[10px] uppercase tracking-widest font-bold">
              <Info className="size-3.5" />
              Estimated earnings — not a payslip
            </div>
            <div className="mt-5 grid grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-60">This week</p>
                <p className="text-3xl font-mono font-medium mt-1">€318.00</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-60">This month</p>
                <p className="text-3xl font-mono font-medium mt-1">€1,344.00</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-60">Year to date</p>
                <p className="text-3xl font-mono font-medium mt-1">€14,448</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-ink-muted">Time off</h3>
              <button className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5">
                <Plus className="size-3.5" /> Request leave
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
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
                      (l.status === "Pending"
                        ? "bg-accent/12 text-accent"
                        : "bg-primary/12 text-primary")
                    }
                  >
                    {l.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
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

function MiniStat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "accent" }) {
  return (
    <div className={"rounded-2xl p-4 " + (tone === "accent" ? "bg-accent/10" : "bg-secondary/50")}>
      <p className="text-[10px] uppercase tracking-widest text-ink-muted">{label}</p>
      <p className={"text-xl font-mono mt-1 " + (tone === "accent" ? "text-accent font-bold" : "text-ink")}>{value}</p>
    </div>
  );
}
