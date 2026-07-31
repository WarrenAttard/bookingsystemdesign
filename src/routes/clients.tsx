import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";
import { AlertTriangle, Heart, Mail, Phone, Plus, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/clients")({
  head: () => ({
    meta: [
      { title: "Clients — Pawline" },
      { name: "description", content: "Client contacts, their pets, and grooming history." },
      { property: "og:title", content: "Clients — Pawline" },
      { property: "og:description", content: "Search and maintain client and pet records." },
    ],
  }),
  component: ClientsPage,
});

const clients = [
  { name: "Sarah Mifsud", pets: 2, phone: "+356 7943 1120", last: "Oct 18", flag: true, initials: "SM", active: true },
  { name: "Kevin Laine", pets: 1, phone: "+356 7743 2210", last: "Oct 10", initials: "KL" },
  { name: "Janet Debono", pets: 1, phone: "+356 9932 8811", last: "Oct 22", flag: true, initials: "JD" },
  { name: "Sam Rausi", pets: 3, phone: "+356 7712 4499", last: "Sep 30", initials: "SR" },
  { name: "Priya Nair", pets: 1, phone: "+356 9911 2233", last: "Sep 24", initials: "PN" },
  { name: "Tom Grech", pets: 2, phone: "+356 7799 8811", last: "Oct 04", initials: "TG" },
  { name: "Lena Vella", pets: 1, phone: "+356 7920 1010", last: "Oct 20", initials: "LV" },
];

function ClientsPage() {
  return (
    <AppShell
      title="Clients"
      subtitle="242 households"
      actions={
        <button className="h-10 px-5 rounded-2xl bg-accent text-accent-foreground text-sm font-bold flex items-center gap-2 shadow-sm">
          <Plus className="size-4" /> New client
        </button>
      }
    >
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 px-4 sm:px-6 lg:px-10 pb-6 lg:pb-10 min-h-0">
        {/* List */}
        <aside className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm flex flex-col min-h-0">
          <div className="p-4 border-b border-border">
            <input
              placeholder="Search by name, phone, dog…"
              className="w-full h-11 px-4 rounded-xl bg-secondary/60 text-sm placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <ul className="overflow-y-auto flex-1 divide-y divide-border">
            {clients.map((c) => (
              <li key={c.name}>
                <button
                  className={
                    "w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/40 transition-colors " +
                    (c.active ? "bg-secondary/60" : "")
                  }
                >
                  <div className="size-10 rounded-xl bg-gradient-to-br from-primary/25 to-accent/25 ring-1 ring-black/5 flex items-center justify-center text-xs font-bold text-ink">
                    {c.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink truncate">{c.name}</p>
                      {c.flag && <ShieldAlert className="size-3.5 text-accent" />}
                    </div>
                    <p className="text-xs text-ink-muted truncate">
                      {c.pets} pet{c.pets > 1 ? "s" : ""} · {c.phone}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-ink-muted">{c.last}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Detail */}
        <section className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm overflow-y-auto">
          <div className="p-8 border-b border-border flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-2xl bg-gradient-to-br from-primary/40 to-accent/30 ring-1 ring-black/5 flex items-center justify-center text-lg font-bold text-ink">
                SM
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-ink tracking-tight">Sarah Mifsud</h2>
                <p className="text-sm text-ink-muted mt-1">Client since March 2023 · 18 visits</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-ink">
                  <span className="flex items-center gap-2"><Phone className="size-3.5 text-ink-muted" /> +356 7943 1120</span>
                  <span className="flex items-center gap-2"><Mail className="size-3.5 text-ink-muted" /> sarah.mifsud@example.mt</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-ink-muted">Lifetime revenue</p>
              <p className="text-2xl font-mono font-medium text-ink mt-1">€1,246.00</p>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Pets */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-ink-muted">Pets</h3>
                <button className="text-xs font-semibold text-primary hover:underline">Add pet</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PetCard
                  name="Bear"
                  breed="Goldendoodle · 4y"
                  flags={[{ icon: AlertTriangle, label: "Chicken allergy" }, { icon: Heart, label: "Sensitive skin" }]}
                  vax="Vaccinated · exp. Feb 2027"
                />
                <PetCard
                  name="Tilly"
                  breed="Border Terrier · 2y"
                  flags={[]}
                  vax="Vaccinated · exp. Aug 2027"
                />
              </div>
            </div>

            {/* Warning card */}
            <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex gap-3">
              <ShieldAlert className="size-5 text-accent shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-ink">Safety-critical note</p>
                <p className="text-ink-muted mt-1">
                  Bear reacts to chicken-based shampoos. Always use the oat-based line. Owner prefers early-morning appointments (calmer waiting area).
                </p>
              </div>
            </div>

            {/* History */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-ink-muted mb-3">Recent history</h3>
              <div className="divide-y divide-border rounded-2xl ring-1 ring-black/5">
                {[
                  { date: "Oct 18", pet: "Bear", service: "Full groom + nails", price: "€78.00", groomer: "Alex" },
                  { date: "Sep 26", pet: "Tilly", service: "Bath + deshedding", price: "€52.00", groomer: "Maria" },
                  { date: "Sep 04", pet: "Bear", service: "Cut + ears", price: "€64.00", groomer: "Alex" },
                  { date: "Aug 12", pet: "Bear", service: "Full groom", price: "€72.00", groomer: "Jonas" },
                ].map((h) => (
                  <div key={h.date} className="grid grid-cols-[80px_1fr_120px_100px] items-center px-4 py-3 text-sm">
                    <span className="font-mono text-xs text-ink-muted">{h.date}</span>
                    <div>
                      <p className="font-semibold text-ink">{h.pet}</p>
                      <p className="text-xs text-ink-muted">{h.service}</p>
                    </div>
                    <span className="text-xs text-ink-muted">by {h.groomer}</span>
                    <span className="text-right font-mono font-medium text-ink">{h.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function PetCard({
  name,
  breed,
  flags,
  vax,
}: {
  name: string;
  breed: string;
  flags: { icon: typeof AlertTriangle; label: string }[];
  vax: string;
}) {
  return (
    <div className="rounded-2xl ring-1 ring-black/5 p-5 bg-secondary/30">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-bold text-ink leading-none">{name}</p>
          <p className="text-sm text-ink-muted mt-1">{breed}</p>
        </div>
        <button className="text-xs text-primary font-semibold hover:underline">Book</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {flags.map((f) => (
          <span key={f.label} className="bg-accent/12 text-accent px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
            <f.icon className="size-3" strokeWidth={2.5} />
            {f.label}
          </span>
        ))}
      </div>
      <p className="text-[10px] uppercase tracking-widest text-ink-muted mt-3">{vax}</p>
    </div>
  );
}
