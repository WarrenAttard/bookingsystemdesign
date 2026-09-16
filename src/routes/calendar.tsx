import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/dashboard/AppShell";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Dog,
  Filter,
  GripHorizontal,
  History,
  Layers,
  PlayCircle,
  Plus,
  Redo2,
  Repeat,
  Trash2,
  Undo2,
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
import { buildIcs, downloadIcs, type IcsEvent } from "@/lib/ics";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Trusted Dog Groomers" },
      {
        name: "description",
        content:
          "Drag, repeat, export and audit grooming appointments on a single shared day and week calendar.",
      },
      { property: "og:title", content: "Calendar — Trusted Dog Groomers" },
      {
        property: "og:description",
        content: "Shared grooming schedule with drag-and-drop, recurring visits and ICS export.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalendarPage,
});

/* ---------------- constants & types ---------------- */

const OPENING = 8;
const CLOSING = 17;
const HOURS = Array.from({ length: CLOSING - OPENING }, (_, i) => OPENING + i);
const ROW = 60; // px per hour
const STEP = 0.25; // 15-minute snapping
const ACTOR = "Alex Sterling";
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
type Rule = { freq: Freq; interval: number; count: number };

type Appt = {
  id: string;
  groomer: string;
  date: string;
  start: number;
  span: number;
  dog: string;
  breed: string;
  owner: string;
  service: string;
  status: Status;
  warn?: string;
  seriesId?: string;
  rule?: Rule;
  edited?: boolean;
};

type Patch = Partial<Omit<Appt, "id" | "seriesId" | "rule" | "edited">>;

type Series = {
  id: string;
  firstDate: string;
  rule: Rule;
  base: Omit<Appt, "id" | "date" | "seriesId" | "rule" | "edited">;
  exceptions: Record<string, (Patch & { deleted?: boolean }) | undefined>;
};

type Data = { singles: Appt[]; series: Series[] };

type LogAction =
  | "created"
  | "moved"
  | "resized"
  | "edited"
  | "status"
  | "deleted"
  | "bulk"
  | "exported"
  | "undo"
  | "redo";

type LogEntry = {
  id: string;
  at: Date;
  actor: string;
  action: LogAction;
  subject: string; // dog name
  key: string; // appointment or series key for filtering
  detail: string;
};

