/** Minimal iCalendar (RFC 5545) builder for grooming appointments. */

export type IcsEvent = {
  uid: string;
  date: string; // yyyy-mm-dd
  start: number; // decimal hour
  span: number; // hours
  title: string;
  description?: string;
  location?: string;
  rrule?: string;
  exdates?: { date: string; start: number }[];
  recurrenceId?: { date: string; start: number };
  cancelled?: boolean;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function icsStamp(date: string, hour: number) {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${date.replace(/-/g, "")}T${pad(h)}${pad(m)}00`;
}

function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function fold(line: string) {
  if (line.length <= 73) return line;
  const chunks: string[] = [line.slice(0, 73)];
  let rest = line.slice(73);
  while (rest.length > 72) {
    chunks.push(" " + rest.slice(0, 72));
    rest = rest.slice(72);
  }
  if (rest) chunks.push(" " + rest);
  return chunks.join("\r\n");
}

export function buildIcs(events: IcsEvent[], calendarName = "Trusted Dog Groomers") {
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(
    now.getUTCDate(),
  )}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Trusted Dog Groomers//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(calendarName)}`,
  ];

  for (const e of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART:${icsStamp(e.date, e.start)}`);
    lines.push(`DTEND:${icsStamp(e.date, e.start + e.span)}`);
    lines.push(`SUMMARY:${esc(e.title)}`);
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    if (e.rrule) lines.push(`RRULE:${e.rrule}`);
    if (e.recurrenceId)
      lines.push(`RECURRENCE-ID:${icsStamp(e.recurrenceId.date, e.recurrenceId.start)}`);
    if (e.exdates?.length)
      lines.push(`EXDATE:${e.exdates.map((x) => icsStamp(x.date, x.start)).join(",")}`);
    lines.push(`STATUS:${e.cancelled ? "CANCELLED" : "CONFIRMED"}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n");
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
