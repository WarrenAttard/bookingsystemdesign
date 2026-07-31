import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";
import { Lock, Plus } from "lucide-react";

export const Route = createFileRoute("/workers")({
  head: () => ({
    meta: [
      { title: "Workers — Pawline" },
      { name: "description", content: "Admin roster: manage groomers, wages, availability, and leave." },
      { property: "og:title", content: "Workers — Pawline" },
      { property: "og:description", content: "Staff roster with wages, availability and leave." },
    ],
  }),
  component: WorkersPage,
});

const workers = [
  { name: "Alex Sterling", role: "Lead Groomer", initials: "AS", status: "Active", hours: "38h / wk", wage: "€14.50", active: true },
  { name: "Maria Rossi", role: "Groomer", initials: "MR", status: "Active", hours: "32h / wk", wage: "€12.00" },
  { name: "Jonas Tabone", role: "Groomer", initials: "JT", status: "Active", hours: "24h / wk", wage: "€11.50" },
  { name: "Elena Camilleri", role: "Junior Groomer", initials: "EC", status: "On leave", hours: "—", wage: "€10.00" },
  { name: "David Xuereb", role: "Bather", initials: "DX", status: "Inactive", hours: "—", wage: "€9.50" },
];

function WorkersPage() {
  return (
    <AppShell
      title="Workers"
      subtitle="5 on roster"
      actions={
        <button className="h-10 px-5 rounded-2xl bg-accent text-accent-foreground text-sm font-bold flex items-center gap-2 shadow-sm">
          <Plus className="size-4" /> Add worker
        </button>
      }
    >
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 px-4 sm:px-6 lg:px-10 pb-6 lg:pb-10 min-h-0">
        <aside className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm overflow-y-auto">
          <ul className="divide-y divide-border">
            {workers.map((w) => (
              <li key={w.name}>
                <button
                  className={
                    "w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/40 transition-colors " +
                    (w.active ? "bg-secondary/60" : "")
                  }
                >
                  <div className="size-10 rounded-xl bg-gradient-to-br from-primary/25 to-accent/25 ring-1 ring-black/5 flex items-center justify-center text-xs font-bold text-ink">
                    {w.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{w.name}</p>
                    <p className="text-xs text-ink-muted truncate">{w.role}</p>
                  </div>
                  <span
                    className={
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md " +
                      (w.status === "Active"
                        ? "bg-primary/12 text-primary"
                        : w.status === "On leave"
                          ? "bg-accent/12 text-accent"
                          : "bg-black/5 text-ink-muted")
                    }
                  >
                    {w.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm overflow-y-auto">
          <div className="p-8 border-b border-border flex items-start gap-4">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-primary/40 to-accent/30 ring-1 ring-black/5 flex items-center justify-center text-lg font-bold text-ink">AS</div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-ink tracking-tight">Alex Sterling</h2>
              <p className="text-sm text-ink-muted mt-1">Lead Groomer · joined May 2022</p>
            </div>
            <button className="h-10 px-4 rounded-xl ring-1 ring-black/10 text-sm font-semibold text-ink hover:bg-secondary/40">
              Deactivate
            </button>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wage — sensitive */}
            <div className="rounded-2xl ring-1 ring-accent/25 bg-accent/5 p-5 col-span-2">
              <div className="flex items-center gap-2 text-accent text-[11px] uppercase tracking-widest font-bold">
                <Lock className="size-3.5" /> Admin-only · wage details
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-ink-muted">Current rate</p>
                  <p className="text-2xl font-mono font-medium text-ink mt-1">€14.50<span className="text-sm text-ink-muted"> / h</span></p>
                  <p className="text-[10px] text-ink-muted mt-1">Effective Jan 1, 2026</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-ink-muted">Previous rate</p>
                  <p className="text-lg font-mono text-ink mt-1">€13.00 / h</p>
                  <p className="text-[10px] text-ink-muted mt-1">Jun 2024 – Dec 2025</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-ink-muted">Est. weekly cost</p>
                  <p className="text-lg font-mono text-ink mt-1">€551.00</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl ring-1 ring-black/5 p-5">
              <h3 className="text-sm font-bold text-ink">Standard hours</h3>
              <div className="mt-3 space-y-2 text-sm">
                {[
                  ["Mon", "08:00 – 17:00"],
                  ["Tue", "08:00 – 17:00"],
                  ["Wed", "08:00 – 17:00"],
                  ["Thu", "10:00 – 19:00"],
                  ["Fri", "08:00 – 13:00"],
                  ["Sat", "Off"],
                  ["Sun", "Off"],
                ].map(([d, h]) => (
                  <div key={d} className="flex justify-between">
                    <span className="text-ink-muted">{d}</span>
                    <span className="font-mono text-ink">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl ring-1 ring-black/5 p-5">
              <h3 className="text-sm font-bold text-ink">Leave</h3>
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-ink-muted">Annual balance</span><span className="font-mono text-ink">18.5d</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Sick days used YTD</span><span className="font-mono text-ink">3d</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Next approved</span><span className="font-mono text-ink">Nov 12–15</span></div>
                <button className="mt-2 w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Log sick day</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
