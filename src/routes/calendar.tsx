import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/dashboard/AppShell";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dog,
  Filter,
  PlayCircle,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Trusted Dog Groomers" },
      {
        name: "description",
        content: "Book, move and track grooming appointments across the day and week.",
      },
      { property: "og:title", content: "Calendar — Trusted Dog Groomers" },
      {
        property: "og:description",
        content: "Day and week scheduling grid for the grooming floor.",
      },
    ],
  }),
  component: CalendarPage,
});

/* ---------------- data ---------------- */

const HOURS = Array.from({ length: 10 }, (_, i) => 8 + i); // 08:00 – 17:00
const CLOSING = 17;
const ROW = 64; // px per hour
const GROOMERS = ["Alex", "Maria", "Jonas"] as const;
const SERVICES = [
  "Wash + Cut",
  "Full groom",
  "Nails + Bath",
  "Deshedding",
  "Dematting",
  "Bath + Ears",
] as const;

type Status = "booked" | "in-progress" | "done" | "cancelled";

type Appt = {
  id: string;
  groomer: string;
  date: string; // yyyy-mm-dd
  start: number; // hour, e.g. 9.5
  span: number; // hours
  dog: string;
  breed: string;
  owner: string;
  service: string;
  status: Status;
  warn?: string;
};

const ANCHOR = new Date(2026, 7, 5); // Wed 5 Aug 2026

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday-first
  return addDays(x, -day);
}
function fmtLong(d: Date) {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}
function fmtTime(h: number) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

const SEED: Appt[] = [
  { id: "a1", groomer: "Alex", date: iso(ANCHOR), start: 9, span: 1.5, dog: "Bear", breed: "Goldendoodle", owner: "T. Grech", service: "Wash + Cut", status: "in-progress", warn: "Nervous with clippers" },
  { id: "a2", groomer: "Alex", date: iso(ANCHOR), start: 11, span: 2, dog: "Coco", breed: "Toy Poodle", owner: "S. Bonnici", service: "Full groom", status: "booked", warn: "Shampoo allergy" },
  { id: "a3", groomer: "Alex", date: iso(ANCHOR), start: 14, span: 1, dog: "Milo", breed: "Cavalier", owner: "R. Vella", service: "Nails + Bath", status: "booked" },
  { id: "a4", groomer: "Maria", date: iso(ANCHOR), start: 8, span: 2, dog: "Oliver", breed: "Beagle", owner: "J. Attard", service: "Deshedding", status: "done" },
  { id: "a5", groomer: "Maria", date: iso(ANCHOR), start: 10.5, span: 1.5, dog: "Luna", breed: "Husky", owner: "M. Farrugia", service: "Wash + Dry", status: "in-progress" },
  { id: "a6", groomer: "Maria", date: iso(ANCHOR), start: 13, span: 2, dog: "Pepper", breed: "Schnauzer", owner: "P. Zammit", service: "Cut + Beard", status: "booked" },
  { id: "a7", groomer: "Jonas", date: iso(ANCHOR), start: 9, span: 2.5, dog: "Daisy", breed: "Maltipoo", owner: "L. Sciberras", service: "Dematting", status: "booked", warn: "Matted coat — extra time" },
  { id: "a8", groomer: "Jonas", date: iso(ANCHOR), start: 12.5, span: 1.5, dog: "Nala", breed: "Cocker", owner: "D. Camilleri", service: "Bath + Ears", status: "booked" },
  { id: "b1", groomer: "Alex", date: iso(addDays(ANCHOR, 1)), start: 9, span: 2, dog: "Rocky", breed: "Boxer", owner: "K. Muscat", service: "Wash + Cut", status: "booked" },
  { id: "b2", groomer: "Maria", date: iso(addDays(ANCHOR, 1)), start: 11, span: 1.5, dog: "Bella", breed: "Shih Tzu", owner: "A. Borg", service: "Full groom", status: "booked" },
  { id: "b3", groomer: "Jonas", date: iso(addDays(ANCHOR, 2)), start: 10, span: 1, dog: "Simba", breed: "Pomeranian", owner: "N. Debono", service: "Nails + Bath", status: "booked" },
  { id: "b4", groomer: "Alex", date: iso(addDays(ANCHOR, -1)), start: 9, span: 1.5, dog: "Toby", breed: "Labrador", owner: "C. Spiteri", service: "Deshedding", status: "done" },
];

