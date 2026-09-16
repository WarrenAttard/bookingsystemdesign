import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/dashboard/AppShell";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dog,
  Filter,
  GripHorizontal,
  PlayCircle,
  Plus,
  Repeat,
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
        content: "Book, drag, repeat and track grooming appointments across the day and week.",
      },
      { property: "og:title", content: "Calendar — Trusted Dog Groomers" },
      {
        property: "og:description",
        content: "Day and week scheduling grid for the grooming floor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalendarPage,
});

/* ---------------- data ---------------- */

const HOURS = Array.from({ length: 9 }, (_, i) => 8 + i); // 08:00 – 16:00 rows, closes 17:00
const OPENING = 8;
const CLOSING = 17;
const ROW = 64; // px per hour
const STEP = 0.5; // snap in hours
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
type Freq = "daily" | "weekly";

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
  seriesId?: string;
  rule?: { freq: Freq; interval: number; count: number };
  edited?: boolean; // this occurrence differs from the series
};

type Patch = Partial<Omit<Appt, "id" | "seriesId" | "rule">>;

type Series = {
  id: string;
  firstDate: string;
  rule: { freq: Freq; interval: number; count: number };
  base: Omit<Appt, "id" | "date" | "seriesId" | "rule" | "edited">;
  exceptions: Record<string, (Patch & { deleted?: boolean }) | undefined>;
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
function parseIso(s: string) {
  return new Date(`${s}T00:00:00`);
}
function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday-first
  return addDays(x, -day);
}
function fmtLong(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}
function fmtTime(h: number) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
function snap(h: number) {
  return Math.round(h / STEP) * STEP;
}
function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

const SEED: Appt[] = [
  { id: "a1", groomer: "Alex", date: iso(ANCHOR), start: 9, span: 1.5, dog: "Bear", breed: "Goldendoodle", owner: "T. Grech", service: "Wash + Cut", status: "in-progress", warn: "Nervous with clippers" },
  { id: "a2", groomer: "Alex", date: iso(ANCHOR), start: 11, span: 2, dog: "Coco", breed: "Toy Poodle", owner: "S. Bonnici", service: "Full groom", status: "booked", warn: "Shampoo allergy" },
  { id: "a3", groomer: "Alex", date: iso(ANCHOR), start: 14, span: 1, dog: "Milo", breed: "Cavalier", owner: "R. Vella", service: "Nails + Bath", status: "booked" },
  { id: "a4", groomer: "Maria", date: iso(ANCHOR), start: 8, span: 2, dog: "Oliver", breed: "Beagle", owner: "J. Attard", service: "Deshedding", status: "done" },
  { id: "a5", groomer: "Maria", date: iso(ANCHOR), start: 10.5, span: 1.5, dog: "Luna", breed: "Husky", owner: "M. Farrugia", service: "Bath + Ears", status: "in-progress" },
  { id: "a6", groomer: "Maria", date: iso(ANCHOR), start: 13, span: 2, dog: "Pepper", breed: "Schnauzer", owner: "P. Zammit", service: "Full groom", status: "booked" },
  { id: "a8", groomer: "Jonas", date: iso(ANCHOR), start: 12.5, span: 1.5, dog: "Nala", breed: "Cocker", owner: "D. Camilleri", service: "Bath + Ears", status: "booked" },
  { id: "b1", groomer: "Alex", date: iso(addDays(ANCHOR, 1)), start: 9, span: 2, dog: "Rocky", breed: "Boxer", owner: "K. Muscat", service: "Wash + Cut", status: "booked" },
  { id: "b2", groomer: "Maria", date: iso(addDays(ANCHOR, 1)), start: 11, span: 1.5, dog: "Bella", breed: "Shih Tzu", owner: "A. Borg", service: "Full groom", status: "booked" },
  { id: "b4", groomer: "Alex", date: iso(addDays(ANCHOR, -1)), start: 9, span: 1.5, dog: "Toby", breed: "Labrador", owner: "C. Spiteri", service: "Deshedding", status: "done" },
];

