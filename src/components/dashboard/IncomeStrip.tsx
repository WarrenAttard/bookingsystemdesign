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
    <section className="px-4 sm:px-6 lg:px-10 pb-4 lg:pb-6 flex-none">
      <div className="bg-ink text-background rounded-3xl p-3 lg:p-1 grid grid-cols-2 lg:flex lg:items-center gap-2 lg:gap-0 shadow-lg shadow-ink/10">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={
              "lg:flex-1 px-3 py-2 lg:px-7 lg:py-3 " +
              (i < stats.length - 1 ? "lg:border-r lg:border-background/10" : "")
            }
          >
            <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">
              {s.label}
            </p>
            <p className="text-lg lg:text-xl font-mono font-medium leading-none">
              {s.value}
            </p>
            {s.hint && (
              <p className="text-[10px] mt-1 opacity-50 tracking-tight">
                {s.hint}
              </p>
            )}
          </div>
        ))}
        <div className="col-span-2 lg:pr-2 lg:pl-2">
          <button
            type="button"
            className="h-12 w-full lg:w-auto px-5 bg-accent text-accent-foreground rounded-2xl font-bold text-sm transition-transform active:scale-95 hover:brightness-105 flex items-center justify-center gap-2"
          >
            Open Finances
            <ArrowUpRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