const STATUS_META: Record<Status, { label: string; chip: string; block: string }> = {
  booked: {
    label: "Booked",
    chip: "bg-primary/10 text-primary ring-1 ring-primary/20",
    block: "bg-primary text-primary-foreground",
  },
  "in-progress": {
    label: "In progress",
    chip: "bg-accent/10 text-accent ring-1 ring-accent/20",
    block: "bg-accent text-accent-foreground",
  },
  done: {
    label: "Done",
    chip: "bg-secondary text-ink-muted ring-1 ring-black/5",
    block: "bg-card text-ink ring-1 ring-black/10",
  },
  cancelled: {
    label: "Cancelled",
    chip: "bg-secondary text-ink-muted ring-1 ring-black/5",
    block: "bg-secondary text-ink-muted ring-1 ring-black/10 line-through opacity-70",
  },
};

/* ---------------- page ---------------- */

function CalendarPage() {
  const [appts, setAppts] = useState<Appt[]>(SEED);
  const [view, setView] = useState<"day" | "week">("day");
  const [cursor, setCursor] = useState<Date>(ANCHOR);
  const [hidden, setHidden] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<null | { groomer: string; start: number; date: string }>(null);

  const visibleGroomers = GROOMERS.filter((g) => !hidden.includes(g));
  const dayKey = iso(cursor);
  const weekStart = startOfWeek(cursor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dayAppts = useMemo(
    () => appts.filter((a) => a.date === dayKey && !hidden.includes(a.groomer)),
    [appts, dayKey, hidden],
  );

  const booked = dayAppts.filter((a) => a.status !== "cancelled");
  const bookedHours = booked.reduce((s, a) => s + a.span, 0);
  const capacity = visibleGroomers.length * (CLOSING - 8);
  const selectedAppt = appts.find((a) => a.id === selected) ?? null;

  const shift = (n: number) => setCursor((c) => addDays(c, view === "day" ? n : n * 7));

  const setStatus = (id: string, status: Status) => {
    setAppts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    toast.success(`Marked ${STATUS_META[status].label.toLowerCase()}`);
  };

  const remove = (id: string) => {
    setAppts((prev) => prev.filter((a) => a.id !== id));
    setSelected(null);
    toast.success("Appointment removed");
  };

  const create = (a: Omit<Appt, "id" | "status">) => {
    const clash = appts.some(
      (x) =>
        x.groomer === a.groomer &&
        x.date === a.date &&
        x.status !== "cancelled" &&
        a.start < x.start + x.span &&
        x.start < a.start + a.span,
    );
    if (clash) toast.warning(`${a.groomer} already has a dog in that slot`);
    const id = `n${Date.now()}`;

    setAppts((prev) => [...prev, { ...a, id, status: "booked" }]);
    setDraft(null);
    toast.success(`${a.dog} booked with ${a.groomer} at ${fmtTime(a.start)}`);
  };

  return (
    <AppShell
      title="Calendar"
      subtitle={view === "day" ? fmtLong(cursor) : `Week of ${fmtLong(weekStart)}`}
      actions={
        <div className="flex items-center gap-1 bg-card ring-1 ring-black/5 rounded-2xl p-1">
          {(["day", "week"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={
                "px-3 h-9 rounded-xl text-xs font-semibold capitalize transition-colors " +
                (view === v ? "bg-ink text-background" : "text-ink-muted hover:text-ink")
              }
            >
              {v}
            </button>
          ))}
        </div>
      }
    >
      {/* toolbar */}
      <div className="px-4 sm:px-6 lg:px-10 pb-4 flex flex-wrap items-center gap-3 justify-between flex-none">
        <div className="flex flex-wrap items-center gap-2">
          <button
            aria-label="Previous"
            onClick={() => shift(-1)}
            className="size-10 rounded-xl bg-card ring-1 ring-black/5 flex items-center justify-center text-ink-muted hover:text-ink"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setCursor(ANCHOR)}
            className="h-10 px-4 rounded-xl bg-card ring-1 ring-black/5 text-sm font-medium hover:text-ink"
          >
            Today
          </button>
          <button
            aria-label="Next"
            onClick={() => shift(1)}
            className="size-10 rounded-xl bg-card ring-1 ring-black/5 flex items-center justify-center text-ink-muted hover:text-ink"
          >
            <ChevronRight className="size-4" />
          </button>

          <div className="ml-1 flex items-center gap-1.5">
            <Filter className="size-3.5 text-ink-muted" />
            {GROOMERS.map((g) => {
              const on = !hidden.includes(g);
              return (
                <button
                  key={g}
                  onClick={() =>
                    setHidden((h) => (h.includes(g) ? h.filter((x) => x !== g) : [...h, g]))
                  }
                  className={
                    "h-8 px-3 rounded-full text-xs font-semibold transition-colors " +
                    (on
                      ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                      : "bg-secondary text-ink-muted ring-1 ring-black/5")
                  }
                >
                  {g}
                </button>
              );
            })}
          </div>

          <span className="hidden md:inline ml-2 text-sm text-ink-muted">
            {visibleGroomers.length} groomers · {booked.length} appointments ·{" "}
            {Math.round((bookedHours / Math.max(capacity, 1)) * 100)}% booked
          </span>
        </div>

        <button
          onClick={() => setDraft({ groomer: visibleGroomers[0] ?? "Alex", start: 9, date: dayKey })}
          className="h-10 px-5 rounded-2xl bg-accent text-accent-foreground text-sm font-bold flex items-center gap-2 shadow-sm hover:opacity-90"
        >
          <Plus className="size-4" /> New appointment
        </button>
      </div>

      <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-10 pb-6 lg:pb-10">
        {view === "day" ? (
          <DayGrid
            groomers={visibleGroomers}
            appts={dayAppts}
            onSelect={setSelected}
            onSlot={(groomer, start) => setDraft({ groomer, start, date: dayKey })}
          />
        ) : (
          <WeekGrid
            days={weekDays}
            appts={appts.filter((a) => !hidden.includes(a.groomer))}
            onPickDay={(d) => {
              setCursor(d);
              setView("day");
            }}
            onSelect={setSelected}
          />
        )}
      </div>

      <ApptSheet
        appt={selectedAppt}
        onClose={() => setSelected(null)}
        onStatus={setStatus}
        onDelete={remove}
      />
      <NewApptDialog draft={draft} onClose={() => setDraft(null)} onCreate={create} />
    </AppShell>
  );
}

