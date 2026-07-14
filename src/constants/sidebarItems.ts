import { BarChart3, FolderKanban, Inbox, LayoutDashboard, ScanLine, Settings, Users } from "lucide-react";
import { NAV } from "@/constants/navigation";

export const sidebarItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: NAV.capture.label, url: NAV.capture.path, icon: ScanLine },
  { title: NAV.contacts.label, url: NAV.contacts.path, icon: Users },
  { title: NAV.events.label, url: NAV.events.path, icon: FolderKanban },
  { title: NAV.syncQueue.label, url: NAV.syncQueue.path, icon: Inbox },
  { title: "Insights", url: "/analytics", icon: BarChart3 },
  { title: NAV.preferences.label, url: NAV.preferences.path, icon: Settings },
];
