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
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Header title={title} subtitle={subtitle} role={role} actions={actions} />
        {children}
      </main>
    </div>
  );
}
