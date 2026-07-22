import {
  Building2,
  Users,
  Contact,
  ScanLine,
  FolderKanban,
  Inbox,
  BarChart3,
  Mail,
  ScrollText,
  Settings,
} from "lucide-react";
import type { UserRole } from "@/lib/AuthContext";

export type SidebarItem = {
  title: string;
  url: string;
  icon: typeof ScanLine;
  /** Roles that can see this menu item. If omitted, visible to all authenticated users. */
  roles?: UserRole[];
};

/**
 * Role-based sidebar. Items are filtered by authenticated user role.
 * Unauthorized routes are still blocked by AuthGate + backend RBAC.
 */
export const sidebarItems: SidebarItem[] = [
  {
    title: "Capture Card",
    url: "/scan",
    icon: ScanLine,
    roles: ["SUPER_ADMIN", "ADMIN", "USER"],
  },
  {
    title: "Admin Management",
    url: "/companies",
    icon: Building2,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "User Management",
    url: "/users",
    icon: Users,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Contacts",
    url: "/contacts",
    icon: Contact,
    roles: ["SUPER_ADMIN", "ADMIN", "USER"],
  },
  {
    title: "Events",
    url: "/events",
    icon: FolderKanban,
    roles: ["ADMIN", "USER"],
  },
  {
    title: "Offline Queue",
    url: "/queue",
    icon: Inbox,
    roles: ["SUPER_ADMIN", "ADMIN", "USER"],
  },
  {
    title: "Analytics / Insights",
    url: "/analytics",
    icon: BarChart3,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Invitation Management",
    url: "/invitations",
    icon: Mail,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Audit Logs",
    url: "/audit",
    icon: ScrollText,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ["SUPER_ADMIN", "ADMIN", "USER"],
  },
];

/** Filter sidebar items based on the user's role. */
export function getSidebarItemsForRole(role: UserRole | undefined): SidebarItem[] {
  if (!role) return [];
  return sidebarItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });
}
