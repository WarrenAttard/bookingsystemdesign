// Rota domain: staff, weekly availability, leave and the week generator.

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const DAY_DATES = ["21", "22", "23", "24", "25", "26", "27"] as const;

export const OPEN = 8;
export const CLOSE = 17;
export const MAX_SHIFT = 8;

export type AvailStatus = "preferred" | "available" | "unavailable";

export type DayAvailability = {
  status: AvailStatus;
  from: number;
  to: number;
  note?: string;
};

export type Staff = {
  id: string;
  name: string;
  initials: string;
  role: string;
  maxWeekly: number;
  minWeekly: number;
  week: DayAvailability[]; // 7 entries, Mon..Sun
  leave: number[]; // day indexes on approved leave
};

export type Shift = {
  from: number;
  to: number;
  source: "auto" | "locked" | "leave" | "off";
};

export type Generated = {
  grid: Record<string, Shift>; // `${staffId}:${day}`
  gaps: { day: number; from: number; to: number }[];
  hours: Record<string, number>;
};

const a = (
  status: AvailStatus,
  from = OPEN,
  to = CLOSE,
  note?: string,
): DayAvailability => ({ status, from, to, note });

export const INITIAL_STAFF: Staff[] = [
  {
    id: "alex",
    name: "Alex Sterling",
    initials: "AS",
    role: "Lead Groomer",
    maxWeekly: 40,
    minWeekly: 32,
    leave: [],
    week: [
      a("preferred"),
      a("preferred"),
      a("preferred"),
      a("available", 10, 17),
      a("available", 8, 13, "School run"),
      a("unavailable"),
      a("unavailable"),
    ],
  },
  {
    id: "maria",
    name: "Maria Rossi",
    initials: "MR",
    role: "Groomer",
    maxWeekly: 36,
    minWeekly: 24,
    leave: [],
    week: [
      a("available", 9, 17),
      a("available", 9, 17),
      a("preferred", 9, 17),
      a("available", 9, 17),
      a("unavailable"),
      a("preferred", 9, 14),
      a("unavailable"),
    ],
  },
  {
    id: "jonas",
    name: "Jonas Tabone",
    initials: "JT",
    role: "Groomer",
    maxWeekly: 30,
    minWeekly: 20,
    leave: [],
    week: [
      a("available", 10, 17),
      a("preferred", 10, 17),
      a("unavailable"),
      a("available", 10, 17),
      a("available", 10, 17),
      a("available", 10, 15),
      a("unavailable"),
    ],
  },
  {
    id: "elena",
    name: "Elena Camilleri",
    initials: "EC",
    role: "Junior Groomer",
    maxWeekly: 24,
    minWeekly: 12,
    leave: [0, 1, 2, 3],
    week: [
      a("available", 10, 15),
      a("available", 10, 15),
      a("available", 10, 15),
      a("available", 10, 15),
      a("preferred", 10, 15),
      a("unavailable"),
      a("unavailable"),
    ],
  },
  {
    id: "david",
    name: "David Xuereb",
    initials: "DX",
    role: "Bather",
    maxWeekly: 20,
    minWeekly: 8,
    leave: [],
    week: [
      a("unavailable"),
      a("available", 12, 17),
      a("available", 12, 17),
      a("unavailable"),
      a("available", 12, 17),
      a("available", 9, 15),
      a("available", 10, 14, "Sunday cover only if needed"),
    ],
  },
];

/** Staff needed on the floor per day (Mon..Sun). */
export const INITIAL_DEMAND = [3, 3, 3, 3, 3, 2, 0];

export function fmtHour(h: number) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function fmtRange(from: number, to: number) {
  return `${fmtHour(from)}–${fmtHour(to)}`;
}

export function statusLabel(s: AvailStatus) {
  return s === "preferred" ? "Preferred" : s === "available" ? "Available" : "Unavailable";
}

export function nextStatus(s: AvailStatus): AvailStatus {
  return s === "unavailable" ? "available" : s === "available" ? "preferred" : "unavailable";
}

/**
 * Build a week from availability. Locked cells are preserved verbatim and the
 * generator fills the rest, honouring windows, leave and weekly hour caps.
 */
export function generateWeek(
  staff: Staff[],
  demand: number[],
  locked: Record<string, Shift>,
): Generated {
  const grid: Record<string, Shift> = {};
  const hours: Record<string, number> = {};
  staff.forEach((s) => (hours[s.id] = 0));

  // Locked shifts come first and consume hours.
  for (const s of staff) {
    for (let d = 0; d < 7; d++) {
      const key = `${s.id}:${d}`;
      const lk = locked[key];
      if (lk) {
        grid[key] = { ...lk, source: "locked" };
        hours[s.id] = (hours[s.id] ?? 0) + (lk.to - lk.from);
      }
    }
  }

  const gaps: Generated["gaps"] = [];

  for (let d = 0; d < 7; d++) {
    const need = demand[d] ?? 0;

    for (const s of staff) {
      if (s.leave.includes(d) && !grid[`${s.id}:${d}`]) {
        grid[`${s.id}:${d}`] = { from: 0, to: 0, source: "leave" };
      }
    }

    let placed = staff.filter((s) => grid[`${s.id}:${d}`]?.source === "locked").length;

    const candidates = staff
      .filter((s) => {
        if (grid[`${s.id}:${d}`]) return false;
        if (s.leave.includes(d)) return false;
        const av = s.week[d]!;
        if (av.status === "unavailable") return false;
        return (hours[s.id] ?? 0) < s.maxWeekly;
      })
      .sort((x, y) => {
        const px = x.week[d]!.status === "preferred" ? 0 : 1;
        const py = y.week[d]!.status === "preferred" ? 0 : 1;
        if (px !== py) return px - py;
        const rx = x.minWeekly - (hours[x.id] ?? 0);
        const ry = y.minWeekly - (hours[y.id] ?? 0);
        return ry - rx;
      });

    for (const s of candidates) {
      if (placed >= need) break;
      const av = s.week[d]!;
      const from = Math.max(av.from, OPEN);
      let to = Math.min(av.to, CLOSE);
      const remaining = s.maxWeekly - (hours[s.id] ?? 0);
      to = Math.min(to, from + Math.min(MAX_SHIFT, remaining));
      if (to - from < 2) continue;
      grid[`${s.id}:${d}`] = { from, to, source: "auto" };
      hours[s.id] = (hours[s.id] ?? 0) + (to - from);
      placed += 1;
    }

    for (const s of staff) {
      if (!grid[`${s.id}:${d}`]) grid[`${s.id}:${d}`] = { from: 0, to: 0, source: "off" };
    }

    if (need > 0) {
      // Coverage gaps: any open hour with nobody working.
      const working = staff
        .map((s) => grid[`${s.id}:${d}`]!)
        .filter((sh) => sh.source === "auto" || sh.source === "locked");
      let cursor = OPEN;
      const sorted = [...working].sort((x, y) => x.from - y.from);
      for (const sh of sorted) {
        if (sh.from > cursor) gaps.push({ day: d, from: cursor, to: Math.min(sh.from, CLOSE) });
        cursor = Math.max(cursor, sh.to);
      }
      if (cursor < CLOSE) gaps.push({ day: d, from: cursor, to: CLOSE });
    }
  }

  return { grid, gaps, hours };
}

export function coverageFor(
  staff: Staff[],
  grid: Record<string, Shift>,
  day: number,
) {
  return staff.filter((s) => {
    const sh = grid[`${s.id}:${day}`];
    return sh && (sh.source === "auto" || sh.source === "locked");
  }).length;
}
