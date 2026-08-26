import { FEATURE_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface LayerVisibility {
  orthophoto: boolean;
  buildings: boolean;
  roads: boolean;
  waterbodies: boolean;
  lowConfidence: boolean;
}

const ROWS: Array<{
  key: keyof LayerVisibility;
  label: string;
  swatch?: string;
}> = [
  { key: "orthophoto", label: "Orthophoto" },
  { key: "buildings", label: "Buildings", swatch: FEATURE_COLORS.BUILDING },
  { key: "roads", label: "Roads", swatch: FEATURE_COLORS.ROAD },
  { key: "waterbodies", label: "Waterbodies", swatch: FEATURE_COLORS.WATERBODY },
  { key: "lowConfidence", label: "Low confidence", swatch: "#EF4444" },
];

export function MapLayerControl({
  value,
  onChange,
}: {
  value: LayerVisibility;
  onChange: (next: LayerVisibility) => void;
}) {
  return (
    <section
      aria-label="Map layers"
      className="pointer-events-auto w-52 rounded-lg bg-card p-3 shadow-[var(--shadow-border)]"
    >
      <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        Layers
      </p>
      <ul className="space-y-1.5">
        {ROWS.map((row) => (
          <li key={row.key}>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-3.5 accent-indigo"
                checked={value[row.key]}
                onChange={(e) =>
                  onChange({ ...value, [row.key]: e.target.checked })
                }
              />
              {row.swatch ? (
                <span
                  className="size-2.5 rounded-xs"
                  style={{ background: row.swatch }}
                  aria-hidden
                />
              ) : (
                <span className="size-2.5 rounded-xs bg-navy/30" aria-hidden />
              )}
              <span className={cn(!value[row.key] && "text-muted-foreground")}>
                {row.label}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
