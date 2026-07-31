import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";
import { AlertTriangle, ChevronLeft, ChevronRight, Plus } from "lucide-react";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Pawline" },
      { name: "description", content: "Book and manage grooming appointments across the day." },
      { property: "og:title", content: "Calendar — Pawline" },
      { property: "og:description", content: "Day and week grid for staff to schedule grooms." },
    ],
  }),
  component: CalendarPage,
});

const hours = Array.from({ length: 10 }, (_, i) => 8 + i);
const groomers = ["Alex", "Maria", "Jonas"];

type Appt = {
  groomer: string;
  start: number; // hour offset from 8
  span: number; // hours
  dog: string;
  breed: string;
  stage: string;
  tone: "primary" | "accent" | "muted";
  warn?: boolean;
};

const appts: Appt[] = [
  { groomer: "Alex", start: 1, span: 1.5, dog: "Bear", breed: "Goldendoodle", stage: "Wash + Cut", tone: "primary", warn: true },
  { groomer: "Alex", start: 3, span: 2, dog: "Coco", breed: "Toy Poodle", stage: "Full groom", tone: "accent", warn: true },
  { groomer: "Alex", start: 6, span: 1, dog: "Milo", breed: "Cavalier", stage: "Nails + Bath", tone: "muted" },
  { groomer: "Maria", start: 0, span: 2, dog: "Oliver", breed: "Beagle", stage: "Deshedding", tone: "primary" },
  { groomer: "Maria", start: 2.5, span: 1.5, dog: "Luna", breed: "Husky", stage: "Wash + Dry", tone: "muted" },
  { groomer: "Maria", start: 5, span: 2, dog: "Pepper", breed: "Schnauzer", stage: "Cut + Beard", tone: "primary" },
  { groomer: "Jonas", start: 1, span: 2.5, dog: "Daisy", breed: "Maltipoo", stage: "Dematting", tone: "accent" },
  { groomer: "Jonas", start: 4.5, span: 1.5, dog: "Nala", breed: "Cocker", stage: "Bath + Ears", tone: "muted" },
];

const toneClass: Record<Appt["tone"], string> = {
  primary: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
  muted: "bg-card text-ink ring-1 ring-black/5",
};

function CalendarPage() {
  return (
    <AppShell
      title="Calendar"
      subtitle="Wednesday, Oct 24"
      actions={
        <div className="flex items-center gap-1 bg-card ring-1 ring-black/5 rounded-2xl p-1">
          <button className="px-3 h-9 rounded-xl bg-ink text-background text-xs font-semibold">Day</button>
          <button className="px-3 h-9 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink">Week</button>
        </div>
      }
    >
      <div className="px-4 sm:px-6 lg:px-10 pb-4 flex flex-wrap items-center gap-3 justify-between flex-none">
        <div className="flex items-center gap-2">
          <button className="size-10 rounded-xl bg-card ring-1 ring-black/5 flex items-center justify-center text-ink-muted hover:text-ink">
            <ChevronLeft className="size-4" />
          </button>
          <button className="h-10 px-4 rounded-xl bg-card ring-1 ring-black/5 text-sm font-medium">Today</button>
          <button className="size-10 rounded-xl bg-card ring-1 ring-black/5 flex items-center justify-center text-ink-muted hover:text-ink">
            <ChevronRight className="size-4" />
          </button>
          <span className="hidden sm:inline ml-3 text-sm text-ink-muted">3 groomers on the floor · 24 of 28 slots</span>
        </div>
        <button className="h-10 px-5 rounded-2xl bg-accent text-accent-foreground text-sm font-bold flex items-center gap-2 shadow-sm">
          <Plus className="size-4" /> New appointment
        </button>
      </div>

      <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-10 pb-6 lg:pb-10">
        <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-4 sm:p-6 min-w-[640px]">
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "80px repeat(3, minmax(0, 1fr))" }}
          >
            <div />
            {groomers.map((g) => (
              <div key={g} className="px-3 py-2">
                <p className="text-sm font-bold text-ink">{g}</p>
                <p className="text-[11px] text-ink-muted uppercase tracking-wider">
                  Station {groomers.indexOf(g) + 1}
                </p>
              </div>
            ))}

            {hours.map((h) => (
              <>
                <div key={`h-${h}`} className="text-[11px] font-mono text-ink-muted pt-2 pr-2 text-right">
                  {String(h).padStart(2, "0")}:00
                </div>
                {groomers.map((g) => {
                  const isClosed = h >= 17;
                  return (
                    <div
                      key={`${g}-${h}`}
                      className={
                        "relative h-16 rounded-xl " +
                        (isClosed
                          ? "bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,var(--color-border)_6px,var(--color-border)_7px)]"
                          : "bg-secondary/40")
                      }
                    >
                      {appts
                        .filter((a) => a.groomer === g && Math.floor(a.start + 8) === h)
                        .map((a) => (
                          <div
                            key={a.dog}
                            className={
                              "absolute left-1 right-1 top-1 rounded-xl px-3 py-2 shadow-sm " +
                              toneClass[a.tone]
                            }
                            style={{ height: `${a.span * 64 - 8}px` }}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold leading-none">{a.dog}</p>
                              {a.warn && (
                                <AlertTriangle className="size-3.5" strokeWidth={2.5} />
                              )}
                            </div>
                            <p className="text-[11px] opacity-80 mt-1">{a.breed}</p>
                            <p className="text-[10px] font-mono opacity-80 mt-1 uppercase tracking-wider">
                              {a.stage}
                            </p>
                          </div>
                        ))}
                    </div>
                  );
                })}
              </>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-ink-muted">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-primary" /> Assigned</span>
              <span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-accent" /> Safety flag</span>
              <span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-secondary ring-1 ring-black/10" /> Open slot</span>
              <span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,var(--color-border)_2px,var(--color-border)_3px)] ring-1 ring-black/10" /> Closed</span>
            </div>
            <button className="text-ink font-semibold hover:underline">Add to waitlist →</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
