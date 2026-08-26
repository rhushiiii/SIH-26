import {
  Crosshair,
  Layers,
  LocateFixed,
  Maximize2,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type BasemapId = "ortho" | "streets" | "light";

export function MapToolbar({
  onZoomIn,
  onZoomOut,
  onLocate,
  onFullscreen,
  onFitAoi,
  basemap,
  onBasemap,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  onFullscreen: () => void;
  onFitAoi: () => void;
  basemap: BasemapId;
  onBasemap: (id: BasemapId) => void;
}) {
  const btn = "size-8 rounded-md bg-card text-navy shadow-[var(--shadow-border)] hover:bg-muted";
  return (
    <div className="pointer-events-auto flex flex-col gap-1.5">
      <div className="flex flex-col overflow-hidden rounded-lg shadow-[var(--shadow-border)]">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" className={btn} onClick={onZoomIn} aria-label="Zoom in">
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom in</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" className={btn} onClick={onZoomOut} aria-label="Zoom out">
              <Minus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom out</TooltipContent>
        </Tooltip>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" className={btn} onClick={onLocate} aria-label="Locate">
            <LocateFixed className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Locate AOI</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" className={btn} onClick={onFitAoi} aria-label="Fit AOI">
            <Crosshair className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Fit survey extent</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" className={btn} onClick={onFullscreen} aria-label="Fullscreen">
            <Maximize2 className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Fullscreen</TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className={btn} aria-label="Basemap">
                <Layers className="size-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="left">Basemap</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" side="left">
          <DropdownMenuLabel>Basemap</DropdownMenuLabel>
          {(
            [
              ["ortho", "Orthophoto (imagery)"],
              ["streets", "Streets"],
              ["light", "Positron (light)"],
            ] as const
          ).map(([id, label]) => (
            <DropdownMenuItem
              key={id}
              onClick={() => onBasemap(id)}
              className={basemap === id ? "bg-muted font-medium" : ""}
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
