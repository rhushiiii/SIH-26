import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExportFormat, FeatureType, ImageRecord } from "@/lib/types";

const LAYERS: FeatureType[] = ["BUILDING", "ROAD", "WATERBODY"];

export function ExportPanel({
  images,
  pending,
  onExport,
}: {
  images: ImageRecord[];
  pending?: boolean;
  onExport: (input: {
    image_id: string;
    format: ExportFormat;
    layers: FeatureType[];
  }) => void;
}) {
  const completed = images.filter((i) => i.status === "COMPLETED");
  const [imageId, setImageId] = useState(completed[0]?.image_id ?? "");
  const [format, setFormat] = useState<ExportFormat>("GeoJSON");
  const [layers, setLayers] = useState<FeatureType[]>([...LAYERS]);

  const toggle = (layer: FeatureType) => {
    setLayers((prev) =>
      prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer],
    );
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>Image</Label>
        <Select value={imageId} onValueChange={setImageId}>
          <SelectTrigger>
            <SelectValue placeholder="Select image" />
          </SelectTrigger>
          <SelectContent>
            {completed.map((img) => (
              <SelectItem key={img.image_id} value={img.image_id}>
                {img.filename}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Format</Label>
        <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GeoJSON">GeoJSON</SelectItem>
            <SelectItem value="CSV">CSV</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <fieldset className="space-y-2 sm:col-span-2">
        <legend className="text-xs font-medium text-muted-foreground">Layers</legend>
        <div className="flex flex-wrap gap-4">
          {LAYERS.map((layer) => (
            <label key={layer} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={layers.includes(layer)}
                onCheckedChange={() => toggle(layer)}
              />
              {layer}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="sm:col-span-2">
        <Button
          disabled={!imageId || layers.length === 0 || pending}
          onClick={() => onExport({ image_id: imageId, format, layers })}
        >
          <Download className="size-4" />
          Create export
        </Button>
      </div>
    </div>
  );
}
