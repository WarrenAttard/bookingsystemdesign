import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/AppShell";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertTriangle,
  CalendarCheck,
  Check,
  Lock,
  LockOpen,
  Minus,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  DAYS,
  DAY_DATES,
  INITIAL_DEMAND,
  INITIAL_STAFF,
  OPEN,
  CLOSE,
  coverageFor,
  fmtHour,
  fmtRange,
  generateWeek,
  nextStatus,
  statusLabel,
  type AvailStatus,
  type Shift,
  type Staff,
} from "@/lib/rota";

export const Route = createFileRoute("/timetable")({
  head: () => ({
    meta: [
      { title: "Rota & Availability — Pawline" },
      {
        name: "description",
        content:
          "Record each groomer's weekly availability, then generate a rota that respects windows, leave and hour caps.",
      },
      { property: "og:title", content: "Rota & Availability — Pawline" },
      {
        property: "og:description",
        content: "Availability-driven weekly rota with locked shifts and uncovered-hour warnings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TimetablePage,
});

const HOURS = Array.from({ length: CLOSE - OPEN + 1 }, (_, i) => OPEN + i);

function TimetablePage() {
  const [staff, setStaff] = useState<Staff[]>(INITIAL_STAFF);
  const [demand, setDemand] = useState<number[]>(INITIAL_DEMAND);
  const [locked, setLocked] = useState<Record<string, Shift>>({});
  const [tab, setTab] = useState<"rota" | "availability">("rota");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const result = useMemo(() => generateWeek(staff, demand, locked), [staff, demand, locked]);

  const totalHours = Object.values(result.hours).reduce((a, b) => a + b, 0);
  const gapHours = result.gaps.reduce((a, g) => a + (g.to - g.from), 0);
  const understaffed = DAYS.map((_, d) => (demand[d] ?? 0) - coverageFor(staff, result.grid, d)).filter(
    (n) => n > 0,
  ).length;

  function regenerate() {
    setGeneratedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    const kept = Object.keys(locked).length;
    toast.success("Week generated from availability", {
      description: kept ? `${kept} locked shift${kept > 1 ? "s" : ""} kept as-is.` : "All shifts rebuilt.",
    });
  }

  function toggleLock(staffId: string, day: number) {
    const key = `${staffId}:${day}`;
    setLocked((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
        toast("Shift unlocked", { description: "It can change on the next generate." });
      } else {
        const sh = result.grid[key];
        if (!sh || sh.to - sh.from <= 0) {
          toast.error("Nothing to lock on this day");
          return prev;
        }
        next[key] = { ...sh, source: "locked" };
        toast.success("Shift locked");
      }
      return next;
    });
  }

  function setShift(staffId: string, day: number, from: number, to: number) {
    const key = `${staffId}:${day}`;
    if (to <= from) {
      toast.error("End time must be after the start time");
      return;
    }
    setLocked((prev) => ({ ...prev, [key]: { from, to, source: "locked" } }));
  }

  function clearShift(staffId: string, day: number) {
    const key = `${staffId}:${day}`;
    setLocked((prev) => ({ ...prev, [key]: { from: 0, to: 0, source: "locked" } }));
    toast("Shift cleared");
  }

  function updateAvailability(
    staffId: string,
    day: number,
    patch: Partial<{ status: AvailStatus; from: number; to: number; note: string }>,
  ) {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === staffId
          ? {
              ...s,
              week: s.week.map((w, i) => (i === day ? { ...w, ...patch } : w)),
            }
          : s,
      ),
    );
  }

  function toggleLeave(staffId: string, day: number) {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === staffId
          ? {
              ...s,
              leave: s.leave.includes(day) ? s.leave.filter((d) => d !== day) : [...s.leave, day],
            }
          : s,
      ),
    );
  }

  function setCaps(staffId: string, patch: Partial<Pick<Staff, "minWeekly" | "maxWeekly">>) {
    setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, ...patch } : s)));
  }

  return (
    <AppShell
      title="Rota"
      subtitle="Week of Oct 21"
      actions={
        <button
          onClick={regenerate}
          className="h-10 px-5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 shadow-sm whitespace-nowrap"
        >
          <Sparkles className="size-4" /> Generate week
        </button>
      }
    >
      <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-10 pb-6 lg:pb-10 space-y-4">
        {/* Stats + tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-2xl bg-card ring-1 ring-black/5 p-1">
            {(["rota", "availability"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={
                  "h-9 px-4 rounded-xl text-sm font-semibold capitalize transition-colors " +
                  (tab === t ? "bg-primary text-primary-foreground" : "text-ink-muted hover:text-ink")
                }
              >
                {t === "rota" ? "Weekly rota" : "Availability"}
              </button>
            ))}
          </div>

          <Stat icon={Users} label="Scheduled" value={`${totalHours}h`} />
          <Stat
            icon={AlertTriangle}
            label="Uncovered"
            value={`${gapHours}h`}
            tone={gapHours ? "accent" : undefined}
          />
          <Stat
            icon={CalendarCheck}
            label="Short-staffed days"
            value={String(understaffed)}
            tone={understaffed ? "accent" : undefined}
          />
          {generatedAt && (
            <span className="text-xs text-ink-muted">Generated at {generatedAt}</span>
          )}
        </div>

        {tab === "rota" ? (
          <RotaBoard
            staff={staff}
            demand={demand}
            setDemand={setDemand}
            grid={result.grid}
            hours={result.hours}
            gaps={result.gaps}
            onToggleLock={toggleLock}
            onSetShift={setShift}
            onClear={clearShift}
          />
        ) : (
          <AvailabilityBoard
            staff={staff}
            onUpdate={updateAvailability}
            onToggleLeave={toggleLeave}
            onCaps={setCaps}
          />
        )}
      </div>
    </AppShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone?: "accent";
}) {
  return (
    <div className="h-11 px-4 rounded-2xl bg-card ring-1 ring-black/5 flex items-center gap-2.5">
      <Icon className={"size-4 " + (tone === "accent" ? "text-accent" : "text-ink-muted")} />
      <span className="text-[10px] uppercase tracking-widest text-ink-muted">{label}</span>
      <span
        className={"text-sm font-mono font-semibold " + (tone === "accent" ? "text-accent" : "text-ink")}
      >
        {value}
      </span>
    </div>
  );
}

/* ---------------------------------- Rota --------------------------------- */

function RotaBoard({
  staff,
  demand,
  setDemand,
  grid,
  hours,
  gaps,
  onToggleLock,
  onSetShift,
  onClear,
}: {
  staff: Staff[];
  demand: number[];
  setDemand: (fn: (d: number[]) => number[]) => void;
  grid: Record<string, Shift>;
  hours: Record<string, number>;
  gaps: { day: number; from: number; to: number }[];
  onToggleLock: (id: string, day: number) => void;
  onSetShift: (id: string, day: number, from: number, to: number) => void;
  onClear: (id: string, day: number) => void;
}) {
  return (
    <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <Legend color="bg-primary/10 ring-1 ring-primary/20" label="Auto-generated" />
          <Legend color="bg-ink" label="Manually locked" />
          <Legend color="bg-secondary" label="Approved leave" />
          <Legend color="bg-accent/12 ring-1 ring-accent/25" label="Uncovered" tone="accent" />
        </div>
        <p className="text-xs text-ink-muted">
          Click a shift to edit or lock it · re-generating preserves locked shifts.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div
          className="min-w-[860px] grid gap-2"
          style={{ gridTemplateColumns: "200px repeat(7, minmax(0, 1fr))" }}
        >
          <div />
          {DAYS.map((d, i) => {
            const covered = staff.filter((s) => {
              const sh = grid[`${s.id}:${i}`];
              return sh && (sh.source === "auto" || sh.source === "locked");
            }).length;
            const need = demand[i] ?? 0;
            return (
              <div key={d} className="px-2 py-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">
                  {d} {DAY_DATES[i]}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={
                      "text-[10px] font-mono px-1.5 py-0.5 rounded " +
                      (covered < need ? "bg-accent/12 text-accent" : "bg-primary/10 text-primary")
                    }
                  >
                    {covered}/{need}
                  </span>
                  <button
                    aria-label={`Decrease staff needed on ${d}`}
                    onClick={() =>
                      setDemand((prev) => prev.map((n, j) => (j === i ? Math.max(0, n - 1) : n)))
                    }
                    className="size-5 rounded-md ring-1 ring-black/10 text-ink-muted hover:text-ink flex items-center justify-center"
                  >
                    <Minus className="size-3" />
                  </button>
                  <button
                    aria-label={`Increase staff needed on ${d}`}
                    onClick={() =>
                      setDemand((prev) => prev.map((n, j) => (j === i ? Math.min(staff.length, n + 1) : n)))
                    }
                    className="size-5 rounded-md ring-1 ring-black/10 text-ink-muted hover:text-ink flex items-center justify-center"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {staff.map((s) => (
            <RotaRow
              key={s.id}
              staff={s}
              grid={grid}
              hours={hours[s.id] ?? 0}
              onToggleLock={onToggleLock}
              onSetShift={onSetShift}
              onClear={onClear}
            />
          ))}

          <div className="py-3 px-2">
            <p className="text-sm font-semibold text-accent flex items-center gap-1.5">
              <AlertTriangle className="size-3.5" /> Uncovered
            </p>
            <p className="text-[10px] uppercase tracking-widest text-ink-muted">Warning</p>
          </div>
          {DAYS.map((_, i) => {
            const dayGaps = gaps.filter((g) => g.day === i);
            return (
              <div
                key={i}
                className={
                  "min-h-14 rounded-xl px-2 py-2 flex flex-col items-center justify-center gap-0.5 text-[11px] font-mono " +
                  (dayGaps.length
                    ? "bg-accent/12 text-accent ring-1 ring-accent/25"
                    : "text-ink-muted/60")
                }
              >
                {dayGaps.length
                  ? dayGaps.map((g, k) => <span key={k}>{fmtRange(g.from, g.to)}</span>)
                  : "—"}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RotaRow({
  staff,
  grid,
  hours,
  onToggleLock,
  onSetShift,
  onClear,
}: {
  staff: Staff;
  grid: Record<string, Shift>;
  hours: number;
  onToggleLock: (id: string, day: number) => void;
  onSetShift: (id: string, day: number, from: number, to: number) => void;
  onClear: (id: string, day: number) => void;
}) {
  const under = hours < staff.minWeekly;
  return (
    <>
      <div className="py-3 px-2">
        <p className="text-sm font-semibold text-ink">{staff.name}</p>
        <p className="text-[10px] uppercase tracking-widest text-ink-muted">{staff.role}</p>
        <p
          className={
            "mt-1 text-[11px] font-mono " + (under ? "text-accent" : "text-ink-muted")
          }
        >
          {hours}h · target {staff.minWeekly}–{staff.maxWeekly}h
        </p>
      </div>
      {DAYS.map((_, d) => {
        const sh = grid[`${staff.id}:${d}`] ?? { from: 0, to: 0, source: "off" as const };
        const empty = sh.to - sh.from <= 0;
        const cls =
          sh.source === "leave"
            ? "bg-secondary text-ink-muted"
            : sh.source === "locked" && !empty
              ? "bg-ink text-background"
              : !empty
                ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                : "bg-transparent text-ink-muted/60 ring-1 ring-dashed ring-black/10";
        return (
          <Popover key={d}>
            <PopoverTrigger asChild>
              <button
                className={
                  "h-14 rounded-xl px-2 flex items-center justify-center gap-1 text-xs font-mono font-medium transition-colors hover:opacity-90 " +
                  cls
                }
              >
                {sh.source === "leave" ? "Leave" : empty ? "Off" : fmtRange(sh.from, sh.to)}
                {sh.source === "locked" && !empty && <Lock className="size-3" />}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-ink">{staff.name}</p>
                <p className="text-xs text-ink-muted">
                  {DAYS[d]} {DAY_DATES[d]} · available{" "}
                  {staff.week[d]!.status === "unavailable"
                    ? "never"
                    : fmtRange(staff.week[d]!.from, staff.week[d]!.to)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TimeSelect
                  label="Start"
                  value={empty ? staff.week[d]!.from : sh.from}
                  onChange={(v) => onSetShift(staff.id, d, v, empty ? staff.week[d]!.to : sh.to)}
                />
                <TimeSelect
                  label="End"
                  value={empty ? staff.week[d]!.to : sh.to}
                  onChange={(v) => onSetShift(staff.id, d, empty ? staff.week[d]!.from : sh.from, v)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onToggleLock(staff.id, d)}
                  className="flex-1 h-9 rounded-xl ring-1 ring-black/10 text-xs font-semibold text-ink flex items-center justify-center gap-1.5 hover:bg-secondary/50"
                >
                  {sh.source === "locked" ? (
                    <>
                      <LockOpen className="size-3.5" /> Unlock
                    </>
                  ) : (
                    <>
                      <Lock className="size-3.5" /> Lock
                    </>
                  )}
                </button>
                <button
                  onClick={() => onClear(staff.id, d)}
                  className="h-9 px-3 rounded-xl ring-1 ring-black/10 text-xs font-semibold text-accent flex items-center gap-1.5 hover:bg-accent/5"
                >
                  <Trash2 className="size-3.5" /> Clear
                </button>
              </div>
            </PopoverContent>
          </Popover>
        );
      })}
    </>
  );
}

function TimeSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-ink-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full h-9 rounded-xl bg-secondary/50 ring-1 ring-black/10 px-2 text-sm font-mono text-ink"
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {fmtHour(h)}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ------------------------------ Availability ----------------------------- */

function AvailabilityBoard({
  staff,
  onUpdate,
  onToggleLeave,
  onCaps,
}: {
  staff: Staff[];
  onUpdate: (
    id: string,
    day: number,
    patch: Partial<{ status: AvailStatus; from: number; to: number; note: string }>,
  ) => void;
  onToggleLeave: (id: string, day: number) => void;
  onCaps: (id: string, patch: Partial<Pick<Staff, "minWeekly" | "maxWeekly">>) => void;
}) {
  return (
    <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <Legend color="bg-primary/15 ring-1 ring-primary/30" label="Preferred" />
          <Legend color="bg-primary/5 ring-1 ring-primary/15" label="Available" />
          <Legend color="bg-black/5" label="Unavailable" />
          <Legend color="bg-secondary" label="Approved leave" />
        </div>
        <p className="text-xs text-ink-muted">
          Click a day to cycle availability · open it for hours, leave and notes.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div
          className="min-w-[900px] grid gap-2"
          style={{ gridTemplateColumns: "230px repeat(7, minmax(0, 1fr))" }}
        >
          <div />
          {DAYS.map((d, i) => (
            <div key={d} className="text-[11px] font-bold uppercase tracking-widest text-ink-muted px-2 py-2">
              {d} {DAY_DATES[i]}
            </div>
          ))}

          {staff.map((s) => (
            <Fragment key={s.id}>
              <div className="py-3 px-2 flex items-start gap-3">
                <div className="size-9 rounded-xl bg-gradient-to-br from-primary/25 to-accent/25 ring-1 ring-black/5 flex items-center justify-center text-[11px] font-bold text-ink shrink-0">
                  {s.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{s.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-ink-muted">{s.role}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <CapInput
                      label="min"
                      value={s.minWeekly}
                      onChange={(v) => onCaps(s.id, { minWeekly: v })}
                    />
                    <CapInput
                      label="max"
                      value={s.maxWeekly}
                      onChange={(v) => onCaps(s.id, { maxWeekly: v })}
                    />
                  </div>
                </div>
              </div>

              {DAYS.map((_, d) => {
                const av = s.week[d]!;
                const onLeave = s.leave.includes(d);
                const cls = onLeave
                  ? "bg-secondary text-ink-muted"
                  : av.status === "preferred"
                    ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                    : av.status === "available"
                      ? "bg-primary/5 text-ink ring-1 ring-primary/15"
                      : "bg-black/5 text-ink-muted/70";
                return (
                  <div key={d} className="relative">
                    <button
                      onClick={() => !onLeave && onUpdate(s.id, d, { status: nextStatus(av.status) })}
                      aria-label={`${s.name} ${DAYS[d]}: ${onLeave ? "on leave" : statusLabel(av.status)}`}
                      className={
                        "w-full h-16 rounded-xl px-2 flex flex-col items-center justify-center gap-0.5 text-[11px] transition-colors " +
                        cls
                      }
                    >
                      <span className="font-semibold flex items-center gap-1">
                        {av.status === "preferred" && !onLeave && <Star className="size-3" />}
                        {onLeave ? "Leave" : statusLabel(av.status)}
                      </span>
                      {!onLeave && av.status !== "unavailable" && (
                        <span className="font-mono">{fmtRange(av.from, av.to)}</span>
                      )}
                      {av.note && !onLeave && (
                        <span className="text-[9px] text-ink-muted truncate max-w-full">{av.note}</span>
                      )}
                    </button>

                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          aria-label={`Edit ${s.name} availability on ${DAYS[d]}`}
                          className="absolute top-1 right-1 size-5 rounded-md bg-card/80 ring-1 ring-black/10 text-ink-muted hover:text-ink flex items-center justify-center"
                        >
                          <Plus className="size-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-4 space-y-3">
                        <p className="text-sm font-semibold text-ink">
                          {s.name} · {DAYS[d]} {DAY_DATES[d]}
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(["preferred", "available", "unavailable"] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() => onUpdate(s.id, d, { status: st })}
                              className={
                                "h-9 rounded-xl text-[11px] font-semibold capitalize " +
                                (av.status === st
                                  ? "bg-primary text-primary-foreground"
                                  : "ring-1 ring-black/10 text-ink-muted hover:text-ink")
                              }
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <TimeSelect
                            label="From"
                            value={av.from}
                            onChange={(v) => onUpdate(s.id, d, { from: v })}
                          />
                          <TimeSelect
                            label="To"
                            value={av.to}
                            onChange={(v) => onUpdate(s.id, d, { to: v })}
                          />
                        </div>
                        <label className="block">
                          <span className="text-[10px] uppercase tracking-widest text-ink-muted">
                            Note
                          </span>
                          <input
                            value={av.note ?? ""}
                            onChange={(e) => onUpdate(s.id, d, { note: e.target.value })}
                            placeholder="e.g. school run, vet appointment"
                            className="mt-1 w-full h-9 rounded-xl bg-secondary/50 ring-1 ring-black/10 px-3 text-sm text-ink"
                          />
                        </label>
                        <button
                          onClick={() => onToggleLeave(s.id, d)}
                          className={
                            "w-full h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 " +
                            (onLeave
                              ? "bg-accent/10 text-accent ring-1 ring-accent/25"
                              : "ring-1 ring-black/10 text-ink hover:bg-secondary/50")
                          }
                        >
                          {onLeave ? <X className="size-3.5" /> : <Check className="size-3.5" />}
                          {onLeave ? "Remove approved leave" : "Mark approved leave"}
                        </button>
                      </PopoverContent>
                    </Popover>
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function CapInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-1 text-[10px] text-ink-muted">
      {label}
      <input
        type="number"
        min={0}
        max={60}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-12 h-6 rounded-md bg-secondary/50 ring-1 ring-black/10 px-1.5 text-[11px] font-mono text-ink"
      />
      h
    </label>
  );
}

function Legend({ color, label, tone }: { color: string; label: string; tone?: "accent" }) {
  return (
    <span className="flex items-center gap-2 text-ink-muted">
      <span className={"size-3 rounded-sm " + color} />
      <span className={tone === "accent" ? "text-accent font-semibold" : ""}>{label}</span>
    </span>
  );
}
