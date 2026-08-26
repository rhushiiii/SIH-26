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
  const [selectedImageId, setSelectedImageId] = useState<string>("");
  const [format, setFormat] = useState<ExportFormat>("GeoJSON");
  const [layers, setLayers] = useState<FeatureType[]>([...LAYERS]);

  const activeImageId =
    selectedImageId ||
    completed[0]?.image_id ||
    images[0]?.image_id ||
    "";

  const toggle = (layer: FeatureType) => {
    setLayers((prev) =>
      prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer],
    );
  };

  const imageOptions = completed.length > 0 ? completed : images;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>Image</Label>
        <Select value={activeImageId} onValueChange={setSelectedImageId}>
          <SelectTrigger>
            <SelectValue placeholder="Select image" />
          </SelectTrigger>
          <SelectContent>
            {imageOptions.map((img) => (
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
          disabled={!activeImageId || layers.length === 0 || pending}
          onClick={() => onExport({ image_id: activeImageId, format, layers })}
        >
          <Download className="size-4" />
          Create export
        </Button>
      </div>
    </div>
  );
}
