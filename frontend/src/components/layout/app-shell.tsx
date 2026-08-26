import { useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";

const TITLES: Record<string, string> = {
  "/": "Processing environment",
  "/images": "Orthophoto library",
  "/images/upload": "Ingest raster",
  "/jobs": "Processing jobs",
  "/map": "Map explorer",
  "/features": "GIS features",
  "/review": "Review & QA",
  "/analytics": "Coverage analytics",
  "/exports": "Data export",
  "/settings": "Workspace settings",
};

function titleFor(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/jobs/")) return "Job details";
  if (pathname.startsWith("/images/")) return "Image details";
  if (pathname.startsWith("/features/")) return "Feature details";
  return "DRISHTI GeoAI";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const compact = useMediaQuery("(max-width: 1199px)");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <div className="flex h-dvh overflow-hidden bg-background">
        <div className="hidden h-full xl:flex">
          <Sidebar collapsed={false} />
        </div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          {compact ? (
            <SheetContent side="left" className="p-0">
              <Sidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          ) : null}
        </Sheet>
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setMobileOpen(true)} title={titleFor(pathname)} />
          <main id="main" className="min-h-0 flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
