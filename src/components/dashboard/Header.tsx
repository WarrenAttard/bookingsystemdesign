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
    <header className="px-4 sm:px-6 lg:px-10 py-4 lg:h-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:flex lg:justify-between flex-none">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-ink truncate">
          {title}
          {subtitle && (
            <span className="text-ink-muted font-normal italic font-serif ml-2 lg:ml-3">
              {subtitle}
            </span>
          )}
        </h1>
      </div>

      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        {actions && <div className="hidden sm:flex items-center gap-2">{actions}</div>}
        <button
          type="button"
          aria-label="Search"
          className="h-10 lg:h-11 w-10 lg:w-auto lg:pl-4 lg:pr-5 rounded-2xl bg-card ring-1 ring-black/5 text-sm text-ink-muted flex items-center justify-center gap-2 hover:text-ink transition-colors"
        >
          <Search className="size-4 shrink-0" />
          <span className="hidden lg:inline">Search…</span>
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="size-10 lg:size-11 rounded-2xl bg-card ring-1 ring-black/5 flex items-center justify-center text-ink-muted hover:text-ink transition-colors relative shrink-0"
        >
          <Bell className="size-4" />
          <span className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-accent" />
        </button>
        <span className="hidden sm:inline text-[10px] font-mono bg-accent/10 text-accent px-3 py-1.5 rounded-full font-bold uppercase tracking-widest">
          {role} View
        </span>
        <div className="hidden lg:block h-8 w-px bg-border" />
        <div className="hidden lg:block text-right">
          <p className="text-sm font-bold text-ink leading-tight">{userName}</p>
          <p className="text-[10px] text-ink-muted uppercase tracking-tighter">
            {userTitle}
          </p>
        </div>
      </div>

      {actions && (
        <div className="col-span-2 flex sm:hidden items-center gap-2 overflow-x-auto">
          {actions}
        </div>
      )}
    </header>
  );
}
