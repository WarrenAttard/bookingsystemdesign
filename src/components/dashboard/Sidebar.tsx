import { Link } from "@tanstack/react-router";
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
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  label: string;
  icon: LucideIcon;
  to: string;
  adminOnly?: boolean;
};

const items: NavItem[] = [
  { label: "Board", icon: LayoutDashboard, to: "/" },
  { label: "Calendar", icon: CalendarDays, to: "/calendar" },
  { label: "Clients", icon: Users, to: "/clients" },
  { label: "Workers", icon: UserCog, to: "/workers", adminOnly: true },
  { label: "Me", icon: User, to: "/me" },
  { label: "Punch", icon: Clock, to: "/punch" },
  { label: "Rota", icon: CalendarClock, to: "/timetable" },
  { label: "Stock", icon: Package, to: "/stock", adminOnly: true },
  { label: "Money", icon: Wallet, to: "/finances", adminOnly: true },
  { label: "Audit", icon: ScrollText, to: "/audit", adminOnly: true },
];

const linkClass =
  "group rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-colors text-ink-muted hover:bg-black/5 hover:text-ink data-[status=active]:bg-primary/10 data-[status=active]:text-primary";

export function Sidebar() {
  return (
    <>
      {/* Desktop rail */}
      <nav
        aria-label="Primary"
        className="hidden md:flex w-24 flex-none flex-col items-center py-6 border-r border-border bg-card"
      >
        <Link
          to="/"
          aria-label="Pawline"
          className="size-12 bg-primary rounded-2xl mb-8 flex items-center justify-center text-primary-foreground shadow-sm"
        >
          <Scissors className="size-5" strokeWidth={2.25} />
        </Link>

        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <Link
                  to={item.to}
                  title={item.label}
                  activeOptions={{ exact: item.to === "/" }}
                  className={"size-14 " + linkClass}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                  <span className="text-[9px] font-medium uppercase tracking-wider">
                    {item.label}
                  </span>
                </Link>
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

      {/* Mobile bottom bar */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="flex gap-1 overflow-x-auto px-2 py-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label} className="flex-none">
                <Link
                  to={item.to}
                  title={item.label}
                  activeOptions={{ exact: item.to === "/" }}
                  className={"h-14 w-16 " + linkClass}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                  <span className="text-[9px] font-medium uppercase tracking-wider">
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
