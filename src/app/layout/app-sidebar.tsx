import { useEffect, useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { navigation, type NavGroup } from "@/app/config/navigation";
import { brand } from "@/app/config/brand";
import { useAuth } from "@/app/providers/auth-provider";
import { roleLabels } from "@/features/administration/types/user";
import { fullName, initials } from "@/shared/utils/format";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "solidcare-sidebar-groups-v2";

function groupContainsPath(group: NavGroup, pathname: string) {
  return group.items.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
}

function loadOpenGroups(pathname: string): Record<string, boolean> {
  const defaults: Record<string, boolean> = {};
  for (const group of navigation) {
    defaults[group.label] = groupContainsPath(group, pathname);
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const saved = JSON.parse(raw) as Record<string, boolean>;
    const next = { ...defaults, ...saved };
    for (const group of navigation) {
      if (groupContainsPath(group, pathname)) next[group.label] = true;
    }
    return next;
  } catch {
    return defaults;
  }
}

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  const { user } = useAuth();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") {
      return Object.fromEntries(navigation.map((group) => [group.label, true]));
    }
    return loadOpenGroups(pathname);
  });

  const activeGroupLabel = useMemo(
    () => navigation.find((group) => groupContainsPath(group, pathname))?.label ?? navigation[0]?.label,
    [pathname],
  );

  const [iconFocus, setIconFocus] = useState(activeGroupLabel);

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const group of navigation) {
        if (groupContainsPath(group, pathname) && !next[group.label]) {
          next[group.label] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    if (activeGroupLabel) setIconFocus(activeGroupLabel);
  }, [pathname, activeGroupLabel]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(openGroups));
  }, [openGroups]);

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="sc-ops-rail border-r border-sidebar-border">
      <SidebarHeader className="gap-0 p-0">
        <Link
          to="/dashboard"
          onClick={closeMobile}
          className={cn(
            "sc-ops-brand relative mx-2 mt-2 flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors",
            "hover:bg-sidebar-accent/80",
            collapsed && "justify-center px-0",
          )}
        >
          <span className="sc-ops-brand-mark relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 ring-1 ring-primary/15">
            <img
              src={brand.logoUrl}
              alt=""
              className="size-6 object-contain"
              aria-hidden="true"
            />
            <span className="sc-ops-pulse" aria-hidden="true" />
          </span>
          {!collapsed ? (
            <span className="min-w-0">
              <span className="block font-display text-base font-semibold tracking-[-0.02em] text-sidebar-foreground">
                {brand.name}
              </span>
              <span className="mt-0.5 block truncate font-sans text-[11px] font-medium tracking-wide text-secondary">
                Ops · Care Flow
              </span>
            </span>
          ) : (
            <span className="sr-only">{brand.name}</span>
          )}
        </Link>
        {!collapsed ? (
          <div className="sc-ops-flowline mx-4 mt-3 mb-1" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        ) : null}
      </SidebarHeader>

      <SidebarContent className="sc-ops-content sc-ops-scroll gap-1 px-2 py-2">
        {navigation.map((group) => {
          const isCurrentSection = group.label === activeGroupLabel;
          const isIconFocused = group.label === iconFocus;
          const open = collapsed
            ? isIconFocused
            : Boolean(openGroups[group.label]);
          const GroupIcon = group.icon;

          return (
            <Collapsible
              key={group.label}
              open={open}
              onOpenChange={(next) => {
                if (collapsed) return;
                setOpenGroups((prev) => ({ ...prev, [group.label]: next }));
              }}
              className="group/section"
            >
              <div
                className={cn(
                  "sc-ops-section rounded-xl transition-colors",
                  isCurrentSection && !collapsed && "sc-ops-section-active",
                )}
              >
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={group.label}
                        aria-pressed={isIconFocused}
                        onClick={() => setIconFocus(group.label)}
                        className={cn(
                          "sc-ops-icon-section mx-auto mb-1 flex size-8 items-center justify-center rounded-lg outline-none transition-colors",
                          "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                          isIconFocused
                            ? "bg-primary text-primary-foreground"
                            : "bg-sidebar-accent/80 text-sidebar-foreground hover:bg-sidebar-accent",
                        )}
                      >
                        <GroupIcon className="size-4" aria-hidden="true" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center">
                      {group.label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <CollapsibleTrigger
                    className={cn(
                      "sc-ops-section-trigger flex h-9 w-full items-center gap-2.5 rounded-lg px-2 text-left outline-none",
                      "hover:bg-sidebar-accent/70 focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                      isCurrentSection && "text-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md",
                        isCurrentSection
                          ? "bg-primary text-primary-foreground"
                          : "bg-sidebar-accent text-sidebar-foreground",
                      )}
                    >
                      <GroupIcon className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-display text-[13px] font-semibold tracking-[-0.01em]">
                      {group.label}
                    </span>
                    <span className="font-sans text-[11px] tabular-nums text-sidebar-foreground">
                      {group.items.length}
                    </span>
                    <ChevronRight
                      className={cn(
                        "size-3.5 shrink-0 text-sidebar-foreground transition-transform duration-200",
                        open && "rotate-90",
                      )}
                      aria-hidden="true"
                    />
                  </CollapsibleTrigger>
                )}

                <CollapsibleContent>
                  <div
                    className={cn(
                      "sc-ops-rail-track relative pb-1",
                      !collapsed && "pl-1",
                    )}
                  >
                    <SidebarMenu className={cn("gap-0.5", collapsed && "items-center")}>
                      {group.items.map((item) => {
                        const active = isActive(item.to);
                        return (
                          <SidebarMenuItem key={item.to} className="sc-ops-item">
                            <SidebarMenuButton
                              asChild
                              isActive={active}
                              tooltip={item.label}
                              className={cn(
                                "sc-ops-link relative h-9 rounded-lg transition-all duration-150",
                                !collapsed && "pl-3",
                                active && "sc-ops-link-active shadow-none",
                              )}
                            >
                              <Link to={item.to} onClick={closeMobile}>
                                <item.icon
                                  className={cn(
                                    "size-4 shrink-0 transition-colors",
                                    active ? "text-primary" : "text-sidebar-foreground",
                                  )}
                                  aria-hidden="true"
                                />
                                <span
                                  className={cn(
                                    "truncate font-sans text-[13.5px] tracking-[-0.01em]",
                                    active
                                      ? "font-semibold text-sidebar-accent-foreground"
                                      : "font-medium",
                                  )}
                                >
                                  {item.label}
                                </span>
                                {active && !collapsed ? (
                                  <span
                                    className="ml-auto size-1.5 rounded-full bg-secondary"
                                    aria-hidden="true"
                                  />
                                ) : null}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="gap-2 p-2">
        {!collapsed ? (
          <div className="sc-ops-footer rounded-xl border border-sidebar-border/80 bg-sidebar-accent/40 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-[11px] font-semibold text-primary-foreground">
                {user ? initials(user.firstName, user.lastName) : "SC"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[13px] font-semibold tracking-[-0.01em] text-sidebar-foreground">
                  {user ? fullName(user.firstName, user.lastName) : "SolidCare"}
                </span>
                <span className="block truncate font-sans text-[11px] text-sidebar-foreground">
                  {user ? roleLabels[user.role] : "Espace interne"}
                </span>
              </span>
              <span className="sc-ops-status" title="Système opérationnel" aria-label="En ligne">
                <span />
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex size-8 items-center justify-center rounded-full bg-primary font-display text-[10px] font-semibold text-primary-foreground">
            {user ? initials(user.firstName, user.lastName) : "SC"}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
