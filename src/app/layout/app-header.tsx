import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, UserRound } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/app/providers/auth-provider";
import { initials, fullName } from "@/shared/utils/format";
import { roleLabels } from "@/features/administration/types/user";

function labelFor(segment: string): string {
  return segment.replace(/-/g, " ").replace(/^\w/, (char) => char.toUpperCase());
}

export function AppHeader() {
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur sm:px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-1 hidden h-5 sm:block" />

      <Breadcrumb className="min-w-0">
        <BreadcrumbList>
          <BreadcrumbItem className="hidden sm:block">
            <BreadcrumbLink asChild>
              <Link to="/dashboard">SolidCare</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
            return (
              <span key={`${segment}-${index}`} className="flex items-center gap-2">
                <BreadcrumbSeparator className="hidden sm:block" />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="truncate">{labelFor(segment)}</BreadcrumbPage>
                  ) : (
                    <span className="hidden text-muted-foreground sm:inline">
                      {labelFor(segment)}
                    </span>
                  )}
                </BreadcrumbItem>
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Account menu">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {user ? initials(user.firstName, user.lastName) : <UserRound className="size-4" />}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block truncate text-sm font-medium">
                {user ? fullName(user.firstName, user.lastName) : "Signed out"}
              </span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {user ? `${roleLabels[user.role]} · ${user.email}` : ""}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin/settings">Clinic settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                signOut();
                void navigate({ to: "/login" });
              }}
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
