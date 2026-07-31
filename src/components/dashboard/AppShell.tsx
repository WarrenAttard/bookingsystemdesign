import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

type AppShellProps = {
  title: string;
  subtitle?: string;
  role?: "Admin" | "Employee";
  actions?: ReactNode;
  children: ReactNode;
};

export function AppShell({
  title,
  subtitle,
  role = "Admin",
  actions,
  children,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen md:h-screen w-full md:overflow-hidden bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0">
        <Header title={title} subtitle={subtitle} role={role} actions={actions} />
        {children}
      </main>
    </div>
  );
}
