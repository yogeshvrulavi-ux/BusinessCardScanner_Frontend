import { LayoutDashboard, ScanLine } from "lucide-react";
import type { UserRole } from "@/lib/AuthContext";

export type SidebarItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  /** Roles that can see this menu item. If omitted, visible to all authenticated users. */
  roles?: UserRole[];
};

export const sidebarItems: SidebarItem[] = [
  { title: "Dashboard", url: "/scan", icon: LayoutDashboard },
  { title: "Capture Card", url: "/scan", icon: ScanLine },
];

/** Filter sidebar items based on the user's role. */
export function getSidebarItemsForRole(role: UserRole | undefined): SidebarItem[] {
  if (!role) return [];
  return sidebarItems.filter((item) => {
    if (!item.roles) return true; // No restriction
    return item.roles.includes(role);
  });
}
