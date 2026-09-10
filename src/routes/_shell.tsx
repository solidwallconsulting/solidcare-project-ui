import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/app/layout/app-shell";
import { useAuth } from "@/app/providers/auth-provider";
import { LoadingState } from "@/shared/components/feedback/states";

export const Route = createFileRoute("/_shell")({
  component: ShellLayout,
});

function ShellLayout() {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <LoadingState label="Loading your workspace" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
