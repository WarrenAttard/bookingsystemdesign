import { AlertTriangle, Heart, Snowflake } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SafetyFlag = "allergy" | "nervous" | "senior";

export type Dog = {
  name: string;
  breed: string;
  owner: string;
  groomer: string;
  groomerInitials: string;
  time: string;
  stage?: string;
  progress?: number;
  flag?: SafetyFlag;
  active?: boolean;
};

const flagMeta: Record<SafetyFlag, { label: string; icon: LucideIcon }> = {
  allergy: { label: "Allergy", icon: AlertTriangle },
  nervous: { label: "Nervous", icon: Heart },
  senior: { label: "Senior", icon: Snowflake },
};

export function DogCard({ dog }: { dog: Dog }) {
  if (dog.active) return <ActiveCard dog={dog} />;
  return <RestingCard dog={dog} />;
}

function RestingCard({ dog }: { dog: Dog }) {
  const Flag = dog.flag ? flagMeta[dog.flag].icon : null;
  return (
    <article className="bg-card p-5 rounded-[28px] shadow-sm ring-1 ring-black/5 flex flex-col gap-4 hover:ring-black/10 transition-shadow">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-none mb-1 text-ink truncate">
            {dog.name}
          </h3>
          <p className="text-sm text-ink-muted truncate">
            {dog.breed} • {dog.owner}
          </p>
        </div>
        {Flag && dog.flag && (
          <span
            title={flagMeta[dog.flag].label}
            className="bg-accent/12 text-accent px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-1 shrink-0"
          >
            <Flag className="size-3" strokeWidth={2.5} />
            {flagMeta[dog.flag].label}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-secondary text-ink text-[11px] font-bold flex items-center justify-center ring-1 ring-black/5">
            {dog.groomerInitials}
          </div>
          <span className="text-xs font-medium text-ink">{dog.groomer}</span>
        </div>
        <div className="font-mono text-xs font-bold text-ink-muted">
          {dog.time}
        </div>
      </div>
    </article>
  );
}

function ActiveCard({ dog }: { dog: Dog }) {
  const Flag = dog.flag ? flagMeta[dog.flag].icon : null;
  return (
    <article className="bg-primary text-primary-foreground p-5 rounded-[28px] shadow-xl shadow-primary/20 ring-2 ring-primary/30 flex flex-col gap-4">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-none mb-1 truncate">
            {dog.name}
          </h3>
          <p className="text-sm opacity-80 truncate">
            {dog.breed} • {dog.owner}
          </p>
        </div>
        {Flag && dog.flag && (
          <span className="bg-white/20 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-1 shrink-0">
            <Flag className="size-3" strokeWidth={2.5} />
            {flagMeta[dog.flag].label}
          </span>
        )}
      </div>

      {typeof dog.progress === "number" && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
            <span>{dog.stage ?? "In progress"}</span>
            <span>{dog.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-foreground"
              style={{ width: `${dog.progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-white/15 text-primary-foreground text-[11px] font-bold flex items-center justify-center ring-1 ring-white/20">
            {dog.groomerInitials}
          </div>
          <span className="text-xs font-medium">{dog.groomer}</span>
        </div>
        <div className="font-mono text-xs font-bold">{dog.time}</div>
      </div>
    </article>
  );
}
