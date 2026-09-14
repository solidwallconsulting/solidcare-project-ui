import type { CSSProperties, ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "17.5rem",
          "--sidebar-width-icon": "3.75rem",
          "--sidebar-width-mobile": "min(20rem, 92vw)",
        } as CSSProperties
      }
    >
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <AppHeader />
          <main className="min-w-0 flex-1">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
