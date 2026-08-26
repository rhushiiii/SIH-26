import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConfidenceLevel, FeatureStatus, FeatureType } from "@/lib/types";

export interface FeatureFilters {
  type: FeatureType | "ALL";
  confidence: ConfidenceLevel | "ALL";
  status: FeatureStatus | "ALL";
}

export function FilterPanel({
  value,
  onChange,
  compact = false,
}: {
  value: FeatureFilters;
  onChange: (next: FeatureFilters) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "grid grid-cols-3 gap-2" : "grid gap-3 sm:grid-cols-3"}>
      <div className="space-y-1.5">
        <Label htmlFor="filter-type">Type</Label>
        <Select
          value={value.type}
          onValueChange={(v) => onChange({ ...value, type: v as FeatureFilters["type"] })}
        >
          <SelectTrigger id="filter-type" className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="BUILDING">Building</SelectItem>
            <SelectItem value="ROAD">Road</SelectItem>
            <SelectItem value="WATERBODY">Waterbody</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="filter-conf">Confidence</Label>
        <Select
          value={value.confidence}
          onValueChange={(v) =>
            onChange({ ...value, confidence: v as FeatureFilters["confidence"] })
          }
        >
          <SelectTrigger id="filter-conf" className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All levels</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="filter-status">Status</Label>
        <Select
          value={value.status}
          onValueChange={(v) =>
            onChange({ ...value, status: v as FeatureFilters["status"] })
          }
        >
          <SelectTrigger id="filter-status" className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="AUTO_ACCEPTED">Auto-accepted</SelectItem>
            <SelectItem value="REVIEW_RECOMMENDED">Review recommended</SelectItem>
            <SelectItem value="HUMAN_REVIEW_REQUIRED">Human review required</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="EDITED">Edited</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