/* ---------------- day grid ---------------- */

function DayGrid({
  groomers,
  appts,
  onSelect,
  onSlot,
}: {
  groomers: string[];
  appts: Appt[];
  onSelect: (id: string) => void;
  onSlot: (groomer: string, start: number) => void;
}) {
  if (groomers.length === 0) {
    return (
      <div className="bg-card rounded-3xl ring-1 ring-black/5 p-10 text-center text-sm text-ink-muted">
        All groomers are filtered out — turn one back on to see the day.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-4 sm:p-6 min-w-[640px]">
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `80px repeat(${groomers.length}, minmax(0, 1fr))` }}
      >
        <div />
        {groomers.map((g, i) => (
          <div key={g} className="px-3 py-2">
            <p className="text-sm font-bold text-ink">{g}</p>
            <p className="text-[11px] text-ink-muted uppercase tracking-wider">
              Station {i + 1} · {appts.filter((a) => a.groomer === g && a.status !== "cancelled").length} jobs
            </p>
          </div>
        ))}

        {HOURS.map((h) => (
          <div key={`row-${h}`} className="contents">
            <div className="text-[11px] font-mono text-ink-muted pt-2 pr-2 text-right">
              {String(h).padStart(2, "0")}:00
            </div>
            {groomers.map((g) => {
              const isClosed = h >= CLOSING;
              const here = appts.filter((a) => a.groomer === g && Math.floor(a.start) === h);
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
                  {!isClosed && here.length === 0 && (
                    <button
                      onClick={() => onSlot(g, h)}
                      className="group absolute inset-0 rounded-xl flex items-center justify-center text-ink-muted opacity-0 hover:opacity-100 hover:bg-primary/5 transition-opacity"
                      aria-label={`Book ${g} at ${h}:00`}
                    >
                      <span className="flex items-center gap-1 text-[11px] font-semibold">
                        <Plus className="size-3.5" /> Book
                      </span>
                    </button>
                  )}
                  {here.map((a, i) => (
                    <button
                      key={a.id}
                      onClick={() => onSelect(a.id)}
                      style={{
                        height: `${a.span * ROW - 8}px`,
                        top: `${(a.start - Math.floor(a.start)) * ROW + 4}px`,
                        left: `calc(${(i / here.length) * 100}% + 4px)`,
                        width: `calc(${100 / here.length}% - 8px)`,
                      }}
                      className={
                        "absolute z-10 text-left rounded-xl px-3 py-2 shadow-sm hover:brightness-95 transition " +
                        STATUS_META[a.status].block
                      }
                    >

                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold leading-none truncate">{a.dog}</p>
                        {a.warn && <AlertTriangle className="size-3.5 shrink-0" strokeWidth={2.5} />}
                      </div>
                      <p className="text-[11px] opacity-80 mt-1 truncate">{a.breed}</p>
                      <p className="text-[10px] font-mono opacity-80 mt-1 uppercase tracking-wider truncate">
                        {fmtTime(a.start)} · {a.service}
                      </p>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
        <div className="flex flex-wrap items-center gap-4">
          <Legend className="bg-primary" label="Booked" />
          <Legend className="bg-accent" label="In progress" />
          <Legend className="bg-card ring-1 ring-black/10" label="Done" />
          <Legend className="bg-secondary ring-1 ring-black/10" label="Open slot" />
        </div>
        <span>Click an empty slot to book · click a card to manage it</span>
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={"size-2.5 rounded-sm " + className} /> {label}
    </span>
  );
}

/* ---------------- week grid ---------------- */

function WeekGrid({
  days,
  appts,
  onPickDay,
  onSelect,
}: {
  days: Date[];
  appts: Appt[];
  onPickDay: (d: Date) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-4 sm:p-6 min-w-[720px]">
      <div className="grid grid-cols-7 gap-3">
        {days.map((d) => {
          const list = appts
            .filter((a) => a.date === iso(d))
            .sort((x, y) => x.start - y.start);
          return (
            <div key={iso(d)} className="min-h-[280px] flex flex-col">
              <button
                onClick={() => onPickDay(d)}
                className="text-left px-2 py-2 rounded-xl hover:bg-secondary/60 transition-colors"
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">
                  {d.toLocaleDateString("en-GB", { weekday: "short" })}
                </p>
                <p className="text-lg font-semibold text-ink leading-tight">{d.getDate()}</p>
                <p className="text-[10px] text-ink-muted">{list.length} jobs</p>
              </button>
              <div className="mt-2 flex flex-col gap-2">
                {list.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelect(a.id)}
                    className={
                      "text-left rounded-xl px-2.5 py-2 text-xs shadow-sm hover:brightness-95 transition " +
                      STATUS_META[a.status].block
                    }
                  >
                    <p className="font-bold leading-none truncate">{a.dog}</p>
                    <p className="font-mono text-[10px] opacity-80 mt-1">
                      {fmtTime(a.start)} · {a.groomer}
                    </p>
                  </button>
                ))}
                {list.length === 0 && (
                  <p className="px-2 text-[11px] text-ink-muted/70">No bookings</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- detail sheet ---------------- */

function ApptSheet({
  appt,
  onClose,
  onStatus,
  onDelete,
}: {
  appt: Appt | null;
  onClose: () => void;
  onStatus: (id: string, s: Status) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Sheet open={!!appt} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {appt && (
          <>
            <SheetHeader>
              <SheetTitle className="text-2xl">{appt.dog}</SheetTitle>
              <SheetDescription>
                {appt.breed} · owner {appt.owner}
              </SheetDescription>
            </SheetHeader>

            <div className="px-4 space-y-4">
              <span
                className={
                  "inline-block text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full font-bold " +
                  STATUS_META[appt.status].chip
                }
              >
                {STATUS_META[appt.status].label}
              </span>

              {appt.warn && (
                <div className="flex items-start gap-2 rounded-2xl bg-accent/10 text-accent p-3 text-sm">
                  <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                  <span>{appt.warn}</span>
                </div>
              )}

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Field icon={Clock} label="Time">
                  {fmtTime(appt.start)} – {fmtTime(appt.start + appt.span)}
                </Field>
                <Field icon={User} label="Groomer">
                  {appt.groomer}
                </Field>
                <Field icon={Dog} label="Service">
                  {appt.service}
                </Field>
                <Field icon={Clock} label="Duration">
                  {appt.span}h
                </Field>
              </dl>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => onStatus(appt.id, "in-progress")}
                  className="h-11 rounded-2xl bg-accent text-accent-foreground text-sm font-bold flex items-center justify-center gap-2"
                >
                  <PlayCircle className="size-4" /> Start groom
                </button>
                <button
                  onClick={() => onStatus(appt.id, "done")}
                  className="h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Check className="size-4" /> Complete
                </button>
                <button
                  onClick={() => onStatus(appt.id, "cancelled")}
                  className="h-11 rounded-2xl bg-secondary text-ink text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <X className="size-4" /> Cancel
                </button>
                <button
                  onClick={() => onDelete(appt.id)}
                  className="h-11 rounded-2xl ring-1 ring-black/10 text-ink-muted text-sm font-semibold flex items-center justify-center gap-2 hover:text-ink"
                >
                  <Trash2 className="size-4" /> Remove
                </button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Clock;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-3">
      <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-ink-muted">
        <Icon className="size-3" /> {label}
      </dt>
      <dd className="mt-1 font-semibold text-ink">{children}</dd>
    </div>
  );
}

/* ---------------- new appointment ---------------- */

function NewApptDialog({
  draft,
  onClose,
  onCreate,
}: {
  draft: { groomer: string; start: number; date: string } | null;
  onClose: () => void;
  onCreate: (a: Omit<Appt, "id" | "status">) => void;
}) {
  const [dog, setDog] = useState("");
  const [breed, setBreed] = useState("");
  const [owner, setOwner] = useState("");
  const [service, setService] = useState<string>(SERVICES[0]);
  const [groomer, setGroomer] = useState<string>("Alex");
  const [start, setStart] = useState("9");
  const [span, setSpan] = useState("1");

  // sync form to the slot that was clicked
  const key = draft ? `${draft.groomer}-${draft.start}-${draft.date}` : "";
  const [lastKey, setLastKey] = useState("");
  if (draft && key !== lastKey) {
    setLastKey(key);
    setGroomer(draft.groomer);
    setStart(String(draft.start));
    setDog("");
    setBreed("");
    setOwner("");
    setSpan("1");
    setService(SERVICES[0]);
  }

  const submit = () => {
    if (!draft) return;
    if (!dog.trim()) {
      toast.error("Add the dog's name first");
      return;
    }
    onCreate({
      groomer,
      date: draft.date,
      start: Number(start),
      span: Number(span),
      dog: dog.trim(),
      breed: breed.trim() || "Unknown breed",
      owner: owner.trim() || "Walk-in",
      service,
    });
  };

  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New appointment</DialogTitle>
          <DialogDescription>
            {draft
              ? new Date(`${draft.date}T00:00:00`).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dog">Dog name</Label>
            <Input id="dog" value={dog} onChange={(e) => setDog(e.target.value)} placeholder="Bear" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="breed">Breed</Label>
            <Input
              id="breed"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="Goldendoodle"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="owner">Owner</Label>
            <Input
              id="owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="T. Grech"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Groomer</Label>
            <Select value={groomer} onValueChange={setGroomer}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROOMERS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Service</Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Start</Label>
            <Select value={start} onValueChange={setStart}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS.flatMap((h) => [h, h + 0.5]).map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {fmtTime(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Duration</Label>
            <Select value={span} onValueChange={setSpan}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["0.5", "1", "1.5", "2", "2.5", "3"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}h
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="h-11 px-5 rounded-2xl bg-secondary text-ink text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="h-11 px-5 rounded-2xl bg-accent text-accent-foreground text-sm font-bold"
          >
            Book appointment
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
