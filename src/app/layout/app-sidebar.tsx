import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { navigation } from "@/app/config/navigation";
import { brand } from "@/app/config/brand";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (router) => router.location.pathname });

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/dashboard" className="flex items-center gap-2.5 px-1 py-1.5">
          <img
            src={brand.logoUrl}
            alt={`${brand.name} logo`}
            className="size-8 shrink-0 object-contain"
          />
          {!collapsed ? (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-sidebar-foreground">
                {brand.name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">{brand.tagline}</span>
            </span>
          ) : null}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive(item.to)} tooltip={item.label}>
                      <Link to={item.to} className="flex items-center gap-2">
                        <item.icon className="size-4 shrink-0" aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        {!collapsed ? (
          <p className="px-2 pb-1 text-xs text-muted-foreground">Demo data · no real patients</p>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
