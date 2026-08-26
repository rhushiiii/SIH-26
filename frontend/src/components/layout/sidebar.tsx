import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  CheckSquare,
  Download,
  FolderOpen,
  Layers,
  LayoutDashboard,
  Map as MapIcon,
  Settings,
  Workflow,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/layout/logo";
import { getUseMockApi } from "@/lib/config";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/images", label: "Images", icon: FolderOpen },
  { to: "/jobs", label: "Jobs", icon: Workflow },
  { to: "/map", label: "Map Explorer", icon: MapIcon },
  { to: "/features", label: "Features", icon: Layers },
  { to: "/review", label: "Review & QA", icon: CheckSquare },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/exports", label: "Exports", icon: Download },
] as const;

export function Sidebar({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mock, setMock] = useState(true);
  useEffect(() => {
    setMock(getUseMockApi());
  }, []);

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground",
        collapsed ? "w-[72px]" : "w-60",
      )}
    >
      <div className={cn("flex h-14 items-center border-b border-sidebar-border px-4", collapsed && "justify-center px-0")}>
        <Link to="/" onClick={onNavigate} aria-label="DRISHTI GeoAI home">
          <Logo collapsed={collapsed} />
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3" aria-label="Primary">
        {NAV.map((item) => {
          const active =
            item.to === "/"
              ? pathname === "/"
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-white",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed ? <span>{item.label}</span> : <span className="sr-only">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Link
          to="/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-white",
            collapsed && "justify-center px-0",
            pathname.startsWith("/settings") && "bg-sidebar-accent text-white",
          )}
        >
          <Settings className="size-4" />
          {!collapsed ? <span>Settings</span> : <span className="sr-only">Settings</span>}
        </Link>
        {!collapsed ? (
          <div className="mt-2 flex items-center gap-2 rounded-md bg-navy-800 px-2.5 py-2">
            <Activity className="size-3.5 text-cyan-300" />
            <div className="min-w-0">
              <p className="text-[10px] tracking-wider text-sidebar-muted uppercase">
                API mode
              </p>
              <p className="font-mono text-xs text-white">
                {mock ? "MOCK" : "LIVE"}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
