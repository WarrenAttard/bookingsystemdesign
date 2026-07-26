import { DogCard, type Dog } from "./DogCard";

export type ColumnTone =
  | "booked"
  | "pending"
  | "active"
  | "ready"
  | "completed"
  | "cancelled";

const toneClass: Record<ColumnTone, string> = {
  booked: "bg-[var(--status-booked)]",
  pending: "bg-[var(--status-pending)]",
  active: "bg-[var(--status-active)]",
  ready: "bg-[var(--status-ready)]",
  completed: "bg-[var(--status-completed)]",
  cancelled: "bg-[var(--status-cancelled)]",
};

type Props = {
  title: string;
  tone: ColumnTone;
  dogs: Dog[];
  delay?: number;
  emptyLabel?: string;
};

export function StatusColumn({
  title,
  tone,
  dogs,
  delay = 0,
  emptyLabel = "Empty station",
}: Props) {
  return (
    <section
      className="w-80 flex flex-col animate-entrance"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="font-bold flex items-center gap-2.5 text-ink">
          <span className={"size-2 rounded-full " + toneClass[tone]} />
          {title}
          <span className="size-6 bg-black/5 rounded-full flex items-center justify-center text-[11px] font-mono text-ink">
            {dogs.length}
          </span>
        </h2>
      </div>

      {dogs.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-[28px] flex-1 min-h-[180px] flex items-center justify-center">
          <span className="text-xs font-medium text-ink-muted/60">
            {emptyLabel}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {dogs.map((d) => (
            <DogCard key={d.name + d.time} dog={d} />
          ))}
        </div>
      )}
    </section>
  );
}
