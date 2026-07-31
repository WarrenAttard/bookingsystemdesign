import { ArrowUpRight } from "lucide-react";

type Stat = { label: string; value: string; hint?: string };

const stats: Stat[] = [
  { label: "Daily Income", value: "€1,482.00", hint: "+12% vs. avg" },
  { label: "Appointments", value: "24", hint: "of 28 booked" },
  { label: "Avg. Ticket", value: "€61.75" },
  { label: "Wages Est.", value: "€412.50", hint: "3 workers on floor" },
];

export function IncomeStrip() {
  return (
    <section className="px-4 sm:px-6 lg:px-10 pb-6 flex-none">
      <div className="bg-ink text-background rounded-3xl p-1 flex items-center shadow-lg shadow-ink/10">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={
              "flex-1 px-7 py-3 " +
              (i < stats.length - 1 ? "border-r border-background/10" : "")
            }
          >
            <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">
              {s.label}
            </p>
            <p className="text-xl font-mono font-medium leading-none">
              {s.value}
            </p>
            {s.hint && (
              <p className="text-[10px] mt-1 opacity-50 tracking-tight">
                {s.hint}
              </p>
            )}
          </div>
        ))}
        <div className="pr-2 pl-2">
          <button
            type="button"
            className="h-12 px-5 bg-accent text-accent-foreground rounded-2xl font-bold text-sm transition-transform active:scale-95 hover:brightness-105 flex items-center gap-2"
          >
            Open Finances
            <ArrowUpRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