const SEED_SERIES: Series[] = [
  {
    id: "s1",
    firstDate: iso(ANCHOR),
    rule: { freq: "weekly", interval: 1, count: 4 },
    base: {
      groomer: "Jonas",
      start: 9,
      span: 2.5,
      dog: "Daisy",
      breed: "Maltipoo",
      owner: "L. Sciberras",
      service: "Dematting",
      status: "booked",
      warn: "Matted coat — extra time",
    },
    exceptions: {},
  },
  {
    id: "s2",
    firstDate: iso(ANCHOR),
    rule: { freq: "daily", interval: 1, count: 3 },
    base: {
      groomer: "Jonas",
      start: 15,
      span: 1,
      dog: "Simba",
      breed: "Pomeranian",
      owner: "N. Debono",
      service: "Nails + Bath",
      status: "booked",
    },
    exceptions: {},
  },
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

function expand(s: Series): Appt[] {
  const out: Appt[] = [];
  const step = s.rule.freq === "weekly" ? s.rule.interval * 7 : s.rule.interval;
  const first = parseIso(s.firstDate);
  for (let i = 0; i < s.rule.count; i++) {
    const date = iso(addDays(first, i * step));
    const ex = s.exceptions[date];
    if (ex?.deleted) continue;
    const { deleted: _d, ...patch } = ex ?? {};
    out.push({
      id: `${s.id}#${date}`,
      seriesId: s.id,
      rule: s.rule,
      date,
      edited: !!ex,
      ...s.base,
      ...patch,
    });
  }
  return out;
}

function ruleLabel(r: { freq: Freq; interval: number; count: number }) {
  const every =
    r.interval === 1
      ? r.freq === "daily"
        ? "Every day"
        : "Every week"
      : `Every ${r.interval} ${r.freq === "daily" ? "days" : "weeks"}`;
  return `${every} · ${r.count} visits`;
}

function describe(a: Appt) {
  return `${a.dog}, ${a.breed}, ${a.service} with ${a.groomer}, ${fmtTime(a.start)} to ${fmtTime(
    a.start + a.span,
  )}, ${STATUS_META[a.status].label}${a.seriesId ? ", repeating appointment" : ""}${
    a.warn ? `, note: ${a.warn}` : ""
  }`;
}

/* ---------------- page ---------------- */

function CalendarPage() {
  const [singles, setSingles] = useState<Appt[]>(SEED);
  const [series, setSeries] = useState<Series[]>(SEED_SERIES);
  const [view, setView] = useState<"day" | "week">("day");
  const [cursor, setCursor] = useState<Date>(ANCHOR);
  const [hidden, setHidden] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<null | { groomer: string; start: number; date: string }>(null);
  const [live, setLive] = useState("");

  const announce = useCallback((msg: string) => setLive(msg), []);

  const all = useMemo(() => [...singles, ...series.flatMap(expand)], [singles, series]);

  const visibleGroomers = GROOMERS.filter((g) => !hidden.includes(g));
  const dayKey = iso(cursor);
  const weekStart = startOfWeek(cursor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dayAppts = useMemo(
    () => all.filter((a) => a.date === dayKey && !hidden.includes(a.groomer)),
    [all, dayKey, hidden],
  );

  const booked = dayAppts.filter((a) => a.status !== "cancelled");
  const bookedHours = booked.reduce((s, a) => s + a.span, 0);
  const capacity = visibleGroomers.length * (CLOSING - OPENING);
  const selectedAppt = all.find((a) => a.id === selected) ?? null;

  const shift = (n: number) => setCursor((c) => addDays(c, view === "day" ? n : n * 7));

  /* ---- unified edit across singles + series occurrences ---- */

  const patchAppt = useCallback(
    (appt: Appt, patch: Patch, scope: "one" | "all" = "one") => {
      if (!appt.seriesId) {
        setSingles((prev) => prev.map((a) => (a.id === appt.id ? { ...a, ...patch } : a)));
        return;
      }
      setSeries((prev) =>
        prev.map((s) => {
          if (s.id !== appt.seriesId) return s;
          if (scope === "all") {
            return { ...s, base: { ...s.base, ...patch }, exceptions: {} };
          }
          return {
            ...s,
            exceptions: {
              ...s.exceptions,
              [appt.date]: { ...(s.exceptions[appt.date] ?? {}), ...patch },
            },
          };
        }),
      );
    },
    [],
  );

  const removeAppt = useCallback(
    (appt: Appt, scope: "one" | "all" = "one") => {
      if (!appt.seriesId) {
        setSingles((prev) => prev.filter((a) => a.id !== appt.id));
      } else if (scope === "all") {
        setSeries((prev) => prev.filter((s) => s.id !== appt.seriesId));
      } else {
        setSeries((prev) =>
          prev.map((s) =>
            s.id === appt.seriesId
              ? { ...s, exceptions: { ...s.exceptions, [appt.date]: { deleted: true } } }
              : s,
          ),
        );
      }
      setSelected(null);
      toast.success(scope === "all" ? "Whole series removed" : "Appointment removed");
      announce(scope === "all" ? "Whole series removed" : `${appt.dog} removed`);
    },
    [announce],
  );

  const setStatus = (appt: Appt, status: Status, scope: "one" | "all" = "one") => {
    patchAppt(appt, { status }, scope);
    toast.success(`Marked ${STATUS_META[status].label.toLowerCase()}`);
    announce(`${appt.dog} marked ${STATUS_META[status].label.toLowerCase()}`);
  };

  const clashes = useCallback(
    (a: { groomer: string; date: string; start: number; span: number }, ignoreId?: string) =>
      all.some(
        (x) =>
          x.id !== ignoreId &&
          x.groomer === a.groomer &&
          x.date === a.date &&
          x.status !== "cancelled" &&
          a.start < x.start + x.span &&
          x.start < a.start + a.span,
      ),
    [all],
  );

  const moveAppt = useCallback(
    (appt: Appt, next: { groomer: string; start: number; span: number }, label: string) => {
      if (
        next.groomer === appt.groomer &&
        next.start === appt.start &&
        next.span === appt.span
      )
        return;
      patchAppt(appt, next, "one");
      const warn = clashes({ ...next, date: appt.date }, appt.id);
      const msg = `${appt.dog} ${label} ${next.groomer} ${fmtTime(next.start)}–${fmtTime(
        next.start + next.span,
      )}${appt.seriesId ? " (this occurrence only)" : ""}`;
      if (warn) toast.warning(`${msg} — overlaps another groom`);
      else toast.success(msg);
      announce(warn ? `${msg}. Warning: overlaps another groom` : msg);
    },
    [patchAppt, clashes, announce],
  );

  const create = (
    a: Omit<Appt, "id" | "status">,
    repeat: { freq: Freq; interval: number; count: number } | null,
  ) => {
    if (clashes(a)) toast.warning(`${a.groomer} already has a dog in that slot`);
    if (repeat) {
      const id = `s${Date.now()}`;
      const { date, ...base } = a;
      setSeries((prev) => [
        ...prev,
        { id, firstDate: date, rule: repeat, base: { ...base, status: "booked" }, exceptions: {} },
      ]);
      toast.success(`${a.dog} booked — ${ruleLabel(repeat).toLowerCase()}`);
    } else {
      setSingles((prev) => [...prev, { ...a, id: `n${Date.now()}`, status: "booked" }]);
      toast.success(`${a.dog} booked with ${a.groomer} at ${fmtTime(a.start)}`);
    }
    setDraft(null);
    announce(`${a.dog} booked with ${a.groomer} at ${fmtTime(a.start)}`);
  };

  return (
    <AppShell
      title="Calendar"
      subtitle={view === "day" ? fmtLong(cursor) : `Week of ${fmtLong(weekStart)}`}
      actions={
        <div
          role="group"
          aria-label="Calendar view"
          className="flex items-center gap-1 bg-card ring-1 ring-black/5 rounded-2xl p-1"
        >
          {(["day", "week"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              aria-label={`${v} view`}
              onClick={() => setView(v)}
              className={
                "px-3 h-9 rounded-xl text-xs font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
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
      <nav
        aria-label="Calendar controls"
        className="px-4 sm:px-6 lg:px-10 pb-4 flex flex-wrap items-center gap-3 justify-between flex-none"
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label={view === "day" ? "Previous day" : "Previous week"}
            onClick={() => shift(-1)}
            className="size-10 rounded-xl bg-card ring-1 ring-black/5 flex items-center justify-center text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(ANCHOR)}
            className="h-10 px-4 rounded-xl bg-card ring-1 ring-black/5 text-sm font-medium hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Today
          </button>
          <button
            type="button"
            aria-label={view === "day" ? "Next day" : "Next week"}
            onClick={() => shift(1)}
            className="size-10 rounded-xl bg-card ring-1 ring-black/5 flex items-center justify-center text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>

          <div role="group" aria-label="Filter by groomer" className="ml-1 flex items-center gap-1.5">
            <Filter className="size-3.5 text-ink-muted" aria-hidden="true" />
            {GROOMERS.map((g) => {
              const on = !hidden.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={on}
                  aria-label={`${g}${on ? " — shown" : " — hidden"}`}
                  onClick={() =>
                    setHidden((h) => {
                      const next = h.includes(g) ? h.filter((x) => x !== g) : [...h, g];
                      announce(`${g} ${next.includes(g) ? "hidden" : "shown"}`);
                      return next;
                    })
                  }
                  className={
                    "h-8 px-3 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
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
          type="button"
          onClick={() => setDraft({ groomer: visibleGroomers[0] ?? "Alex", start: 9, date: dayKey })}
          className="h-10 px-5 rounded-2xl bg-accent text-accent-foreground text-sm font-bold flex items-center gap-2 shadow-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-4" aria-hidden="true" /> New appointment
        </button>
      </nav>

      <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-10 pb-6 lg:pb-10">
        {view === "day" ? (
          <DayGrid
            date={cursor}
            groomers={visibleGroomers}
            appts={dayAppts}
            onSelect={setSelected}
            onSlot={(groomer, start) => setDraft({ groomer, start, date: dayKey })}
            onMove={moveAppt}
            onRemove={(a) => removeAppt(a, "one")}
          />
        ) : (
          <WeekGrid
            days={weekDays}
            appts={all.filter((a) => !hidden.includes(a.groomer))}
            onPickDay={(d) => {
              setCursor(d);
              setView("day");
            }}
            onSelect={setSelected}
          />
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {live}
      </p>

      <ApptSheet
        appt={selectedAppt}
        onClose={() => setSelected(null)}
        onStatus={setStatus}
        onDelete={removeAppt}
        onPatch={patchAppt}
      />
      <NewApptDialog draft={draft} onClose={() => setDraft(null)} onCreate={create} />
    </AppShell>
  );
}

/* ---------------- day grid ---------------- */

type DragState = {
  id: string;
  mode: "move" | "resize";
  origin: { start: number; span: number; groomer: string };
  pointerStartY: number;
  preview: { start: number; span: number; groomer: string };
};

function DayGrid({
  date,
  groomers,
  appts,
  onSelect,
  onSlot,
  onMove,
  onRemove,
}: {
  date: Date;
  groomers: string[];
  appts: Appt[];
  onSelect: (id: string) => void;
  onSlot: (groomer: string, start: number) => void;
  onMove: (
    a: Appt,
    next: { groomer: string; start: number; span: number },
    label: string,
  ) => void;
  onRemove: (a: Appt) => void;
}) {
  const colsRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;

  const height = HOURS.length * ROW + ROW; // 08:00 → 17:00

  useEffect(() => {
    if (!drag) return;
    const onPointerMove = (e: PointerEvent) => {
      const d = dragRef.current;
      const box = colsRef.current;
      if (!d || !box) return;
      const rect = box.getBoundingClientRect();
      const delta = (e.clientY - d.pointerStartY) / ROW;
      if (d.mode === "move") {
        const colW = rect.width / groomers.length;
        const idx = clamp(Math.floor((e.clientX - rect.left) / colW), 0, groomers.length - 1);
        const start = clamp(
          snap(d.origin.start + delta),
          OPENING,
          CLOSING - d.origin.span,
        );
        setDrag({ ...d, preview: { start, span: d.origin.span, groomer: groomers[idx] } });
      } else {
        const span = clamp(snap(d.origin.span + delta), STEP, CLOSING - d.origin.start);
        setDrag({ ...d, preview: { ...d.preview, span } });
      }
    };
    const onPointerUp = () => {
      const d = dragRef.current;
      setDrag(null);
      if (!d) return;
      const appt = appts.find((a) => a.id === d.id);
      if (appt) onMove(appt, d.preview, d.mode === "resize" ? "resized to" : "moved to");
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [drag, groomers, appts, onMove]);

  const startDrag = (e: React.PointerEvent, a: Appt, mode: "move" | "resize") => {
    if (e.button !== 0) return;
    e.preventDefault();
    setDrag({
      id: a.id,
      mode,
      origin: { start: a.start, span: a.span, groomer: a.groomer },
      pointerStartY: e.clientY,
      preview: { start: a.start, span: a.span, groomer: a.groomer },
    });
  };

  const onKey = (e: React.KeyboardEvent, a: Appt) => {
    const idx = groomers.indexOf(a.groomer);
    const big = e.shiftKey;
    let next: { groomer: string; start: number; span: number } | null = null;
    let label = "moved to";
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const dir = e.key === "ArrowDown" ? 1 : -1;
      if (big) {
        next = {
          groomer: a.groomer,
          start: a.start,
          span: clamp(a.span + dir * STEP, STEP, CLOSING - a.start),
        };
        label = "resized to";
      } else {
        next = {
          groomer: a.groomer,
          start: clamp(a.start + dir * STEP, OPENING, CLOSING - a.span),
          span: a.span,
        };
      }
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const to = clamp(idx + (e.key === "ArrowRight" ? 1 : -1), 0, groomers.length - 1);
      next = { groomer: groomers[to], start: a.start, span: a.span };
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(a.id);
      return;
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onRemove(a);
      return;
    } else {
      return;
    }
    e.preventDefault();
    if (next) onMove(a, next, label);
  };

  if (groomers.length === 0) {
    return (
      <div className="bg-card rounded-3xl ring-1 ring-black/5 p-10 text-center text-sm text-ink-muted">
        All groomers are filtered out — turn one back on to see the day.
      </div>
    );
  }

  return (
    <section
      aria-label={`Day schedule for ${fmtLong(date)}`}
      className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-4 sm:p-6 min-w-[640px]"
    >
      <div className="flex gap-3">
        {/* time gutter */}
        <div className="w-16 shrink-0">
          <div className="h-12" />
          <div className="relative" style={{ height }} aria-hidden="true">
            {[...HOURS, CLOSING].map((h) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] font-mono text-ink-muted"
                style={{ top: (h - OPENING) * ROW }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
        </div>

        {/* groomer columns */}
        <div
          ref={colsRef}
          className="grid flex-1 gap-3"
          style={{ gridTemplateColumns: `repeat(${groomers.length}, minmax(0, 1fr))` }}
        >
          {groomers.map((g, i) => (
            <div key={`h-${g}`} className="h-12 px-3 py-1">
              <p className="text-sm font-bold text-ink">{g}</p>
              <p className="text-[11px] text-ink-muted uppercase tracking-wider">
                Station {i + 1} ·{" "}
                {appts.filter((a) => a.groomer === g && a.status !== "cancelled").length} jobs
              </p>
            </div>
          ))}

          {groomers.map((g) => {
            const list = appts.filter((a) => a.groomer === g);
            return (
              <div
                key={`col-${g}`}
                className="relative rounded-2xl bg-secondary/40 overflow-hidden"
                style={{ height }}
              >
                {/* half-hour slot buttons */}
                {HOURS.flatMap((h) => [h, h + STEP]).map((h) => (
                  <button
                    key={`slot-${g}-${h}`}
                    type="button"
                    onClick={() => onSlot(g, h)}
                    aria-label={`Book ${g} at ${fmtTime(h)} on ${fmtLong(date)}`}
                    className="absolute left-0 right-0 border-t border-black/5 first:border-0 text-ink-muted opacity-0 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring hover:bg-primary/5 flex items-center justify-center text-[11px] font-semibold"
                    style={{ top: (h - OPENING) * ROW, height: ROW * STEP }}
                  >
                    <span className="flex items-center gap-1">
                      <Plus className="size-3" aria-hidden="true" /> Book {fmtTime(h)}
                    </span>
                  </button>
                ))}

                {list.map((a) => {
                  const dragging = drag?.id === a.id;
                  const ghost = dragging && drag.preview.groomer !== g;
                  const pos = dragging ? drag.preview : a;
                  if (ghost) return null;
                  const overlap = list.filter(
                    (x) => x.id !== a.id && a.start < x.start + x.span && x.start < a.start + a.span,
                  ).length;
                  const order = list
                    .filter((x) => a.start < x.start + x.span && x.start < a.start + a.span)
                    .findIndex((x) => x.id === a.id);
                  const lanes = overlap + 1;
                  return (
                    <div
                      key={a.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${describe(a)}. Arrow keys move, shift plus arrows resize, Enter opens details, Delete removes.`}
                      aria-grabbed={dragging || undefined}
                      onKeyDown={(e) => onKey(e, a)}
                      onPointerDown={(e) => startDrag(e, a, "move")}
                      onClick={() => !drag && onSelect(a.id)}
                      style={{
                        top: (pos.start - OPENING) * ROW + 3,
                        height: pos.span * ROW - 6,
                        left: `calc(${(order / lanes) * 100}% + 4px)`,
                        width: `calc(${100 / lanes}% - 8px)`,
                      }}
                      className={
                        "absolute z-10 select-none touch-none rounded-xl px-3 py-2 shadow-sm transition-shadow cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink " +
                        (dragging ? "ring-2 ring-ink shadow-lg z-20 " : "hover:brightness-95 ") +
                        STATUS_META[a.status].block
                      }
                    >
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-bold leading-none truncate">{a.dog}</p>
                        <span className="flex items-center gap-1 shrink-0">
                          {a.seriesId && <Repeat className="size-3" aria-hidden="true" />}
                          {a.warn && (
                            <AlertTriangle className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
                          )}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-80 mt-1 truncate">{a.breed}</p>
                      <p className="text-[10px] font-mono opacity-80 mt-1 uppercase tracking-wider truncate">
                        {fmtTime(pos.start)}–{fmtTime(pos.start + pos.span)} · {a.service}
                      </p>

                      <span
                        role="slider"
                        tabIndex={0}
                        aria-label={`Resize ${a.dog}, currently ${pos.span} hours`}
                        aria-valuemin={STEP}
                        aria-valuemax={CLOSING - a.start}
                        aria-valuenow={pos.span}
                        aria-valuetext={`${pos.span} hours`}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          startDrag(e, a, "resize");
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
                          e.preventDefault();
                          e.stopPropagation();
                          const dir = e.key === "ArrowDown" ? 1 : -1;
                          onMove(
                            a,
                            {
                              groomer: a.groomer,
                              start: a.start,
                              span: clamp(a.span + dir * STEP, STEP, CLOSING - a.start),
                            },
                            "resized to",
                          );
                        }}
                        className="absolute inset-x-0 bottom-0 h-3 flex items-center justify-center cursor-ns-resize rounded-b-xl opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                      >
                        <GripHorizontal className="size-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  );
                })}

                {/* drop preview when dragged into this column */}
                {drag && drag.preview.groomer === g && !list.some((a) => a.id === drag.id) && (
                  <div
                    aria-hidden="true"
                    className="absolute z-20 left-1 right-1 rounded-xl ring-2 ring-dashed ring-ink/50 bg-ink/5"
                    style={{
                      top: (drag.preview.start - OPENING) * ROW + 3,
                      height: drag.preview.span * ROW - 6,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
        <div className="flex flex-wrap items-center gap-4">
          <Legend className="bg-primary" label="Booked" />
          <Legend className="bg-accent" label="In progress" />
          <Legend className="bg-card ring-1 ring-black/10" label="Done" />
          <Legend className="bg-secondary ring-1 ring-black/10" label="Open slot" />
        </div>
        <span>
          Drag a card to move it · drag its bottom edge to resize · keyboard: arrows move, shift +
          arrows resize
        </span>
      </div>
    </section>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={"size-2.5 rounded-sm " + className} aria-hidden="true" /> {label}
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
    <section
      aria-label="Week schedule"
      className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-4 sm:p-6 min-w-[720px]"
    >
      <div className="grid grid-cols-7 gap-3">
        {days.map((d) => {
          const list = appts.filter((a) => a.date === iso(d)).sort((x, y) => x.start - y.start);
          return (
            <div key={iso(d)} className="min-h-[280px] flex flex-col">
              <button
                type="button"
                onClick={() => onPickDay(d)}
                aria-label={`Open ${fmtLong(d)} — ${list.length} appointments`}
                className="text-left px-2 py-2 rounded-xl hover:bg-secondary/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">
                  {d.toLocaleDateString("en-GB", { weekday: "short" })}
                </p>
                <p className="text-lg font-semibold text-ink leading-tight">{d.getDate()}</p>
                <p className="text-[10px] text-ink-muted">{list.length} jobs</p>
              </button>
              <ul className="mt-2 flex flex-col gap-2 list-none">
                {list.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(a.id)}
                      aria-label={describe(a)}
                      className={
                        "w-full text-left rounded-xl px-2.5 py-2 text-xs shadow-sm hover:brightness-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink " +
                        STATUS_META[a.status].block
                      }
                    >
                      <p className="font-bold leading-none truncate flex items-center gap-1">
                        {a.dog}
                        {a.seriesId && <Repeat className="size-3 shrink-0" aria-hidden="true" />}
                      </p>
                      <p className="font-mono text-[10px] opacity-80 mt-1">
                        {fmtTime(a.start)} · {a.groomer}
                      </p>
                    </button>
                  </li>
                ))}
                {list.length === 0 && (
                  <li className="px-2 text-[11px] text-ink-muted/70">No bookings</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- detail sheet ---------------- */

function ApptSheet({
  appt,
  onClose,
  onStatus,
  onDelete,
  onPatch,
}: {
  appt: Appt | null;
  onClose: () => void;
  onStatus: (a: Appt, s: Status, scope: "one" | "all") => void;
  onDelete: (a: Appt, scope: "one" | "all") => void;
  onPatch: (a: Appt, patch: Patch, scope: "one" | "all") => void;
}) {
  const [scope, setScope] = useState<"one" | "all">("one");

  useEffect(() => {
    setScope("one");
  }, [appt?.id]);

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

            <div className="px-4 space-y-4 pb-6">
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
                  <AlertTriangle className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{appt.warn}</span>
                </div>
              )}

              {appt.rule && (
                <fieldset className="rounded-2xl bg-secondary/60 p-3 space-y-2">
                  <legend className="sr-only">Repeating appointment options</legend>
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Repeat className="size-4" aria-hidden="true" /> {ruleLabel(appt.rule)}
                  </p>
                  {appt.edited && (
                    <p className="text-[11px] text-ink-muted">
                      This occurrence has been edited separately from the series.
                    </p>
                  )}
                  <div role="radiogroup" aria-label="Apply changes to" className="flex gap-2 pt-1">
                    {(
                      [
                        ["one", "This occurrence"],
                        ["all", "Whole series"],
                      ] as const
                    ).map(([v, label]) => (
                      <button
                        key={v}
                        type="button"
                        role="radio"
                        aria-checked={scope === v}
                        onClick={() => setScope(v)}
                        className={
                          "h-9 px-3 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                          (scope === v
                            ? "bg-ink text-background"
                            : "bg-card text-ink-muted ring-1 ring-black/5")
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>
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

              <div className="space-y-1.5">
                <Label htmlFor="edit-start">Start time</Label>
                <Select
                  value={String(appt.start)}
                  onValueChange={(v) =>
                    onPatch(
                      appt,
                      { start: clamp(Number(v), OPENING, CLOSING - appt.span) },
                      appt.rule ? scope : "one",
                    )
                  }
                >
                  <SelectTrigger id="edit-start" aria-label="Start time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.flatMap((h) => [h, h + STEP]).map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {fmtTime(h)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onStatus(appt, "in-progress", appt.rule ? scope : "one")}
                  className="h-11 rounded-2xl bg-accent text-accent-foreground text-sm font-bold flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <PlayCircle className="size-4" aria-hidden="true" /> Start groom
                </button>
                <button
                  type="button"
                  onClick={() => onStatus(appt, "done", appt.rule ? scope : "one")}
                  className="h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Check className="size-4" aria-hidden="true" /> Complete
                </button>
                <button
                  type="button"
                  onClick={() => onStatus(appt, "cancelled", appt.rule ? scope : "one")}
                  className="h-11 rounded-2xl bg-secondary text-ink text-sm font-semibold flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-4" aria-hidden="true" /> Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(appt, appt.rule ? scope : "one")}
                  className="h-11 rounded-2xl ring-1 ring-black/10 text-ink-muted text-sm font-semibold flex items-center justify-center gap-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="size-4" aria-hidden="true" /> Remove
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
        <Icon className="size-3" aria-hidden="true" /> {label}
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
  onCreate: (
    a: Omit<Appt, "id" | "status">,
    repeat: { freq: Freq; interval: number; count: number } | null,
  ) => void;
}) {
  const [dog, setDog] = useState("");
  const [breed, setBreed] = useState("");
  const [owner, setOwner] = useState("");
  const [service, setService] = useState<string>(SERVICES[0]);
  const [groomer, setGroomer] = useState<string>("Alex");
  const [start, setStart] = useState("9");
  const [span, setSpan] = useState("1");
  const [repeat, setRepeat] = useState<"none" | Freq>("none");
  const [interval, setInterval] = useState("1");
  const [count, setCount] = useState("4");

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
    setRepeat("none");
    setInterval("1");
    setCount("4");
  }

  const submit = () => {
    if (!draft) return;
    if (!dog.trim()) {
      toast.error("Add the dog's name first");
      return;
    }
    onCreate(
      {
        groomer,
        date: draft.date,
        start: Number(start),
        span: Number(span),
        dog: dog.trim(),
        breed: breed.trim() || "Unknown breed",
        owner: owner.trim() || "Walk-in",
        service,
      },
      repeat === "none"
        ? null
        : {
            freq: repeat,
            interval: Math.max(1, Number(interval) || 1),
            count: clamp(Number(count) || 2, 2, 26),
          },
    );
  };

  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New appointment</DialogTitle>
          <DialogDescription>
            {draft
              ? `${new Date(`${draft.date}T00:00:00`).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })} — all fields except the dog's name are optional.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dog">Dog name</Label>
            <Input
              id="dog"
              value={dog}
              onChange={(e) => setDog(e.target.value)}
              placeholder="Bear"
              required
              autoFocus
            />
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
            <Label htmlFor="groomer">Groomer</Label>
            <Select value={groomer} onValueChange={setGroomer}>
              <SelectTrigger id="groomer" aria-label="Groomer">
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
            <Label htmlFor="service">Service</Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger id="service" aria-label="Service">
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
            <Label htmlFor="start">Start</Label>
            <Select value={start} onValueChange={setStart}>
              <SelectTrigger id="start" aria-label="Start time">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS.flatMap((h) => [h, h + STEP]).map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {fmtTime(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="duration">Duration</Label>
            <Select value={span} onValueChange={setSpan}>
              <SelectTrigger id="duration" aria-label="Duration">
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

          <fieldset className="sm:col-span-2 rounded-2xl bg-secondary/50 p-3 space-y-3">
            <legend className="px-1 text-[11px] font-bold uppercase tracking-widest text-ink-muted">
              Repeat
            </legend>
            <div role="radiogroup" aria-label="Repeat pattern" className="flex flex-wrap gap-2">
              {(
                [
                  ["none", "Does not repeat"],
                  ["daily", "Daily"],
                  ["weekly", "Weekly"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={repeat === v}
                  onClick={() => setRepeat(v)}
                  className={
                    "h-9 px-3 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                    (repeat === v
                      ? "bg-ink text-background"
                      : "bg-card text-ink-muted ring-1 ring-black/5")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            {repeat !== "none" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="interval">
                    Every ({repeat === "daily" ? "days" : "weeks"})
                  </Label>
                  <Input
                    id="interval"
                    type="number"
                    min={1}
                    max={8}
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="count">Number of visits</Label>
                  <Input
                    id="count"
                    type="number"
                    min={2}
                    max={26}
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                  />
                </div>
                <p className="col-span-2 text-[11px] text-ink-muted">
                  You can later change or cancel a single visit without touching the rest of the
                  series.
                </p>
              </div>
            )}
          </fieldset>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-2xl bg-secondary text-ink text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="h-11 px-5 rounded-2xl bg-accent text-accent-foreground text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Book appointment
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
