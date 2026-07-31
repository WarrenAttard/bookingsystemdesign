import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";
import { AlertTriangle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/timetable")({
  head: () => ({
    meta: [
      { title: "Timetable — Pawline" },
      { name: "description", content: "Weekly staff rota, auto-generated and manually adjustable." },
      { property: "og:title", content: "Timetable — Pawline" },
      { property: "og:description", content: "Weekly schedule with locked overrides and uncovered warnings." },
    ],
  }),
  component: TimetablePage,
});

const days = ["Mon 21", "Tue 22", "Wed 23", "Thu 24", "Fri 25", "Sat 26", "Sun 27"];

type Cell = { text: string; type: "auto" | "locked" | "leave" | "empty" | "gap" };

const rows: { name: string; role: string; cells: Cell[] }[] = [
  { name: "Alex Sterling", role: "Lead", cells: [
    { text: "08–17", type: "auto" }, { text: "08–17", type: "auto" }, { text: "08–17", type: "locked" },
    { text: "10–19", type: "auto" }, { text: "08–13", type: "auto" }, { text: "Off", type: "empty" }, { text: "Off", type: "empty" },
  ]},
  { name: "Maria Rossi", role: "Groomer", cells: [
    { text: "09–17", type: "auto" }, { text: "09–17", type: "auto" }, { text: "09–17", type: "auto" },
    { text: "09–17", type: "auto" }, { text: "Off", type: "empty" }, { text: "09–14", type: "auto" }, { text: "Off", type: "empty" },
  ]},
  { name: "Jonas Tabone", role: "Groomer", cells: [
    { text: "10–18", type: "auto" }, { text: "10–18", type: "locked" }, { text: "Off", type: "empty" },
    { text: "10–18", type: "auto" }, { text: "10–18", type: "auto" }, { text: "10–15", type: "auto" }, { text: "Off", type: "empty" },
  ]},
  { name: "Elena Camilleri", role: "Junior", cells: [
    { text: "Leave", type: "leave" }, { text: "Leave", type: "leave" }, { text: "Leave", type: "leave" },
    { text: "Leave", type: "leave" }, { text: "10–15", type: "auto" }, { text: "Off", type: "empty" }, { text: "Off", type: "empty" },
  ]},
  { name: "Uncovered", role: "Warning", cells: [
    { text: "—", type: "gap" }, { text: "—", type: "gap" }, { text: "13–17", type: "gap" },
    { text: "—", type: "gap" }, { text: "—", type: "gap" }, { text: "—", type: "gap" }, { text: "All day", type: "gap" },
  ]},
];

function cellClass(t: Cell["type"]) {
  switch (t) {
    case "auto": return "bg-primary/10 text-primary ring-1 ring-primary/20";
    case "locked": return "bg-ink text-background";
    case "leave": return "bg-secondary text-ink-muted";
    case "gap": return "bg-accent/12 text-accent ring-1 ring-accent/25";
    default: return "bg-transparent text-ink-muted/60";
  }
}

function TimetablePage() {
  return (
    <AppShell
      title="Timetable"
      subtitle="Week of Oct 21"
      actions={
        <button className="h-10 px-5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 shadow-sm">
          <Sparkles className="size-4" /> Generate week
        </button>
      }
    >
      <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-10 pb-6 lg:pb-10">
        <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs">
              <Legend color="bg-primary/10 ring-1 ring-primary/20" label="Auto-generated" />
              <Legend color="bg-ink" label="Manually locked" tone="dark" />
              <Legend color="bg-secondary" label="Approved leave" />
              <Legend color="bg-accent/12 ring-1 ring-accent/25" label="Uncovered" tone="accent" />
            </div>
            <p className="text-xs text-ink-muted">
              <span className="text-accent font-bold">2 uncovered shifts</span> · re-generating preserves locked shifts.
            </p>
          </div>

          <div className="grid gap-2" style={{ gridTemplateColumns: "180px repeat(7, minmax(0, 1fr))" }}>
            <div />
            {days.map((d) => (
              <div key={d} className="text-[11px] font-bold uppercase tracking-widest text-ink-muted px-2 py-2">
                {d}
              </div>
            ))}
            {rows.map((r) => (
              <>
                <div key={r.name} className="py-3 px-2">
                  <p className={"text-sm font-semibold " + (r.role === "Warning" ? "text-accent flex items-center gap-1.5" : "text-ink")}>
                    {r.role === "Warning" && <AlertTriangle className="size-3.5" />}
                    {r.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-ink-muted">{r.role}</p>
                </div>
                {r.cells.map((c, i) => (
                  <div key={i} className={"h-14 rounded-xl px-3 flex items-center justify-center text-xs font-mono font-medium " + cellClass(c.type)}>
                    {c.text}
                  </div>
                ))}
              </>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Legend({ color, label, tone }: { color: string; label: string; tone?: "dark" | "accent" }) {
  return (
    <span className="flex items-center gap-2 text-ink-muted">
      <span className={"size-3 rounded-sm " + color} />
      <span className={tone === "accent" ? "text-accent font-semibold" : ""}>{label}</span>
    </span>
  );
}
