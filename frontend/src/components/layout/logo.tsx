import { cn } from "@/lib/utils";

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
      <svg
        viewBox="0 0 32 32"
        className="size-8 shrink-0"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill="#0B2748" />
        <path
          d="M8 22 L16 8 L24 22"
          fill="none"
          stroke="#06B6D4"
          strokeWidth="1.6"
        />
        <path d="M11 22 L21 22" stroke="#F59E0B" strokeWidth="1.4" />
        <circle cx="16" cy="16" r="2.2" fill="#F59E0B" />
        <circle cx="16" cy="16" r="5.5" fill="none" stroke="#94A3B8" strokeWidth="1" />
      </svg>
      {!collapsed ? (
        <div className="min-w-0 leading-tight">
          <p className="font-semibold tracking-[0.18em] text-white uppercase">
            Drishti
          </p>
          <p className="text-[10px] tracking-[0.22em] text-cyan-300 uppercase">
            GeoAI
          </p>
        </div>
      ) : null}
    </div>
  );
}
