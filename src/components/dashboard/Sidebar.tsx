import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserCog,
  Clock,
  CalendarClock,
  Package,
  Wallet,
  ScrollText,
  Scissors,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  adminOnly?: boolean;
};

const items: NavItem[] = [
  { label: "Board", icon: LayoutDashboard, active: true },
  { label: "Calendar", icon: CalendarDays },
  { label: "Clients", icon: Users },
  { label: "Workers", icon: UserCog, adminOnly: true },
  { label: "Punch", icon: Clock },
  { label: "Timetable", icon: CalendarClock },
  { label: "Stock", icon: Package, adminOnly: true },
  { label: "Finances", icon: Wallet, adminOnly: true },
  { label: "Audit", icon: ScrollText, adminOnly: true },
];

export function Sidebar() {
  return (
    <nav
      aria-label="Primary"
      className="w-24 flex-none flex flex-col items-center py-6 border-r border-border bg-card"
    >
      <div className="size-12 bg-primary rounded-2xl mb-10 flex items-center justify-center text-primary-foreground shadow-sm">
        <Scissors className="size-5" strokeWidth={2.25} />
      </div>

      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <button
                type="button"
                aria-current={item.active ? "page" : undefined}
                title={item.label}
                className={
                  "group size-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-colors " +
                  (item.active
                    ? "bg-primary/10 text-primary"
                    : "text-ink-muted hover:bg-black/5 hover:text-ink")
                }
              >
                <Icon className="size-5" strokeWidth={1.75} />
                <span className="text-[9px] font-medium uppercase tracking-wider">
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex flex-col items-center gap-2">
        <div className="size-12 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 ring-1 ring-black/5 flex items-center justify-center text-sm font-bold text-ink">
          AS
        </div>
      </div>
    </nav>
  );
}
