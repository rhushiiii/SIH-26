import { FileUp } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { SUPPORTED_UPLOAD_EXTENSIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function UploadDropzone({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = SUPPORTED_UPLOAD_EXTENSIONS.join(",");

  const handle = useCallback(
    (file?: File) => {
      if (!file || disabled) return;
      onFile(file);
    },
    [disabled, onFile],
  );

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        handle(e.dataTransfer.files[0]);
      }}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center transition-colors",
        over && "border-indigo bg-secondary",
        disabled && "opacity-60",
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-xl bg-navy text-white">
        <FileUp className="size-5" />
      </span>
      <div>
        <p className="text-sm font-semibold text-navy">Drop an orthophoto here</p>
        <p className="mt-1 text-sm text-muted-foreground">
          GeoTIFF, TIFF, PNG, JPG — click to browse
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={accept}
        onChange={(e) => handle(e.target.files?.[0])}
      />
    </button>
  );
}
