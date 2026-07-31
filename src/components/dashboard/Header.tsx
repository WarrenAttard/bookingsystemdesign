import { Bell, Search } from "lucide-react";
import type { ReactNode } from "react";

type HeaderProps = {
  title: string;
  subtitle?: string;
  role?: "Admin" | "Employee";
  userName?: string;
  userTitle?: string;
  actions?: ReactNode;
};

export function Header({
  title,
  subtitle,
  role = "Admin",
  userName = "Alex Sterling",
  userTitle = "Lead Groomer",
  actions,
}: HeaderProps) {
  return (
    <header className="h-20 px-4 sm:px-6 lg:px-10 flex items-center justify-between flex-none">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {title}
          {subtitle && (
            <span className="text-ink-muted font-normal italic font-serif ml-3">
              {subtitle}
            </span>
          )}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <button
          type="button"
          className="h-11 pl-4 pr-5 rounded-2xl bg-card ring-1 ring-black/5 text-sm text-ink-muted flex items-center gap-2 hover:text-ink transition-colors"
        >
          <Search className="size-4" />
          <span>Search…</span>
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="size-11 rounded-2xl bg-card ring-1 ring-black/5 flex items-center justify-center text-ink-muted hover:text-ink transition-colors relative"
        >
          <Bell className="size-4" />
          <span className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-accent" />
        </button>
        <span className="text-[10px] font-mono bg-accent/10 text-accent px-3 py-1.5 rounded-full font-bold uppercase tracking-widest">
          {role} View
        </span>
        <div className="h-8 w-px bg-border" />
        <div className="text-right">
          <p className="text-sm font-bold text-ink leading-tight">{userName}</p>
          <p className="text-[10px] text-ink-muted uppercase tracking-tighter">
            {userTitle}
          </p>
        </div>
      </div>
    </header>
  );
}