/* ---------------- date helpers ---------------- */

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
  return addDays(d, -((d.getDay() + 6) % 7));
}
function fmtLong(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}
function fmtShort(s: string) {
  return parseIso(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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
function ruleDates(firstDate: string, rule: Rule) {
  const step = rule.freq === "weekly" ? rule.interval * 7 : rule.interval;
  const first = parseIso(firstDate);
  return Array.from({ length: rule.count }, (_, i) => iso(addDays(first, i * step)));
}
function ruleLabel(r: Rule) {
  const every =
    r.interval === 1
      ? r.freq === "daily"
        ? "Every day"
        : "Every week"
      : `Every ${r.interval} ${r.freq === "daily" ? "days" : "weeks"}`;
  return `${every} · ${r.count} visits`;
}

/* ---------------- seed ---------------- */

const SEED_SINGLES: Appt[] = [
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
    base: { groomer: "Jonas", start: 9, span: 2.5, dog: "Daisy", breed: "Maltipoo", owner: "L. Sciberras", service: "Dematting", status: "booked", warn: "Matted coat — extra time" },
    exceptions: {},
  },
  {
    id: "s2",
    firstDate: iso(ANCHOR),
    rule: { freq: "daily", interval: 1, count: 3 },
    base: { groomer: "Jonas", start: 15, span: 1, dog: "Simba", breed: "Pomeranian", owner: "N. Debono", service: "Nails + Bath", status: "booked" },
    exceptions: {},
  },
];

const STATUS_META: Record<Status, { label: string; chip: string }> = {
  booked: { label: "Booked", chip: "bg-primary/10 text-primary ring-1 ring-primary/20" },
  "in-progress": { label: "In progress", chip: "bg-accent/10 text-accent ring-1 ring-accent/20" },
  done: { label: "Done", chip: "bg-secondary text-ink-muted ring-1 ring-black/5" },
  cancelled: { label: "Cancelled", chip: "bg-secondary text-ink-muted ring-1 ring-black/5" },
};

// Google-Calendar-style: colour identifies the groomer, not the column.
const GROOMER_STYLE: Record<string, { block: string; dot: string }> = {
  Alex: { block: "bg-primary/15 text-ink border-l-4 border-primary", dot: "bg-primary" },
  Maria: { block: "bg-accent/12 text-ink border-l-4 border-accent", dot: "bg-accent" },
  Jonas: {
    block: "bg-[var(--status-booked)]/18 text-ink border-l-4 border-[var(--status-booked)]",
    dot: "bg-[var(--status-booked)]",
  },
};
const groomerStyle = (g: string) => GROOMER_STYLE[g] ?? GROOMER_STYLE.Alex;

function expand(s: Series): Appt[] {
  const out: Appt[] = [];
  for (const date of ruleDates(s.firstDate, s.rule)) {
    const ex = s.exceptions[date];
    if (ex?.deleted) continue;
    const { deleted: _d, ...patch } = ex ?? {};
    out.push({
      id: `${s.id}#${date}`,
      seriesId: s.id,
      rule: s.rule,
      date,
      edited: !!ex && Object.keys(patch).length > 0,
      ...s.base,
      ...patch,
    });
  }
  return out;
}

function describe(a: Appt) {
  return `${a.dog}, ${a.breed}, ${a.service} with ${a.groomer}, ${fmtShort(a.date)} ${fmtTime(
    a.start,
  )} to ${fmtTime(a.start + a.span)}, ${STATUS_META[a.status].label}${
    a.seriesId ? ", repeating appointment" : ""
  }${a.warn ? `, note: ${a.warn}` : ""}`;
}

function apptKey(a: Appt) {
  return a.seriesId ?? a.id;
}

function icsForAppt(a: Appt, series?: Series): IcsEvent[] {
  const description = `${a.breed} · ${a.service} · groomer ${a.groomer} · owner ${a.owner}${
    a.warn ? ` · note: ${a.warn}` : ""
  }`;
  if (!series) {
    return [
      {
        uid: `${a.id}@trusteddoggroomers`,
        date: a.date,
        start: a.start,
        span: a.span,
        title: `${a.dog} — ${a.service}`,
        description,
        location: "Trusted Dog Groomers",
        cancelled: a.status === "cancelled",
      },
    ];
  }
  const { rule, base, firstDate, exceptions } = series;
  const exdates = Object.entries(exceptions)
    .filter(([, v]) => v?.deleted)
    .map(([date]) => ({ date, start: base.start }));
  const events: IcsEvent[] = [
    {
      uid: `${series.id}@trusteddoggroomers`,
      date: firstDate,
      start: base.start,
      span: base.span,
      title: `${base.dog} — ${base.service}`,
      description: `${base.breed} · ${base.service} · groomer ${base.groomer} · owner ${base.owner}`,
      location: "Trusted Dog Groomers",
      rrule: `FREQ=${rule.freq === "weekly" ? "WEEKLY" : "DAILY"};INTERVAL=${rule.interval};COUNT=${rule.count}`,
      exdates: exdates.length ? exdates : undefined,
      cancelled: base.status === "cancelled",
    },
  ];
  for (const [date, ex] of Object.entries(exceptions)) {
    if (!ex || ex.deleted) continue;
    const merged = { ...base, ...ex };
    events.push({
      uid: `${series.id}@trusteddoggroomers`,
      recurrenceId: { date, start: base.start },
      date,
      start: merged.start,
      span: merged.span,
      title: `${merged.dog} — ${merged.service}`,
      description: `${merged.breed} · ${merged.service} · groomer ${merged.groomer}`,
      location: "Trusted Dog Groomers",
      cancelled: merged.status === "cancelled",
    });
  }
  return events;
}

/* ---------------- page ---------------- */

function CalendarPage() {
  const [data, setData] = useState<Data>({ singles: SEED_SINGLES, series: SEED_SERIES });
  const [past, setPast] = useState<Data[]>([]);
  const [future, setFuture] = useState<Data[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [view, setView] = useState<"day" | "week">("week");
  // phones get the single-day view by default — a 7-day grid is unreadable there
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches) setView("day");
  }, []);

  const [cursor, setCursor] = useState<Date>(ANCHOR);
  const [hidden, setHidden] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<null | { start: number; date: string }>(null);
  const [bulkFor, setBulkFor] = useState<string | null>(null); // series id
  const [logOpen, setLogOpen] = useState(false);
  const [live, setLive] = useState("");

  const announce = useCallback((m: string) => setLive(m), []);

  const addLog = useCallback((e: Omit<LogEntry, "id" | "at" | "actor">) => {
    setLog((prev) => [
      { ...e, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: new Date(), actor: ACTOR },
      ...prev,
    ]);
  }, []);

  /* history-aware mutation */
  const commit = useCallback((next: (d: Data) => Data) => {
    setData((cur) => {
      setPast((p) => [...p.slice(-49), cur]);
      setFuture([]);
      return next(cur);
    });
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) {
        toast.info("Nothing left to undo");
        return p;
      }
      const prev = p[p.length - 1];
      setData((cur) => {
        setFuture((f) => [cur, ...f]);
        return prev;
      });
      toast.success("Change undone");
      announce("Change undone");
      addLog({ action: "undo", subject: "Calendar", key: "calendar", detail: "Undid the last change" });
      return p.slice(0, -1);
    });
  }, [addLog, announce]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) {
        toast.info("Nothing left to redo");
        return f;
      }
      const next = f[0];
      setData((cur) => {
        setPast((p) => [...p, cur]);
        return next;
      });
      toast.success("Change redone");
      announce("Change redone");
      addLog({ action: "redo", subject: "Calendar", key: "calendar", detail: "Redid the last change" });
      return f.slice(1);
    });
  }, [addLog, announce]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== "z") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  /* derived */
  const all = useMemo(
    () => [...data.singles, ...data.series.flatMap(expand)],
    [data],
  );
  const visibleGroomers = GROOMERS.filter((g) => !hidden.includes(g));
  const visible = useMemo(() => all.filter((a) => !hidden.includes(a.groomer)), [all, hidden]);

  const weekStart = startOfWeek(cursor);
  const days = view === "day" ? [cursor] : Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayKeys = days.map(iso);
  const inRange = visible.filter((a) => dayKeys.includes(a.date));
  const booked = inRange.filter((a) => a.status !== "cancelled");
  const capacity = visibleGroomers.length * (CLOSING - OPENING) * days.length;
  const bookedHours = booked.reduce((s, a) => s + a.span, 0);

  const selectedAppt = all.find((a) => a.id === selected) ?? null;
  const selectedSeries =
    selectedAppt?.seriesId ? data.series.find((s) => s.id === selectedAppt.seriesId) ?? null : null;
  const bulkSeries = data.series.find((s) => s.id === bulkFor) ?? null;

  const shift = (n: number) => setCursor((c) => addDays(c, view === "day" ? n : n * 7));

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

  /* mutations */
  const patchAppt = useCallback(
    (appt: Appt, patch: Patch, scope: "one" | "all") => {
      commit((d) => {
        if (!appt.seriesId) {
          return {
            ...d,
            singles: d.singles.map((a) => (a.id === appt.id ? { ...a, ...patch } : a)),
          };
        }
        return {
          ...d,
          series: d.series.map((s) => {
            if (s.id !== appt.seriesId) return s;
            if (scope === "all") return { ...s, base: { ...s.base, ...patch }, exceptions: {} };
            return {
              ...s,
              exceptions: {
                ...s.exceptions,
                [appt.date]: { ...(s.exceptions[appt.date] ?? {}), ...patch },
              },
            };
          }),
        };
      });
    },
    [commit],
  );

  /* moving can change the date, which detaches a single occurrence from its series */
  const moveAppt = useCallback(
    (appt: Appt, next: { date: string; start: number; span: number }, mode: "moved" | "resized") => {
      if (next.date === appt.date && next.start === appt.start && next.span === appt.span) return;
      const detach = !!appt.seriesId && next.date !== appt.date;

      commit((d) => {
        if (!appt.seriesId) {
          return {
            ...d,
            singles: d.singles.map((a) => (a.id === appt.id ? { ...a, ...next } : a)),
          };
        }
        if (detach) {
          const { id: _i, seriesId: _s, rule: _r, edited: _e, ...rest } = appt;
          return {
            singles: [...d.singles, { ...rest, ...next, id: `d${Date.now()}` }],
            series: d.series.map((s) =>
              s.id === appt.seriesId
                ? { ...s, exceptions: { ...s.exceptions, [appt.date]: { deleted: true } } }
                : s,
            ),
          };
        }
        return {
          ...d,
          series: d.series.map((s) =>
            s.id === appt.seriesId
              ? {
                  ...s,
                  exceptions: {
                    ...s.exceptions,
                    [appt.date]: {
                      ...(s.exceptions[appt.date] ?? {}),
                      start: next.start,
                      span: next.span,
                    },
                  },
                }
              : s,
          ),
        };
      });

      const where = `${fmtShort(next.date)} ${fmtTime(next.start)}–${fmtTime(next.start + next.span)}`;
      const warn = clashes({ ...next, groomer: appt.groomer }, appt.id);
      const detail =
        mode === "resized"
          ? `Resized to ${next.span}h (${where})`
          : `Moved from ${fmtShort(appt.date)} ${fmtTime(appt.start)} to ${where}${
              detach ? " — detached from its series" : ""
            }`;
      addLog({ action: mode, subject: appt.dog, key: apptKey(appt), detail });
      if (warn) toast.warning(`${appt.dog} ${mode} to ${where} — overlaps another groom`);
      else toast.success(`${appt.dog} ${mode} to ${where}`);
      announce(`${appt.dog} ${mode} to ${where}${warn ? ". Warning: overlaps another groom" : ""}`);
    },
    [commit, clashes, addLog, announce],
  );

  const setStatus = (appt: Appt, status: Status, scope: "one" | "all") => {
    patchAppt(appt, { status }, scope);
    addLog({
      action: "status",
      subject: appt.dog,
      key: apptKey(appt),
      detail: `Marked ${STATUS_META[status].label.toLowerCase()}${
        scope === "all" ? " for the whole series" : ""
      }`,
    });
    toast.success(`Marked ${STATUS_META[status].label.toLowerCase()}`);
    announce(`${appt.dog} marked ${STATUS_META[status].label.toLowerCase()}`);
  };

  const editAppt = (appt: Appt, patch: Patch, scope: "one" | "all", what: string) => {
    patchAppt(appt, patch, scope);
    addLog({
      action: "edited",
      subject: appt.dog,
      key: apptKey(appt),
      detail: `${what}${scope === "all" ? " (whole series)" : ""}`,
    });
    toast.success(what);
    announce(`${appt.dog}: ${what}`);
  };

  const removeAppt = (appt: Appt, scope: "one" | "all") => {
    commit((d) => {
      if (!appt.seriesId) return { ...d, singles: d.singles.filter((a) => a.id !== appt.id) };
      if (scope === "all") return { ...d, series: d.series.filter((s) => s.id !== appt.seriesId) };
      return {
        ...d,
        series: d.series.map((s) =>
          s.id === appt.seriesId
            ? { ...s, exceptions: { ...s.exceptions, [appt.date]: { deleted: true } } }
            : s,
        ),
      };
    });
    setSelected(null);
    addLog({
      action: "deleted",
      subject: appt.dog,
      key: apptKey(appt),
      detail: scope === "all" ? "Deleted the whole repeating series" : `Deleted the ${fmtShort(appt.date)} visit`,
    });
    toast.success(scope === "all" ? "Whole series removed" : "Appointment removed");
    announce(scope === "all" ? "Whole series removed" : `${appt.dog} removed`);
  };

  const create = (a: Omit<Appt, "id" | "status">, repeat: Rule | null) => {
    if (clashes(a)) toast.warning(`${a.groomer} already has a dog in that slot`);
    if (repeat) {
      const id = `s${Date.now()}`;
      const { date, ...base } = a;
      commit((d) => ({
        ...d,
        series: [
          ...d.series,
          { id, firstDate: date, rule: repeat, base: { ...base, status: "booked" }, exceptions: {} },
        ],
      }));
      const dates = ruleDates(date, repeat);
      addLog({
        action: "created",
        subject: a.dog,
        key: id,
        detail: `Created repeating booking — ${ruleLabel(repeat).toLowerCase()}, ${fmtShort(
          dates[0],
        )} to ${fmtShort(dates[dates.length - 1])}`,
      });
      toast.success(`${a.dog} booked — ${ruleLabel(repeat).toLowerCase()}`);
    } else {
      const id = `n${Date.now()}`;
      commit((d) => ({ ...d, singles: [...d.singles, { ...a, id, status: "booked" }] }));
      addLog({
        action: "created",
        subject: a.dog,
        key: id,
        detail: `Created booking ${fmtShort(a.date)} ${fmtTime(a.start)} with ${a.groomer}`,
      });
      toast.success(`${a.dog} booked with ${a.groomer} at ${fmtTime(a.start)}`);
    }
    setDraft(null);
    announce(`${a.dog} booked with ${a.groomer} at ${fmtTime(a.start)}`);
  };

  const applyBulk = (
    series: Series,
    dates: string[],
    patch: Patch,
    wholeSeries: boolean,
    summary: string,
  ) => {
    commit((d) => ({
      ...d,
      series: d.series.map((s) => {
        if (s.id !== series.id) return s;
        if (wholeSeries) {
          const cleaned: Series["exceptions"] = {};
          for (const [date, ex] of Object.entries(s.exceptions)) {
            if (!ex) continue;
            const copy = { ...ex };
            for (const k of Object.keys(patch)) delete (copy as Record<string, unknown>)[k];
            cleaned[date] = copy;
          }
          return { ...s, base: { ...s.base, ...patch }, exceptions: cleaned };
        }
        const exceptions = { ...s.exceptions };
        for (const date of dates) exceptions[date] = { ...(exceptions[date] ?? {}), ...patch };
        return { ...s, exceptions };
      }),
    }));
    addLog({
      action: "bulk",
      subject: series.base.dog,
      key: series.id,
      detail: `${summary} — applied to ${wholeSeries ? "all" : dates.length} occurrence${
        wholeSeries || dates.length !== 1 ? "s" : ""
      }`,
    });
    toast.success(`Updated ${wholeSeries ? "all" : dates.length} occurrence(s)`);
    announce(`${summary} applied to ${wholeSeries ? "all" : dates.length} occurrences`);
    setBulkFor(null);
  };

  const exportAppt = (appt: Appt, series: Series | null) => {
    const events = icsForAppt(appt, series ?? undefined);
    downloadIcs(
      `${appt.dog.toLowerCase()}-${series ? "series" : appt.date}`,
      buildIcs(events, `${appt.dog} — Trusted Dog Groomers`),
    );
    addLog({
      action: "exported",
      subject: appt.dog,
      key: apptKey(appt),
      detail: series ? "Exported the whole series to a calendar file" : "Exported to a calendar file",
    });
    toast.success("Calendar file downloaded");
  };

  const exportRange = () => {
    const singles = data.singles.filter(
      (a) => dayKeys.includes(a.date) && !hidden.includes(a.groomer),
    );
    const seriesHere = data.series.filter(
      (s) =>
        !hidden.includes(s.base.groomer) &&
        expand(s).some((o) => dayKeys.includes(o.date)),
    );
    const events = [
      ...singles.flatMap((a) => icsForAppt(a)),
      ...seriesHere.flatMap((s) => icsForAppt({ ...s.base, id: s.id, date: s.firstDate }, s)),
    ];
    if (events.length === 0) {
      toast.info("Nothing to export in this range");
      return;
    }
    downloadIcs(
      view === "day" ? `schedule-${iso(cursor)}` : `schedule-week-${iso(weekStart)}`,
      buildIcs(events),
    );
    addLog({
      action: "exported",
      subject: "Schedule",
      key: "calendar",
      detail: `Exported ${events.length} appointments for ${
        view === "day" ? fmtLong(cursor) : `week of ${fmtLong(weekStart)}`
      }`,
    });
    toast.success(`${events.length} appointments exported`);
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
      <nav
        aria-label="Calendar controls"
        className="px-4 sm:px-6 lg:px-10 pb-4 flex flex-wrap items-center gap-2 justify-between flex-none"
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
                    "h-8 pl-2 pr-3 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                    (on ? "bg-card text-ink ring-1 ring-black/10" : "bg-secondary text-ink-muted ring-1 ring-black/5")
                  }
                >
                  <span
                    className={"size-2.5 rounded-full " + (on ? groomerStyle(g).dot : "bg-ink-muted/40")}
                    aria-hidden="true"
                  />
                  {g}
                </button>
              );
            })}
          </div>

          <span className="hidden xl:inline ml-2 text-sm text-ink-muted">
            {booked.length} appointments · {Math.round((bookedHours / Math.max(capacity, 1)) * 100)}%
            booked
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Undo and redo" className="flex items-center gap-1">
            <button
              type="button"
              onClick={undo}
              disabled={past.length === 0}
              aria-label={`Undo last change${past.length ? "" : " — nothing to undo"}`}
              className="size-10 rounded-xl bg-card ring-1 ring-black/5 flex items-center justify-center text-ink-muted hover:text-ink disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Undo2 className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={future.length === 0}
              aria-label={`Redo change${future.length ? "" : " — nothing to redo"}`}
              className="size-10 rounded-xl bg-card ring-1 ring-black/5 flex items-center justify-center text-ink-muted hover:text-ink disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Redo2 className="size-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setLogOpen(true)}
            className="h-10 px-4 rounded-xl bg-card ring-1 ring-black/5 text-sm font-medium flex items-center gap-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <History className="size-4" aria-hidden="true" /> Activity
            {log.length > 0 && (
              <span className="text-[10px] font-bold rounded-full bg-ink text-background px-1.5 py-0.5">
                {log.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={exportRange}
            className="h-10 px-4 rounded-xl bg-card ring-1 ring-black/5 text-sm font-medium flex items-center gap-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download className="size-4" aria-hidden="true" /> Export
          </button>
          <button
            type="button"
            onClick={() => setDraft({ start: 9, date: iso(view === "day" ? cursor : weekStart) })}
            className="h-10 px-5 rounded-2xl bg-accent text-accent-foreground text-sm font-bold flex items-center gap-2 shadow-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-4" aria-hidden="true" /> New
          </button>
        </div>
      </nav>

      <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-10 pb-6 lg:pb-10">
        <TimeGrid
          days={days}
          appts={inRange}
          onSelect={setSelected}
          onSlot={(date, start) => setDraft({ date, start })}
          onMove={moveAppt}
          onRemove={(a) => removeAppt(a, "one")}
        />
      </div>

      <p aria-live="polite" className="sr-only">
        {live}
      </p>

      <ApptSheet
        appt={selectedAppt}
        series={selectedSeries}
        log={log.filter((l) => selectedAppt && l.key === apptKey(selectedAppt))}
        onClose={() => setSelected(null)}
        onStatus={setStatus}
        onDelete={removeAppt}
        onEdit={editAppt}
        onExport={exportAppt}
        onBulk={(s) => {
          setSelected(null);
          setBulkFor(s.id);
        }}
      />
      <NewApptDialog draft={draft} onClose={() => setDraft(null)} onCreate={create} />
      <BulkEditDialog
        series={bulkSeries}
        occurrences={bulkSeries ? expand(bulkSeries) : []}
        onClose={() => setBulkFor(null)}
        onApply={applyBulk}
      />
      <ActivityLogSheet open={logOpen} onClose={() => setLogOpen(false)} log={log} />
    </AppShell>
  );
}

/* ---------------- time grid (Google-style) ---------------- */

type DragState = {
  id: string;
  mode: "move" | "resize";
  origin: { date: string; start: number; span: number };
  pointerStartY: number;
  preview: { date: string; start: number; span: number };
};

function layout(list: Appt[]) {
  const sorted = [...list].sort((a, b) => a.start - b.start || b.span - a.span);
  const placement = new Map<string, { lane: number; of: number; cols: number }>();
  const clusters: Appt[][] = [];
  let cluster: Appt[] = [];
  let clusterEnd = -1;

  for (const a of sorted) {
    if (cluster.length && a.start >= clusterEnd) {
      clusters.push(cluster);
      cluster = [];
      clusterEnd = -1;
    }
    cluster.push(a);
    clusterEnd = Math.max(clusterEnd, a.start + a.span);
  }
  if (cluster.length) clusters.push(cluster);

  const overlaps = (x: Appt, y: Appt) => x.start < y.start + y.span && y.start < x.start + x.span;

  for (const c of clusters) {
    const ends: number[] = [];
    const laneOf = new Map<string, number>();
    for (const a of c) {
      let lane = ends.findIndex((e) => e <= a.start);
      if (lane === -1) {
        lane = ends.length;
        ends.push(0);
      }
      ends[lane] = a.start + a.span;
      laneOf.set(a.id, lane);
    }
    const of = Math.max(ends.length, 1);
    for (const a of c) {
      const lane = laneOf.get(a.id)!;
      // grow rightwards into free lanes so cards stay readable
      let cols = 1;
      while (lane + cols < of) {
        const blocked = c.some((b) => b.id !== a.id && laneOf.get(b.id) === lane + cols && overlaps(a, b));
        if (blocked) break;
        cols += 1;
      }
      placement.set(a.id, { lane, of, cols });
    }
  }
  return placement;
}


function TimeGrid({
  days,
  appts,
  onSelect,
  onSlot,
  onMove,
  onRemove,
}: {
  days: Date[];
  appts: Appt[];
  onSelect: (id: string) => void;
  onSlot: (date: string, start: number) => void;
  onMove: (a: Appt, next: { date: string; start: number; span: number }, mode: "moved" | "resized") => void;
  onRemove: (a: Appt) => void;
}) {
  const colsRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;
  const height = HOURS.length * ROW;
  const dayKeys = days.map(iso);

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      const box = colsRef.current;
      if (!d || !box) return;
      const rect = box.getBoundingClientRect();
      const delta = (e.clientY - d.pointerStartY) / ROW;
      if (d.mode === "move") {
        const colW = rect.width / days.length;
        const idx = clamp(Math.floor((e.clientX - rect.left) / colW), 0, days.length - 1);
        const start = clamp(snap(d.origin.start + delta), OPENING, CLOSING - d.origin.span);
        setDrag({ ...d, preview: { date: dayKeys[idx], start, span: d.origin.span } });
      } else {
        const span = clamp(snap(d.origin.span + delta), STEP * 2, CLOSING - d.preview.start);
        setDrag({ ...d, preview: { ...d.preview, span } });
      }
    };
    const up = () => {
      const d = dragRef.current;
      setDrag(null);
      if (!d) return;
      const appt = appts.find((a) => a.id === d.id);
      if (appt) onMove(appt, d.preview, d.mode === "resize" ? "resized" : "moved");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, appts, onMove, days.length]);

  const startDrag = (e: React.PointerEvent, a: Appt, mode: "move" | "resize") => {
    if (e.button !== 0) return;
    e.preventDefault();
    setDrag({
      id: a.id,
      mode,
      origin: { date: a.date, start: a.start, span: a.span },
      pointerStartY: e.clientY,
      preview: { date: a.date, start: a.start, span: a.span },
    });
  };

  const onKey = (e: React.KeyboardEvent, a: Appt) => {
    const idx = dayKeys.indexOf(a.date);
    let next: { date: string; start: number; span: number } | null = null;
    let mode: "moved" | "resized" = "moved";
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const dir = e.key === "ArrowDown" ? 1 : -1;
      if (e.shiftKey) {
        next = { date: a.date, start: a.start, span: clamp(a.span + dir * STEP * 2, STEP * 2, CLOSING - a.start) };
        mode = "resized";
      } else {
        next = { date: a.date, start: clamp(a.start + dir * STEP * 2, OPENING, CLOSING - a.span), span: a.span };
      }
    } else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && days.length > 1) {
      const to = clamp(idx + (e.key === "ArrowRight" ? 1 : -1), 0, days.length - 1);
      next = { date: dayKeys[to], start: a.start, span: a.span };
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(a.id);
      return;
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onRemove(a);
      return;
    } else return;
    e.preventDefault();
    if (next) onMove(a, next, mode);
  };

  return (
    <section
      aria-label={days.length === 1 ? `Schedule for ${fmtLong(days[0])}` : "Week schedule"}
      className={
        "bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-3 sm:p-6 " +
        (days.length === 1 ? "min-w-0" : "min-w-[720px]")
      }
    >
      <div className="flex gap-1.5 sm:gap-2">
        <div className="w-10 sm:w-14 shrink-0">

          <div className="h-14" />
          <div className="relative" style={{ height }} aria-hidden="true">
            {[...HOURS, CLOSING].map((h) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] font-mono text-ink-muted"
                style={{ top: (h - OPENING) * ROW }}
              >
                {fmtTime(h)}
              </div>
            ))}
          </div>
        </div>

        <div
          ref={colsRef}
          className="grid flex-1 gap-1.5 sm:gap-2"
          style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
        >
          {days.map((d) => (
            <div key={`h-${iso(d)}`} className="h-14 px-2 flex flex-col justify-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">
                {d.toLocaleDateString("en-GB", { weekday: "short" })}
              </p>
              <p className="text-lg font-semibold text-ink leading-tight">
                {d.getDate()}{" "}
                <span className="text-xs font-normal text-ink-muted">
                  {d.toLocaleDateString("en-GB", { month: "short" })}
                </span>
              </p>
            </div>
          ))}

          {days.map((d) => {
            const key = iso(d);
            const list = appts.filter((a) => a.date === key);
            const place = layout(list);
            return (
              <div
                key={`c-${key}`}
                className="relative rounded-2xl bg-secondary/30 overflow-hidden"
                style={{ height }}
              >
                {HOURS.flatMap((h) => [h, h + 0.5]).map((h) => (
                  <button
                    key={`s-${key}-${h}`}
                    type="button"
                    onClick={() => onSlot(key, h)}
                    aria-label={`Book ${fmtTime(h)} on ${fmtLong(d)}`}
                    className={
                      "absolute left-0 right-0 text-ink-muted opacity-0 hover:opacity-100 focus-visible:opacity-100 hover:bg-primary/5 flex items-center justify-center text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring " +
                      (Number.isInteger(h) ? "border-t border-black/[0.06]" : "border-t border-dashed border-black/[0.04]")
                    }
                    style={{ top: (h - OPENING) * ROW, height: ROW / 2 }}
                  >
                    <Plus className="size-3" aria-hidden="true" />
                  </button>
                ))}

                {list.map((a) => {
                  const dragging = drag?.id === a.id;
                  if (dragging && drag.preview.date !== key) return null;
                  const pos = dragging ? drag.preview : a;
                  const p = place.get(a.id) ?? { lane: 0, of: 1, cols: 1 };
                  const lanes = Math.max(p.of, 1);
                  const cols = Math.max(1, Math.min(p.cols, lanes - p.lane));
                  const widthPct = (cols / lanes) * 100;
                  const leftPct = (p.lane / lanes) * 100;
                  // when crowded, cards overlap slightly like Google Calendar
                  const crowded = lanes > 1;
                  const indent = crowded ? p.lane * 4 : 0;
                  const bleed = crowded && p.lane + cols < lanes ? 12 : 0;
                  const st = groomerStyle(a.groomer);
                  const compact = pos.span <= 0.75;
                  const narrow = widthPct < 48;
                  return (
                    <div
                      key={a.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${describe(a)}. Arrow keys move, shift plus up or down resizes, Enter opens details, Delete removes.`}
                      onKeyDown={(e) => onKey(e, a)}
                      onPointerDown={(e) => startDrag(e, a, "move")}
                      onClick={() => !drag && onSelect(a.id)}
                      style={
                        {
                          top: (pos.start - OPENING) * ROW + 2,
                          height: pos.span * ROW - 4,
                          "--l": `calc(${leftPct}% + ${3 + indent}px)`,
                          "--w": `calc(${widthPct}% - ${6 + indent}px + ${bleed}px)`,
                          zIndex: dragging ? 60 : 10 + p.lane,
                        } as React.CSSProperties
                      }
                      className={
                        "absolute left-[var(--l)] w-[var(--w)] transition-[left,width,box-shadow] duration-150 select-none touch-none overflow-hidden rounded-lg px-2 py-1 cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink " +
                        (crowded && !dragging
                          ? "hover:left-[3px] hover:w-[calc(100%-6px)] hover:z-50 focus-within:left-[3px] focus-within:w-[calc(100%-6px)] focus-within:z-50 "
                          : "") +
                        (crowded ? "shadow-md ring-1 ring-white/70 " : "shadow-sm ") +
                        (dragging ? "ring-2 ring-ink shadow-lg " : "hover:brightness-[0.97] hover:shadow-lg ") +

                        (a.status === "cancelled" ? "line-through opacity-60 " : "") +
                        (a.status === "done" ? "opacity-75 " : "") +
                        st.block
                      }
                    >
                      <div className="flex items-center gap-1">
                        <p className="text-[11px] sm:text-xs font-bold leading-tight truncate flex-1">{a.dog}</p>
                        {a.seriesId && !narrow && <Repeat className="size-3 shrink-0 opacity-70" aria-hidden="true" />}
                        {a.warn && <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />}
                      </div>
                      {!compact && (
                        <>
                          <p className="text-[10px] font-mono opacity-75 leading-tight truncate">
                            {narrow ? fmtTime(pos.start) : `${fmtTime(pos.start)}–${fmtTime(pos.start + pos.span)}`}
                          </p>
                          {!narrow && (
                            <p className="text-[10px] opacity-75 truncate">
                              {a.service} · {a.groomer}
                            </p>
                          )}
                        </>
                      )}

                      <span
                        role="slider"
                        tabIndex={0}
                        aria-label={`Resize ${a.dog}, currently ${pos.span} hours`}
                        aria-valuemin={0.5}
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
                              date: a.date,
                              start: a.start,
                              span: clamp(a.span + dir * STEP * 2, STEP * 2, CLOSING - a.start),
                            },
                            "resized",
                          );
                        }}
                        className="absolute inset-x-0 bottom-0 h-4 sm:h-2.5 flex items-center justify-center cursor-ns-resize opacity-50 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                      >
                        <GripHorizontal className="size-3" aria-hidden="true" />
                      </span>
                    </div>
                  );
                })}

                {drag && drag.preview.date === key && !list.some((a) => a.id === drag.id) && (
                  <div
                    aria-hidden="true"
                    className="absolute z-20 left-1 right-1 rounded-lg ring-2 ring-dashed ring-ink/50 bg-ink/5"
                    style={{
                      top: (drag.preview.start - OPENING) * ROW + 2,
                      height: drag.preview.span * ROW - 4,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
        <div className="flex flex-wrap items-center gap-4">
          {GROOMERS.map((g) => (
            <span key={g} className="flex items-center gap-2">
              <span className={"size-2.5 rounded-full " + groomerStyle(g).dot} aria-hidden="true" /> {g}
            </span>
          ))}
        </div>
        <span>
          Drag to move · drag the bottom edge to resize · Ctrl/⌘+Z undo, Ctrl/⌘+Shift+Z redo
        </span>
      </div>
    </section>
  );
}

/* ---------------- detail sheet ---------------- */

function ApptSheet({
  appt,
  series,
  log,
  onClose,
  onStatus,
  onDelete,
  onEdit,
  onExport,
  onBulk,
}: {
  appt: Appt | null;
  series: Series | null;
  log: LogEntry[];
  onClose: () => void;
  onStatus: (a: Appt, s: Status, scope: "one" | "all") => void;
  onDelete: (a: Appt, scope: "one" | "all") => void;
  onEdit: (a: Appt, patch: Patch, scope: "one" | "all", what: string) => void;
  onExport: (a: Appt, series: Series | null) => void;
  onBulk: (s: Series) => void;
}) {
  const [scope, setScope] = useState<"one" | "all">("one");
  useEffect(() => setScope("one"), [appt?.id]);
  const effective = (a: Appt) => (a.rule ? scope : "one");

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

            <div className="px-4 pb-8 space-y-4">
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

              {series && appt.rule && (
                <fieldset className="rounded-2xl bg-secondary/60 p-3 space-y-3">
                  <legend className="sr-only">Repeating appointment</legend>
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Repeat className="size-4" aria-hidden="true" /> {ruleLabel(appt.rule)}
                  </p>
                  <RangePreview
                    dates={ruleDates(series.firstDate, series.rule)}
                    highlight={[appt.date]}
                    skipped={Object.entries(series.exceptions)
                      .filter(([, v]) => v?.deleted)
                      .map(([d]) => d)}
                  />
                  {appt.edited && (
                    <p className="text-[11px] text-ink-muted">
                      This visit has been edited separately from the rest of the series.
                    </p>
                  )}
                  <div role="radiogroup" aria-label="Apply changes to" className="flex flex-wrap gap-2">
                    {(
                      [
                        ["one", "This visit"],
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
                          (scope === v ? "bg-ink text-background" : "bg-card text-ink-muted ring-1 ring-black/5")
                        }
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => onBulk(series)}
                      className="h-9 px-3 rounded-xl text-xs font-semibold bg-card text-ink ring-1 ring-black/10 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Layers className="size-3.5" aria-hidden="true" /> Bulk edit…
                    </button>
                  </div>
                </fieldset>
              )}

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Field icon={CalendarDays} label="Date">
                  {fmtShort(appt.date)}
                </Field>
                <Field icon={Clock} label="Time">
                  {fmtTime(appt.start)} – {fmtTime(appt.start + appt.span)}
                </Field>
                <Field icon={User} label="Groomer">
                  {appt.groomer}
                </Field>
                <Field icon={Dog} label="Service">
                  {appt.service}
                </Field>
              </dl>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-start">Start time</Label>
                  <Select
                    value={String(appt.start)}
                    onValueChange={(v) =>
                      onEdit(
                        appt,
                        { start: clamp(Number(v), OPENING, CLOSING - appt.span) },
                        effective(appt),
                        `Start time changed to ${fmtTime(Number(v))}`,
                      )
                    }
                  >
                    <SelectTrigger id="edit-start" aria-label="Start time">
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
                  <Label htmlFor="edit-groomer">Groomer</Label>
                  <Select
                    value={appt.groomer}
                    onValueChange={(v) =>
                      onEdit(appt, { groomer: v }, effective(appt), `Groomer changed to ${v}`)
                    }
                  >
                    <SelectTrigger id="edit-groomer" aria-label="Groomer">
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
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onStatus(appt, "in-progress", effective(appt))}
                  className="h-11 rounded-2xl bg-accent text-accent-foreground text-sm font-bold flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <PlayCircle className="size-4" aria-hidden="true" /> Start groom
                </button>
                <button
                  type="button"
                  onClick={() => onStatus(appt, "done", effective(appt))}
                  className="h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Check className="size-4" aria-hidden="true" /> Complete
                </button>
                <button
                  type="button"
                  onClick={() => onStatus(appt, "cancelled", effective(appt))}
                  className="h-11 rounded-2xl bg-secondary text-ink text-sm font-semibold flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-4" aria-hidden="true" /> Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(appt, effective(appt))}
                  className="h-11 rounded-2xl ring-1 ring-black/10 text-ink-muted text-sm font-semibold flex items-center justify-center gap-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="size-4" aria-hidden="true" /> Remove
                </button>
                <button
                  type="button"
                  onClick={() => onExport(appt, null)}
                  className="h-11 rounded-2xl bg-secondary text-ink text-sm font-semibold flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Download className="size-4" aria-hidden="true" /> Export visit
                </button>
                <button
                  type="button"
                  disabled={!series}
                  onClick={() => series && onExport(appt, series)}
                  className="h-11 rounded-2xl bg-secondary text-ink text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Download className="size-4" aria-hidden="true" /> Export series
                </button>
              </div>

              <section aria-label="Activity for this appointment" className="pt-2">
                <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-ink-muted">
                  <History className="size-3.5" aria-hidden="true" /> Activity
                </h3>
                <LogList entries={log} empty="No changes recorded for this appointment yet." />
              </section>
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

/* ---------------- shared bits ---------------- */

const ACTION_LABEL: Record<LogAction, string> = {
  created: "Created",
  moved: "Moved",
  resized: "Resized",
  edited: "Edited",
  status: "Status",
  deleted: "Deleted",
  bulk: "Bulk edit",
  exported: "Exported",
  undo: "Undo",
  redo: "Redo",
};

function LogList({ entries, empty }: { entries: LogEntry[]; empty: string }) {
  if (entries.length === 0)
    return <p className="mt-2 text-xs text-ink-muted/80">{empty}</p>;
  return (
    <ul className="mt-2 space-y-2">
      {entries.map((e) => (
        <li key={e.id} className="rounded-2xl bg-secondary/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
              {ACTION_LABEL[e.action]} · {e.subject}
            </span>
            <time className="text-[10px] font-mono text-ink-muted">
              {e.at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </time>
          </div>
          <p className="text-sm text-ink mt-1">{e.detail}</p>
          <p className="text-[11px] text-ink-muted mt-0.5">by {e.actor}</p>
        </li>
      ))}
    </ul>
  );
}

function ActivityLogSheet({
  open,
  onClose,
  log,
}: {
  open: boolean;
  onClose: () => void;
  log: LogEntry[];
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="size-5" aria-hidden="true" /> Appointment activity
          </SheetTitle>
          <SheetDescription>
            Who created, edited, moved, resized or deleted each appointment in this session.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-8">
          <LogList entries={log} empty="Nothing has changed yet — actions will appear here." />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function RangePreview({
  dates,
  highlight = [],
  skipped = [],
  selected,
}: {
  dates: string[];
  highlight?: string[];
  skipped?: string[];
  selected?: string[];
}) {
  if (dates.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold text-ink">
        {fmtShort(dates[0])} → {fmtShort(dates[dates.length - 1])} · {dates.length} visits
      </p>
      <ul className="flex flex-wrap gap-1.5 list-none">
        {dates.map((d) => {
          const isSkipped = skipped.includes(d);
          const isSel = selected ? selected.includes(d) : highlight.includes(d);
          return (
            <li
              key={d}
              className={
                "text-[11px] font-mono px-2 py-1 rounded-lg " +
                (isSkipped
                  ? "bg-secondary text-ink-muted/60 line-through"
                  : isSel
                    ? "bg-ink text-background font-bold"
                    : "bg-card text-ink-muted ring-1 ring-black/10")
              }
            >
              {fmtShort(d)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------- bulk edit ---------------- */

function BulkEditDialog({
  series,
  occurrences,
  onClose,
  onApply,
}: {
  series: Series | null;
  occurrences: Appt[];
  onClose: () => void;
  onApply: (s: Series, dates: string[], patch: Patch, whole: boolean, summary: string) => void;
}) {
  const [mode, setMode] = useState<"all" | "future" | "pick">("all");
  const [from, setFrom] = useState<string>("");
  const [picked, setPicked] = useState<string[]>([]);
  const [start, setStart] = useState("keep");
  const [span, setSpan] = useState("keep");
  const [groomer, setGroomer] = useState("keep");
  const [status, setStatus] = useState("keep");
  const [confirming, setConfirming] = useState(false);

  const dates = occurrences.map((o) => o.date);
  const key = series?.id ?? "";
  const [lastKey, setLastKey] = useState("");
  if (series && key !== lastKey) {
    setLastKey(key);
    setMode("all");
    setFrom(dates[0] ?? "");
    setPicked([]);
    setStart("keep");
    setSpan("keep");
    setGroomer("keep");
    setStatus("keep");
    setConfirming(false);
  }

  const affected =
    mode === "all" ? dates : mode === "future" ? dates.filter((d) => d >= from) : picked;

  const patch: Patch = {};
  if (start !== "keep") patch.start = Number(start);
  if (span !== "keep") patch.span = Number(span);
  if (groomer !== "keep") patch.groomer = groomer;
  if (status !== "keep") patch.status = status as Status;

  const summaryBits = [
    start !== "keep" ? `start ${fmtTime(Number(start))}` : null,
    span !== "keep" ? `duration ${span}h` : null,
    groomer !== "keep" ? `groomer ${groomer}` : null,
    status !== "keep" ? `status ${STATUS_META[status as Status].label.toLowerCase()}` : null,
  ].filter(Boolean);
  const summary = summaryBits.length ? `Set ${summaryBits.join(", ")}` : "No changes";

  const apply = () => {
    if (!series) return;
    if (summaryBits.length === 0) {
      toast.error("Choose at least one thing to change");
      return;
    }
    if (affected.length === 0) {
      toast.error("Select at least one visit");
      return;
    }
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onApply(series, affected, patch, mode === "all", summary);
  };

  return (
    <Dialog open={!!series} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="size-5" aria-hidden="true" /> Bulk edit repeating appointment
          </DialogTitle>
          <DialogDescription>
            {series
              ? `${series.base.dog} · ${ruleLabel(series.rule)} — choose which visits to update, then confirm.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        {series && (
          <div className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">
                Which visits
              </legend>
              <div role="radiogroup" aria-label="Which visits to update" className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "All visits"],
                    ["future", "This visit and later"],
                    ["pick", "Pick visits"],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={mode === v}
                    onClick={() => {
                      setMode(v);
                      setConfirming(false);
                    }}
                    className={
                      "h-9 px-3 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                      (mode === v ? "bg-ink text-background" : "bg-secondary text-ink-muted")
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>

              {mode === "future" && (
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="from-date">Starting from</Label>
                  <Select value={from} onValueChange={setFrom}>
                    <SelectTrigger id="from-date" aria-label="Starting from">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dates.map((d) => (
                        <SelectItem key={d} value={d}>
                          {fmtShort(d)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {mode === "pick" && (
                <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 list-none pt-1">
                  {dates.map((d) => {
                    const on = picked.includes(d);
                    return (
                      <li key={d}>
                        <label className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 h-10 cursor-pointer text-xs font-semibold">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => {
                              setPicked((p) => (on ? p.filter((x) => x !== d) : [...p, d]));
                              setConfirming(false);
                            }}
                            className="size-4 accent-[var(--color-ink)]"
                          />
                          {fmtShort(d)}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </fieldset>

            <div className="rounded-2xl bg-secondary/50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted mb-2">
                Affected dates
              </p>
              <RangePreview dates={dates} selected={affected} />
            </div>

            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className="text-[11px] font-bold uppercase tracking-widest text-ink-muted mb-1">
                What changes
              </legend>
              <div className="space-y-1.5">
                <Label htmlFor="bulk-start">Start time</Label>
                <Select value={start} onValueChange={(v) => { setStart(v); setConfirming(false); }}>
                  <SelectTrigger id="bulk-start" aria-label="New start time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep as is</SelectItem>
                    {HOURS.flatMap((h) => [h, h + 0.5]).map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {fmtTime(h)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bulk-span">Duration</Label>
                <Select value={span} onValueChange={(v) => { setSpan(v); setConfirming(false); }}>
                  <SelectTrigger id="bulk-span" aria-label="New duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep as is</SelectItem>
                    {["0.5", "1", "1.5", "2", "2.5", "3"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}h
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bulk-groomer">Groomer</Label>
                <Select value={groomer} onValueChange={(v) => { setGroomer(v); setConfirming(false); }}>
                  <SelectTrigger id="bulk-groomer" aria-label="New groomer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep as is</SelectItem>
                    {GROOMERS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bulk-status">Status</Label>
                <Select value={status} onValueChange={(v) => { setStatus(v); setConfirming(false); }}>
                  <SelectTrigger id="bulk-status" aria-label="New status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep as is</SelectItem>
                    {(Object.keys(STATUS_META) as Status[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_META[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </fieldset>

            <p
              aria-live="polite"
              className={
                "rounded-2xl p-3 text-sm " +
                (confirming ? "bg-accent/10 text-accent font-semibold" : "bg-secondary/60 text-ink-muted")
              }
            >
              {confirming
                ? `Confirm: ${summary.toLowerCase()} on ${affected.length} visit${
                    affected.length === 1 ? "" : "s"
                  } (${affected.map(fmtShort).join(", ")}). Press Apply again to save.`
                : `${summary} · ${affected.length} visit${affected.length === 1 ? "" : "s"} selected.`}
            </p>
          </div>
        )}

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
            onClick={apply}
            className="h-11 px-5 rounded-2xl bg-accent text-accent-foreground text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {confirming ? "Apply changes" : "Review changes"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- new appointment ---------------- */

function NewApptDialog({
  draft,
  onClose,
  onCreate,
}: {
  draft: { start: number; date: string } | null;
  onClose: () => void;
  onCreate: (a: Omit<Appt, "id" | "status">, repeat: Rule | null) => void;
}) {
  const [dog, setDog] = useState("");
  const [breed, setBreed] = useState("");
  const [owner, setOwner] = useState("");
  const [service, setService] = useState<string>(SERVICES[0]);
  const [groomer, setGroomer] = useState<string>("Alex");
  const [start, setStart] = useState("9");
  const [span, setSpan] = useState("1");
  const [repeat, setRepeat] = useState<"none" | Freq>("none");
  const [interval, setIntervalValue] = useState("1");
  const [count, setCount] = useState("4");

  const key = draft ? `${draft.start}-${draft.date}` : "";
  const [lastKey, setLastKey] = useState("");
  if (draft && key !== lastKey) {
    setLastKey(key);
    setStart(String(draft.start));
    setDog("");
    setBreed("");
    setOwner("");
    setSpan("1");
    setService(SERVICES[0]);
    setRepeat("none");
    setIntervalValue("1");
    setCount("4");
  }

  const rule: Rule | null =
    repeat === "none"
      ? null
      : {
          freq: repeat,
          interval: clamp(Number(interval) || 1, 1, 8),
          count: clamp(Number(count) || 2, 2, 26),
        };
  const previewDates = draft && rule ? ruleDates(draft.date, rule) : [];

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
      rule,
    );
  };

  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New appointment</DialogTitle>
          <DialogDescription>
            {draft
              ? `${parseIso(draft.date).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })} — only the dog's name is required.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dog">Dog name</Label>
            <Input id="dog" value={dog} onChange={(e) => setDog(e.target.value)} placeholder="Bear" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="breed">Breed</Label>
            <Input id="breed" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Goldendoodle" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="owner">Owner</Label>
            <Input id="owner" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="T. Grech" />
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
                {HOURS.flatMap((h) => [h, h + 0.5]).map((h) => (
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
                    (repeat === v ? "bg-ink text-background" : "bg-card text-ink-muted ring-1 ring-black/5")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            {repeat !== "none" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="interval">Every ({repeat === "daily" ? "days" : "weeks"})</Label>
                  <Input
                    id="interval"
                    type="number"
                    min={1}
                    max={8}
                    value={interval}
                    onChange={(e) => setIntervalValue(e.target.value)}
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
                <div className="col-span-2 rounded-xl bg-card p-3 ring-1 ring-black/5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted mb-2">
                    Dates this will book
                  </p>
                  <RangePreview dates={previewDates} highlight={previewDates.slice(0, 1)} />
                </div>
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
            {rule ? `Book ${previewDates.length} visits` : "Book appointment"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
