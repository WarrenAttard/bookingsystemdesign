import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";
import { Coffee, LogIn, LogOut, MapPin } from "lucide-react";

export const Route = createFileRoute("/punch")({
  head: () => ({
    meta: [
      { title: "Punch — Pawline" },
      { name: "description", content: "Kiosk clock-in / clock-out for the shop floor." },
      { property: "og:title", content: "Punch — Pawline" },
      { property: "og:description", content: "PIN-based kiosk time clock, tablet-friendly." },
    ],
  }),
  component: PunchPage,
});

function PunchPage() {
  return (
    <AppShell title="Kiosk" subtitle="Shop floor time clock">
      <div className="flex-1 overflow-hidden px-10 pb-10">
        <div className="h-full grid grid-cols-[1.2fr_1fr] gap-6">
          {/* Kiosk keypad */}
          <div className="bg-ink text-background rounded-3xl p-10 flex flex-col shadow-xl shadow-ink/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-60">Pawline Kiosk</p>
                <p className="text-4xl font-mono font-medium mt-2">10:42</p>
                <p className="text-sm opacity-70 mt-1">Wednesday, October 24</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-70">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                Ready for PIN
              </div>
            </div>

            <div className="flex-1 grid place-items-center">
              <div className="w-full max-w-sm">
                <div className="flex justify-center gap-3 mb-8">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={
                        "size-4 rounded-full " +
                        (i < 2 ? "bg-primary" : "bg-white/15")
                      }
                    />
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <button
                      key={n}
                      className="h-20 rounded-2xl bg-white/8 hover:bg-white/15 text-2xl font-mono font-medium transition-colors active:scale-95"
                    >
                      {n}
                    </button>
                  ))}
                  <button className="h-20 rounded-2xl bg-white/5 text-xs font-bold uppercase tracking-widest opacity-70">
                    Clear
                  </button>
                  <button className="h-20 rounded-2xl bg-white/8 hover:bg-white/15 text-2xl font-mono font-medium">
                    0
                  </button>
                  <button className="h-20 rounded-2xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest">
                    Enter
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-center opacity-50">
              Location is captured only at punch, with your consent. Not tracked in the background.
            </p>
          </div>

          {/* Personal + activity */}
          <div className="flex flex-col gap-6 min-h-0">
            <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-12 rounded-2xl bg-gradient-to-br from-primary/40 to-accent/30 ring-1 ring-black/5 flex items-center justify-center text-sm font-bold text-ink">MR</div>
                <div>
                  <p className="text-sm font-bold text-ink">Maria Rossi</p>
                  <p className="text-xs text-ink-muted">On shift · started 08:02</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button className="h-16 rounded-2xl bg-primary text-primary-foreground text-xs font-bold flex flex-col items-center justify-center gap-1">
                  <LogIn className="size-4" />
                  Punch in
                </button>
                <button className="h-16 rounded-2xl bg-accent/15 text-accent text-xs font-bold flex flex-col items-center justify-center gap-1">
                  <Coffee className="size-4" />
                  Break
                </button>
                <button className="h-16 rounded-2xl bg-secondary text-ink text-xs font-bold flex flex-col items-center justify-center gap-1">
                  <LogOut className="size-4" />
                  Punch out
                </button>
              </div>
              <p className="mt-4 text-[11px] text-ink-muted flex items-center gap-1.5">
                <MapPin className="size-3" /> Location will be captured at the moment of punch.
              </p>
            </div>

            <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-6 flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-bold uppercase tracking-widest text-ink-muted mb-4">
                Today's punches
              </h3>
              <ul className="divide-y divide-border overflow-y-auto">
                {[
                  { t: "10:32", who: "Jonas T.", type: "Break end", icon: Coffee },
                  { t: "10:15", who: "Jonas T.", type: "Break start", icon: Coffee },
                  { t: "09:58", who: "Alex S.", type: "Punch in", icon: LogIn, corr: true },
                  { t: "08:03", who: "Jonas T.", type: "Punch in", icon: LogIn },
                  { t: "08:02", who: "Maria R.", type: "Punch in", icon: LogIn },
                  { t: "07:58", who: "Alex S.", type: "Punch in", icon: LogIn },
                ].map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <li key={i} className="flex items-center gap-3 py-3">
                      <span className="font-mono text-xs text-ink-muted w-12">{p.t}</span>
                      <Icon className="size-4 text-ink-muted" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink">{p.who}</p>
                        <p className="text-[11px] text-ink-muted">{p.type}</p>
                      </div>
                      {p.corr && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/12 px-2 py-0.5 rounded-md">
                          Corrected
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
