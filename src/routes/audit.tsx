import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";
import { Clock, DollarSign, Package, ScrollText, ShieldAlert, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Trail — Pawline" },
      { name: "description", content: "Immutable log of overrides, corrections and sensitive changes." },
      { property: "og:title", content: "Audit Trail — Pawline" },
      { property: "og:description", content: "Evidence log for admin corrections and overrides." },
    ],
  }),
  component: AuditPage,
});

type Entry = {
  when: string;
  actor: string;
  action: string;
  entity: string;
  reason: string;
  icon: LucideIcon;
  tag: "checkout" | "punch" | "timetable" | "stock" | "finance";
};

const tagStyle: Record<Entry["tag"], string> = {
  checkout: "bg-primary/12 text-primary",
  punch: "bg-accent/12 text-accent",
  timetable: "bg-[var(--status-booked)]/20 text-[var(--status-booked)]",
  stock: "bg-secondary text-ink",
  finance: "bg-ink text-background",
};

const entries: Entry[] = [
  { when: "Oct 24 · 10:12", actor: "Alex Sterling", action: "Checkout price corrected", entity: "Appt #4821 · Coco (Toy Poodle)", reason: "Client agreed reduced price after nail chip repair.", icon: DollarSign, tag: "checkout" },
  { when: "Oct 24 · 09:04", actor: "Alex Sterling", action: "Punch corrected", entity: "Maria Rossi · Oct 23 punch-out", reason: "Forgot to punch out — corrected to 17:30.", icon: Clock, tag: "punch" },
  { when: "Oct 23 · 18:40", actor: "Alex Sterling", action: "Timetable override", entity: "Jonas Tabone · Wed shift", reason: "Locked to cover uncovered afternoon.", icon: ScrollText, tag: "timetable" },
  { when: "Oct 23 · 14:22", actor: "Alex Sterling", action: "Stock correction", entity: "Oat Shampoo 500ml", reason: "Miscount during weekly audit — reduced by 1.", icon: Package, tag: "stock" },
  { when: "Oct 22 · 16:10", actor: "Alex Sterling", action: "Finance reversal", entity: "Expense · Van maintenance", reason: "Duplicate entry — reversed and re-added correctly.", icon: DollarSign, tag: "finance" },
  { when: "Oct 21 · 11:05", actor: "Alex Sterling", action: "Checkout summary edited", entity: "Appt #4796 · Bear (Goldendoodle)", reason: "Added deshedding line missed at checkout.", icon: DollarSign, tag: "checkout" },
];

function AuditPage() {
  return (
    <AppShell title="Audit Trail" subtitle="Sensitive changes only">
      <div className="flex-1 overflow-y-auto px-10 pb-10">
        <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-4 gap-3">
            <FilterInput label="Actor" placeholder="Any user" icon={User} />
            <FilterInput label="Action" placeholder="Any action" icon={ShieldAlert} />
            <FilterInput label="Entity" placeholder="Client, dog, product…" icon={ScrollText} />
            <FilterInput label="Date" placeholder="Oct 1 – Oct 24" icon={Clock} />
          </div>
        </div>

        <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink">142 audited events this month</h3>
              <p className="text-xs text-ink-muted">This log records corrections, overrides and sensitive changes only — not routine activity.</p>
            </div>
            <button className="text-xs font-semibold text-primary hover:underline">Export CSV →</button>
          </div>

          <ul className="divide-y divide-border">
            {entries.map((e, i) => {
              const Icon = e.icon;
              return (
                <li key={i} className="px-6 py-4 flex items-start gap-4 hover:bg-secondary/30 transition-colors">
                  <div className="size-10 rounded-xl bg-secondary/70 flex items-center justify-center text-ink-muted shrink-0">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-ink">{e.action}</p>
                      <span className={"text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md " + tagStyle[e.tag]}>
                        {e.tag}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">{e.entity}</p>
                    <p className="text-sm text-ink mt-2 italic">"{e.reason}"</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono text-ink-muted">{e.when}</p>
                    <p className="text-[11px] text-ink mt-1">by {e.actor}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

function FilterInput({ label, placeholder, icon: Icon }: { label: string; placeholder: string; icon: LucideIcon }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest font-bold text-ink-muted">{label}</span>
      <div className="mt-1.5 h-11 rounded-xl bg-secondary/60 flex items-center gap-2 px-3">
        <Icon className="size-4 text-ink-muted" />
        <input placeholder={placeholder} className="flex-1 bg-transparent text-sm placeholder:text-ink-muted focus:outline-none" />
      </div>
    </label>
  );
}
