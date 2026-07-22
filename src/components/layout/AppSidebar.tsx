import { Link, useRouterState } from "@tanstack/react-router";
import { AppLogo } from "@/components/brand/AppLogo";
import { getSidebarItemsForRole } from "@/constants/sidebarItems";
import { NAV_SECTION_LABEL } from "@/constants/navigation";
import { useAuth } from "@/lib/AuthContext";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { user } = useAuth();

  const items = getSidebarItemsForRole(user?.role);

  const isActive = (url: string) => {
    if (url === "/scan") {
      return path === "/scan" || path === "/" || path.startsWith("/review");
    }
    return path.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon" className="border-b border-border/60">
      <SidebarHeader className="px-3 pt-4">
        <Link to="/scan" className="flex items-center gap-2.5 px-2 py-1.5">
          <AppLogo size={collapsed ? "sm" : "md"} />
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display text-[15px] font-semibold tracking-tight">NameCardScan</div>
              <div className="text-[11px] text-muted-foreground">Instant Capture, Sync & Connect</div>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
            {NAV_SECTION_LABEL}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="h-10 rounded-[0.5rem] data-[active=true]:rounded-[0.5rem] data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:font-medium"
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && (
                          <span className="text-sm font-medium tracking-tight">{item.title}</span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Role badge */}
        {!collapsed && user?.role && (
          <div className="mt-auto px-3 pb-4">
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-[11px] font-medium text-muted-foreground">
                {user.role === "SUPER_ADMIN" ? "Super Admin" : user.role === "ADMIN" ? "Admin" : "User"}
              </span>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
